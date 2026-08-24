import "server-only";

import { jwtVerify, SignJWT } from "jose";

import type { LocationCoordinates, TransferPricingQuote } from "@/lib/types";

const OFFER_TTL_MINUTES = 30;
const encoder = new TextEncoder();

function offerSecret() {
  const value = process.env.JWT_SECRET?.trim();

  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production.");
  }

  return encoder.encode(value || "transpro-local-development-only");
}

export type LockedOfferInput = {
  pickupCoordinates: LocationCoordinates;
  destinationCoordinates: LocationCoordinates;
  pickupCountryCode?: string | null;
  destinationCountryCode?: string | null;
  pickupAt: string;
  returnTrip?: boolean;
};

export type LockedPricingOffer = {
  input: LockedOfferInput;
  quote: TransferPricingQuote;
};

function roundCoordinate(value: number) {
  return Number(value.toFixed(6));
}

function normalizeInput(input: LockedOfferInput) {
  return {
    pickupCoordinates: {
      lat: roundCoordinate(input.pickupCoordinates.lat),
      lng: roundCoordinate(input.pickupCoordinates.lng)
    },
    destinationCoordinates: {
      lat: roundCoordinate(input.destinationCoordinates.lat),
      lng: roundCoordinate(input.destinationCoordinates.lng)
    },
    pickupCountryCode: input.pickupCountryCode?.toLowerCase() ?? "",
    destinationCountryCode: input.destinationCountryCode?.toLowerCase() ?? "",
    pickupAt: new Date(input.pickupAt).toISOString(),
    returnTrip: Boolean(input.returnTrip)
  };
}

export async function signPricingOffer(input: LockedOfferInput, quote: TransferPricingQuote) {
  const expiresAt = new Date(Date.now() + OFFER_TTL_MINUTES * 60000).toISOString();
  const offer = {
    input: normalizeInput(input),
    quote: {
      ...quote,
      offerExpiresAt: expiresAt
    }
  } satisfies LockedPricingOffer;

  const token = await new SignJWT({ offer })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${OFFER_TTL_MINUTES}m`)
    .sign(offerSecret());

  return {
    ...offer.quote,
    offerToken: token
  } satisfies TransferPricingQuote;
}

export async function verifyPricingOffer(token: string) {
  const result = await jwtVerify(token, offerSecret());
  const offer = result.payload.offer as LockedPricingOffer | undefined;

  if (!offer?.input || !offer.quote) {
    throw new Error("The locked fare is invalid. Refresh the offer before booking.");
  }

  return offer;
}

export function offerMatchesInput(offer: LockedPricingOffer, input: LockedOfferInput) {
  const expected = normalizeInput(input);
  const actual = normalizeInput(offer.input);

  return JSON.stringify(actual) === JSON.stringify(expected);
}
