import { describe, expect, it } from "vitest";

import { parseCoordinatesString } from "@/lib/pricing";

describe("parseCoordinatesString", () => {
  it("parses valid latitude and longitude", () => {
    expect(parseCoordinatesString("43.6532,-79.3832")).toEqual({ lat: 43.6532, lng: -79.3832 });
  });

  it("rejects out-of-range and malformed coordinates", () => {
    expect(parseCoordinatesString("91,-79")).toBeNull();
    expect(parseCoordinatesString("Toronto")).toBeNull();
    expect(parseCoordinatesString(null)).toBeNull();
  });
});
