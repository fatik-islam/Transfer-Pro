import "server-only";

import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { createRemoteJWKSet, SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  createInsForgeServerClient,
  isInsForgeConfigured,
  unwrapInsForgeResult
} from "@/lib/insforge";
import { queueNotification } from "@/lib/notifications";
import {
  buildPhoneNumber,
  maskPhoneNumber,
  normalizePhoneCountryIso,
  splitPhoneForField
} from "@/lib/phone";
import { demoUsers } from "@/lib/site-data";
import type { AccountProfile, SessionUser, UserRole } from "@/lib/types";

const COOKIE_NAME = "transpro_session";
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PHONE_VERIFICATION_TTL_MS = 15 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "transpro-development-secret-change-me"
);
const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export const sessionCookieName = COOKIE_NAME;

type EmailVerificationPurpose = "SIGN_UP" | "EMAIL_CHANGE";
type PhoneVerificationPurpose = "SIGN_UP" | "PHONE_CHANGE";

type DbUser = {
  id: string;
  role: UserRole;
  email: string;
  pendingEmail: string | null;
  emailVerifiedAt: string | null;
  googleSub: string | null;
  passwordHash: string;
  name: string;
  phone: string | null;
  phoneCountryIso: string | null;
  pendingPhone: string | null;
  pendingPhoneCountryIso: string | null;
  phoneVerifiedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type DbPasswordResetToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

type DbEmailVerificationToken = {
  id: string;
  userId: string;
  tokenHash: string;
  email: string;
  purpose: EmailVerificationPurpose;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

type DbPhoneVerificationCode = {
  id: string;
  userId: string;
  codeHash: string;
  phone: string;
  phoneCountryIso: string;
  purpose: PhoneVerificationPurpose;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

type AuthenticationResult =
  | { status: "SUCCESS"; user: SessionUser }
  | { status: "INVALID" }
  | { status: "UNVERIFIED"; email: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildSessionUser(user: Pick<DbUser, "id" | "role" | "email" | "name">): SessionUser {
  return {
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name
  };
}

export function buildSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  };
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({ role: user.role, email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string) {
  const result = await jwtVerify(token, secret);
  return {
    id: result.payload.sub as string,
    role: result.payload.role as UserRole,
    email: result.payload.email as string,
    name: result.payload.name as string
  } satisfies SessionUser;
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

export async function setSession(user: SessionUser) {
  const token = await createSessionToken(user);
  const store = await cookies();

  store.set(COOKIE_NAME, token, buildSessionCookieOptions());
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

async function loadUserByEmail(email: string) {
  if (!isInsForgeConfigured()) {
    return null;
  }

  const insforge = createInsForgeServerClient();
  return (await unwrapInsForgeResult(
    insforge.database.from("User").select("*").eq("email", normalizeEmail(email)).maybeSingle(),
    "Load user by email"
  )) as DbUser | null;
}

async function loadUserByPendingEmail(email: string) {
  if (!isInsForgeConfigured()) {
    return null;
  }

  const insforge = createInsForgeServerClient();
  return (await unwrapInsForgeResult(
    insforge.database
      .from("User")
      .select("*")
      .eq("pendingEmail", normalizeEmail(email))
      .maybeSingle(),
    "Load user by pending email"
  )) as DbUser | null;
}

async function loadUserByGoogleSub(googleSub: string) {
  if (!isInsForgeConfigured()) {
    return null;
  }

  const insforge = createInsForgeServerClient();
  return (await unwrapInsForgeResult(
    insforge.database.from("User").select("*").eq("googleSub", googleSub).maybeSingle(),
    "Load user by Google subject"
  )) as DbUser | null;
}

async function loadUserById(userId: string) {
  if (!isInsForgeConfigured()) {
    return null;
  }

  const insforge = createInsForgeServerClient();
  return (await unwrapInsForgeResult(
    insforge.database.from("User").select("*").eq("id", userId).maybeSingle(),
    "Load user by id"
  )) as DbUser | null;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function resolveAppUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(path, baseUrl).toString();
}

function buildGoogleRedirectUri() {
  return resolveAppUrl("/auth/google/callback");
}

function toBase64Url(value: Buffer) {
  return value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function ensureCustomerProfile(userId: string) {
  if (!isInsForgeConfigured()) {
    return;
  }

  const insforge = createInsForgeServerClient();
  const existing = await unwrapInsForgeResult(
    insforge.database.from("CustomerProfile").select("id").eq("userId", userId).maybeSingle(),
    "Load customer profile"
  );

  if (existing?.id) {
    return;
  }

  await unwrapInsForgeResult(
    insforge.database.from("CustomerProfile").insert({
      id: `customer_${crypto.randomUUID()}`,
      userId
    }),
    "Create customer profile"
  );
}

async function assertEmailAvailable(email: string, currentUserId?: string) {
  const normalizedEmail = normalizeEmail(email);
  const [activeEmail, pendingEmail] = await Promise.all([
    loadUserByEmail(normalizedEmail),
    loadUserByPendingEmail(normalizedEmail)
  ]);

  if (activeEmail && activeEmail.id !== currentUserId) {
    throw new Error("That email is already being used by another account.");
  }

  if (pendingEmail && pendingEmail.id !== currentUserId) {
    throw new Error("That email is already reserved by another account change.");
  }
}

function generatePhoneVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildStoredPhone(params: { phoneCountryIso: string; phoneNationalNumber: string }) {
  const phoneCountryIso = normalizePhoneCountryIso(params.phoneCountryIso);
  const phone = buildPhoneNumber(phoneCountryIso, params.phoneNationalNumber);

  return {
    phone,
    phoneCountryIso
  };
}

async function queueEmailVerification(params: {
  userId: string;
  email: string;
  name: string;
  purpose: EmailVerificationPurpose;
}) {
  if (!isInsForgeConfigured()) {
    return;
  }

  const insforge = createInsForgeServerClient();
  const now = new Date().toISOString();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS).toISOString();

  await unwrapInsForgeResult(
    insforge.database
      .from("EmailVerificationToken")
      .update({ usedAt: now })
      .eq("userId", params.userId)
      .eq("purpose", params.purpose)
      .is("usedAt", null),
    "Expire previous email verification tokens"
  );

  await unwrapInsForgeResult(
    insforge.database.from("EmailVerificationToken").insert({
      id: `verify_${crypto.randomUUID()}`,
      userId: params.userId,
      tokenHash: hashToken(token),
      email: normalizeEmail(params.email),
      purpose: params.purpose,
      expiresAt
    }),
    "Create email verification token"
  );

  const verificationLink = resolveAppUrl(`/verify-email?token=${token}`);
  const isEmailChange = params.purpose === "EMAIL_CHANGE";

  await queueNotification({
    channel: "EMAIL",
    templateKey: isEmailChange ? "email_change_verification" : "signup_verification",
    to: normalizeEmail(params.email),
    subject: isEmailChange
      ? "Confirm your new Transfer Pro email"
      : "Verify your Transfer Pro email",
    userId: params.userId,
    body: [
      `Hello ${params.name},`,
      "",
      isEmailChange
        ? "Use the link below to confirm the new email address for your Transfer Pro account."
        : "Use the link below to verify your email and activate your Transfer Pro account.",
      verificationLink,
      "",
      isEmailChange
        ? "Your current sign-in email stays active until this link is confirmed."
        : "After verification you can sign in normally.",
      isEmailChange
        ? ""
        : "If an admin created this account for you, use the password they shared with you after verification.",
      "This link expires in 24 hours."
    ].join("\n")
  });
}

export async function sendEmailVerificationForUser(params: {
  userId: string;
  purpose: EmailVerificationPurpose;
  email?: string;
}) {
  if (!isInsForgeConfigured()) {
    return;
  }

  const user = await loadUserById(params.userId);

  if (!user) {
    throw new Error("Account was not found.");
  }

  const targetEmail = normalizeEmail(
    params.email ?? (params.purpose === "EMAIL_CHANGE" ? user.pendingEmail ?? "" : user.email)
  );

  if (!targetEmail) {
    throw new Error("No email is available for verification.");
  }

  await queueEmailVerification({
    userId: user.id,
    email: targetEmail,
    name: user.name,
    purpose: params.purpose
  });
}

async function queuePhoneVerificationCode(params: {
  userId: string;
  phone: string;
  phoneCountryIso: string;
  name: string;
  purpose: PhoneVerificationPurpose;
}) {
  if (!isInsForgeConfigured()) {
    return;
  }

  const insforge = createInsForgeServerClient();
  const now = new Date().toISOString();
  const code = generatePhoneVerificationCode();
  const expiresAt = new Date(Date.now() + PHONE_VERIFICATION_TTL_MS).toISOString();

  await unwrapInsForgeResult(
    insforge.database
      .from("PhoneVerificationCode")
      .update({ usedAt: now })
      .eq("userId", params.userId)
      .eq("purpose", params.purpose)
      .is("usedAt", null),
    "Expire previous phone verification codes"
  );

  await unwrapInsForgeResult(
    insforge.database.from("PhoneVerificationCode").insert({
      id: `phone_code_${crypto.randomUUID()}`,
      userId: params.userId,
      codeHash: hashToken(`${params.userId}:${code}`),
      phone: params.phone,
      phoneCountryIso: params.phoneCountryIso,
      purpose: params.purpose,
      expiresAt
    }),
    "Create phone verification code"
  );

  await queueNotification({
    channel: "SMS",
    templateKey:
      params.purpose === "PHONE_CHANGE" ? "phone_change_verification" : "phone_verification",
    to: params.phone,
    userId: params.userId,
    subject: "Transfer Pro phone verification",
    body: `Transfer Pro verification code: ${code}. This code expires in 15 minutes.`
  });
}

export async function sendPhoneVerificationCodeForUser(params: {
  userId: string;
  purpose: PhoneVerificationPurpose;
}) {
  if (!isInsForgeConfigured()) {
    return;
  }

  const user = await loadUserById(params.userId);

  if (!user) {
    throw new Error("Account was not found.");
  }

  const phone = params.purpose === "PHONE_CHANGE" ? user.pendingPhone : user.phone;
  const phoneCountryIso =
    params.purpose === "PHONE_CHANGE" ? user.pendingPhoneCountryIso : user.phoneCountryIso;

  if (!phone || !phoneCountryIso) {
    throw new Error("No mobile number is available for verification.");
  }

  await queuePhoneVerificationCode({
    userId: user.id,
    phone,
    phoneCountryIso,
    name: user.name,
    purpose: params.purpose
  });
}

export async function resendPhoneVerificationCode(email: string) {
  if (!isInsForgeConfigured()) {
    return;
  }

  const user = await loadUserByEmail(normalizeEmail(email));

  if (!user) {
    return;
  }

  const purpose: PhoneVerificationPurpose =
    user.pendingPhone && user.pendingPhoneCountryIso ? "PHONE_CHANGE" : "SIGN_UP";

  const phone = purpose === "PHONE_CHANGE" ? user.pendingPhone : user.phone;
  const phoneCountryIso =
    purpose === "PHONE_CHANGE" ? user.pendingPhoneCountryIso : user.phoneCountryIso;

  if (!phone || !phoneCountryIso) {
    return;
  }

  await queuePhoneVerificationCode({
    userId: user.id,
    phone,
    phoneCountryIso,
    name: user.name,
    purpose
  });
}

export async function getPhoneVerificationContext(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!isInsForgeConfigured()) {
    return {
      email: normalizedEmail,
      maskedPhone: "your mobile number",
      purpose: "SIGN_UP" as const,
      emailVerifiedAt: new Date().toISOString()
    };
  }

  const user = await loadUserByEmail(normalizedEmail);

  if (!user) {
    return null;
  }

  const purpose: PhoneVerificationPurpose =
    user.pendingPhone && user.pendingPhoneCountryIso ? "PHONE_CHANGE" : "SIGN_UP";
  const phone = purpose === "PHONE_CHANGE" ? user.pendingPhone : user.phone;

  if (!phone) {
    return null;
  }

  return {
    email: user.email,
    maskedPhone: maskPhoneNumber(phone),
    purpose,
    emailVerifiedAt: user.emailVerifiedAt
  };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthenticationResult> {
  const normalizedEmail = normalizeEmail(email);

  if (isInsForgeConfigured()) {
    const user = await loadUserByEmail(normalizedEmail);

    if (!user) {
      return { status: "INVALID" };
    }

    const matches = await bcrypt.compare(password, user.passwordHash);

    if (!matches) {
      return { status: "INVALID" };
    }

    if (!user.emailVerifiedAt) {
      await queueEmailVerification({
        userId: user.id,
        email: user.email,
        name: user.name,
        purpose: "SIGN_UP"
      });

      return {
        status: "UNVERIFIED",
        email: user.email
      };
    }

    return {
      status: "SUCCESS",
      user: buildSessionUser(user)
    };
  }

  const demo = demoUsers.find(
    (item) => item.email === normalizedEmail && item.password === password
  );

  if (!demo) {
    return { status: "INVALID" };
  }

  return {
    status: "SUCCESS",
    user: {
      id: demo.id,
      role: demo.role,
      email: demo.email,
      name: demo.name
    }
  };
}

export async function registerCustomer(params: {
  name: string;
  email: string;
  phoneCountryIso: string;
  phoneNationalNumber: string;
  password: string;
}) {
  const normalizedEmail = normalizeEmail(params.email);
  const normalizedPhone = buildStoredPhone(params);

  if (!isInsForgeConfigured()) {
    return {
      autoSignInUser: {
        id: `demo_${normalizedEmail}`,
        role: "CUSTOMER" as const,
        email: normalizedEmail,
        name: params.name
      },
      email: normalizedEmail,
      phone: normalizedPhone.phone,
      verificationRequired: false
    };
  }

  const existing = await loadUserByEmail(normalizedEmail);
  const passwordHash = await bcrypt.hash(params.password, 10);
  const now = new Date().toISOString();

  if (existing) {
    if (existing.role !== "CUSTOMER") {
      throw new Error("An account with this email already exists.");
    }

    if (existing.emailVerifiedAt) {
      throw new Error("An account with this email already exists. Sign in instead.");
    }

    const insforge = createInsForgeServerClient();

    await unwrapInsForgeResult(
      insforge.database
        .from("User")
        .update({
          name: params.name,
          phone: normalizedPhone.phone,
          phoneCountryIso: normalizedPhone.phoneCountryIso,
          pendingPhone: null,
          pendingPhoneCountryIso: null,
          phoneVerifiedAt: now,
          passwordHash,
          pendingEmail: null,
          updatedAt: now
        })
        .eq("id", existing.id),
      "Update existing customer before verification"
    );

    await ensureCustomerProfile(existing.id);
    await queueEmailVerification({
      userId: existing.id,
      email: normalizedEmail,
      name: params.name,
      purpose: "SIGN_UP"
    });

    return {
      email: normalizedEmail,
      phone: normalizedPhone.phone,
      verificationRequired: true
    };
  }

  await assertEmailAvailable(normalizedEmail);

  const insforge = createInsForgeServerClient();
  const userId = `user_${crypto.randomUUID()}`;

  await unwrapInsForgeResult(
    insforge.database.from("User").insert({
      id: userId,
      role: "CUSTOMER",
      name: params.name,
      email: normalizedEmail,
      phone: normalizedPhone.phone,
      phoneCountryIso: normalizedPhone.phoneCountryIso,
      phoneVerifiedAt: now,
      passwordHash,
      updatedAt: now
    }),
    "Create customer"
  );

  await ensureCustomerProfile(userId);
  await queueEmailVerification({
    userId,
    email: normalizedEmail,
    name: params.name,
    purpose: "SIGN_UP"
  });

  return {
    email: normalizedEmail,
    phone: normalizedPhone.phone,
    verificationRequired: true
  };
}

export async function getAccountProfile(userId: string): Promise<AccountProfile | null> {
  if (!isInsForgeConfigured()) {
    const demo = demoUsers.find((item) => item.id === userId);

    return demo
      ? {
          id: demo.id,
          role: demo.role,
          name: demo.name,
          email: demo.email,
          phone: demo.phone,
          phoneCountryIso: splitPhoneForField(demo.phone).countryIso,
          emailVerifiedAt: new Date().toISOString(),
          phoneVerifiedAt: new Date().toISOString()
        }
      : null;
  }

  const user = await loadUserById(userId);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    phoneCountryIso: user.phoneCountryIso ?? undefined,
    pendingPhone: undefined,
    pendingPhoneCountryIso: undefined,
    pendingEmail: user.pendingEmail ?? undefined,
    emailVerifiedAt: user.emailVerifiedAt,
    phoneVerifiedAt: user.phoneVerifiedAt
  };
}

export async function updateAccountProfile(
  userId: string,
  params: { name: string; email: string; phoneCountryIso: string; phoneNationalNumber: string }
) {
  const normalizedPhone = buildStoredPhone(params);

  if (!isInsForgeConfigured()) {
    const demo = demoUsers.find((item) => item.id === userId);

    return {
      user: {
        id: userId,
        role: demo?.role ?? "CUSTOMER",
        email: normalizeEmail(params.email),
        name: params.name
      } satisfies SessionUser,
      emailChangeRequested: false,
      pendingEmail: undefined,
      phoneChangeRequested: false,
      pendingPhone: undefined
    };
  }

  const current = await loadUserById(userId);

  if (!current) {
    throw new Error("Account was not found.");
  }

  const normalizedEmail = normalizeEmail(params.email);
  const emailChanged = normalizedEmail !== current.email;

  if (emailChanged) {
    await assertEmailAvailable(normalizedEmail, userId);
  }

  const insforge = createInsForgeServerClient();
  const updated = (await unwrapInsForgeResult(
    insforge.database
      .from("User")
      .update({
        name: params.name,
        phone: normalizedPhone.phone,
        phoneCountryIso: normalizedPhone.phoneCountryIso,
        pendingPhone: null,
        pendingPhoneCountryIso: null,
        phoneVerifiedAt: current.phoneVerifiedAt ?? new Date().toISOString(),
        pendingEmail: emailChanged ? normalizedEmail : current.pendingEmail,
        updatedAt: new Date().toISOString()
      })
      .eq("id", userId)
      .select("*")
      .single(),
    "Update account profile"
  )) as DbUser;

  if (emailChanged) {
    await queueEmailVerification({
      userId: updated.id,
      email: normalizedEmail,
      name: updated.name,
      purpose: "EMAIL_CHANGE"
    });
  }

  return {
    user: buildSessionUser(updated),
    emailChangeRequested: emailChanged,
    pendingEmail: updated.pendingEmail ?? undefined,
    phoneChangeRequested: false,
    pendingPhone: undefined
  };
}

export async function changeAccountPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  if (!isInsForgeConfigured()) {
    return;
  }

  const user = await loadUserById(userId);

  if (!user) {
    throw new Error("Account was not found.");
  }

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!matches) {
    throw new Error("Current password was not recognized.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const insforge = createInsForgeServerClient();

  await unwrapInsForgeResult(
    insforge.database
      .from("User")
      .update({
        passwordHash,
        updatedAt: new Date().toISOString()
      })
      .eq("id", userId),
    "Change password"
  );
}

export async function deleteOwnAccount(userId: string, password: string) {
  if (!isInsForgeConfigured()) {
    return;
  }

  const user = await loadUserById(userId);

  if (!user) {
    throw new Error("Account was not found.");
  }

  if (user.role === "ADMIN") {
    throw new Error("Admin accounts cannot be deleted from self-service settings.");
  }

  const matches = await bcrypt.compare(password, user.passwordHash);

  if (!matches) {
    throw new Error("Password was not recognized.");
  }

  const insforge = createInsForgeServerClient();

  if (user.role === "DRIVER") {
    const activeDriverBookings =
      ((await unwrapInsForgeResult(
        insforge.database
          .from("Booking")
          .select("id")
          .eq("driverId", user.id)
          .in("status", [
            "PENDING",
            "PENDING_PAYMENT",
            "CONFIRMED",
            "ASSIGNED",
            "IN_PROGRESS",
            "ARRIVED"
          ]),
        "Load active driver bookings"
      )) as Array<{ id: string }> | null) ?? [];

    if (activeDriverBookings.length > 0) {
      throw new Error("Reassign or complete your active rides before deleting this driver account.");
    }
  }

  if (user.role === "CUSTOMER") {
    const [activeBookings, activeQuotes] = await Promise.all([
      unwrapInsForgeResult(
        insforge.database
          .from("Booking")
          .select("id")
          .eq("customerId", user.id)
          .in("status", [
            "PENDING",
            "PENDING_PAYMENT",
            "CONFIRMED",
            "ASSIGNED",
            "IN_PROGRESS",
            "ARRIVED"
          ]),
        "Load active customer bookings"
      ) as Promise<Array<{ id: string }> | null>,
      unwrapInsForgeResult(
        insforge.database
          .from("RideQuote")
          .select("id")
          .eq("customerId", user.id)
          .in("status", ["PENDING", "OFFER_SENT", "ACCEPTED"]),
        "Load active customer quotes"
      ) as Promise<Array<{ id: string }> | null>
    ]);

    if ((activeBookings ?? []).length > 0 || (activeQuotes ?? []).length > 0) {
      throw new Error("Resolve your active bookings and quote requests before deleting this customer account.");
    }
  }

  await unwrapInsForgeResult(
    insforge.database.from("User").delete().eq("id", user.id),
    "Delete account"
  );
}

export async function requestPasswordReset(email: string) {
  if (!isInsForgeConfigured()) {
    return;
  }

  const user = await loadUserByEmail(normalizeEmail(email));

  if (!user) {
    return;
  }

  const insforge = createInsForgeServerClient();
  const now = new Date().toISOString();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString();

  await unwrapInsForgeResult(
    insforge.database
      .from("PasswordResetToken")
      .update({
        usedAt: now
      })
      .eq("userId", user.id)
      .is("usedAt", null),
    "Expire previous reset tokens"
  );

  await unwrapInsForgeResult(
    insforge.database.from("PasswordResetToken").insert({
      id: `reset_${crypto.randomUUID()}`,
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt
    }),
    "Create password reset token"
  );

  const resetLink = resolveAppUrl(`/reset-password?token=${token}`);

  await queueNotification({
    channel: "EMAIL",
    to: user.email,
    subject: "Reset your Transfer Pro password",
    body: [
      `Hello ${user.name},`,
      "",
      "Use the link below to reset your password.",
      resetLink,
      "",
      "This link expires in 60 minutes."
    ].join("\n")
  });
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  if (!isInsForgeConfigured()) {
    return;
  }

  const insforge = createInsForgeServerClient();
  const record = (await unwrapInsForgeResult(
    insforge.database
      .from("PasswordResetToken")
      .select("*")
      .eq("tokenHash", hashToken(token))
      .is("usedAt", null)
      .gt("expiresAt", new Date().toISOString())
      .maybeSingle(),
    "Load password reset token"
  )) as DbPasswordResetToken | null;

  if (!record) {
    throw new Error("That reset link is invalid or has expired.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const usedAt = new Date().toISOString();

  await unwrapInsForgeResult(
    insforge.database
      .from("User")
      .update({
        passwordHash,
        updatedAt: usedAt
      })
      .eq("id", record.userId),
    "Reset password"
  );

  await unwrapInsForgeResult(
    insforge.database
      .from("PasswordResetToken")
      .update({
        usedAt
      })
      .eq("id", record.id),
    "Consume password reset token"
  );
}

export async function verifyEmailWithToken(token: string) {
  if (!isInsForgeConfigured()) {
    throw new Error("Email verification is not available in demo mode.");
  }

  const insforge = createInsForgeServerClient();
  const usedAt = new Date().toISOString();
  const record = (await unwrapInsForgeResult(
    insforge.database
      .from("EmailVerificationToken")
      .select("*")
      .eq("tokenHash", hashToken(token))
      .is("usedAt", null)
      .gt("expiresAt", usedAt)
      .maybeSingle(),
    "Load email verification token"
  )) as DbEmailVerificationToken | null;

  if (!record) {
    throw new Error("That verification link is invalid or has expired.");
  }

  const user = await loadUserById(record.userId);

  if (!user) {
    throw new Error("The account for this verification link no longer exists.");
  }

  if (record.purpose === "EMAIL_CHANGE") {
    if (user.pendingEmail !== record.email) {
      throw new Error("This email change request is no longer active.");
    }

    const activeEmail = await loadUserByEmail(record.email);

    if (activeEmail && activeEmail.id !== user.id) {
      throw new Error("That email is already being used by another account.");
    }

    await unwrapInsForgeResult(
      insforge.database
        .from("User")
        .update({
          email: record.email,
          pendingEmail: null,
          emailVerifiedAt: usedAt,
          updatedAt: usedAt
        })
        .eq("id", user.id),
      "Confirm email change"
    );
  } else {
    await unwrapInsForgeResult(
      insforge.database
        .from("User")
        .update({
          emailVerifiedAt: usedAt,
          updatedAt: usedAt
        })
        .eq("id", user.id),
      "Verify signup email"
    );
  }

  await unwrapInsForgeResult(
    insforge.database
      .from("EmailVerificationToken")
      .update({ usedAt })
      .eq("userId", user.id)
      .eq("purpose", record.purpose)
      .is("usedAt", null),
    "Consume verification tokens"
  );

  const refreshed = await loadUserById(user.id);

  if (!refreshed) {
    throw new Error("The account could not be reloaded after verification.");
  }

  return {
    purpose: record.purpose,
    email: record.purpose === "EMAIL_CHANGE" ? record.email : refreshed.email,
    user: buildSessionUser(refreshed)
  };
}

export async function verifyPhoneWithCode(email: string, code: string) {
  if (!isInsForgeConfigured()) {
    throw new Error("Phone verification is not available in demo mode.");
  }

  const user = await loadUserByEmail(normalizeEmail(email));

  if (!user) {
    throw new Error("The account for this verification code was not found.");
  }

  const insforge = createInsForgeServerClient();
  const usedAt = new Date().toISOString();
  const record = (await unwrapInsForgeResult(
    insforge.database
      .from("PhoneVerificationCode")
      .select("*")
      .eq("userId", user.id)
      .eq("codeHash", hashToken(`${user.id}:${code}`))
      .is("usedAt", null)
      .gt("expiresAt", usedAt)
      .maybeSingle(),
    "Load phone verification code"
  )) as DbPhoneVerificationCode | null;

  if (!record) {
    throw new Error("That mobile verification code is invalid or has expired.");
  }

  if (record.purpose === "PHONE_CHANGE") {
    if (
      user.pendingPhone !== record.phone ||
      user.pendingPhoneCountryIso !== record.phoneCountryIso
    ) {
      throw new Error("This mobile number change request is no longer active.");
    }

    await unwrapInsForgeResult(
      insforge.database
        .from("User")
        .update({
          phone: record.phone,
          phoneCountryIso: record.phoneCountryIso,
          pendingPhone: null,
          pendingPhoneCountryIso: null,
          phoneVerifiedAt: usedAt,
          updatedAt: usedAt
        })
        .eq("id", user.id),
      "Confirm mobile number change"
    );
  } else {
    await unwrapInsForgeResult(
      insforge.database
        .from("User")
        .update({
          phone: record.phone,
          phoneCountryIso: record.phoneCountryIso,
          phoneVerifiedAt: usedAt,
          updatedAt: usedAt
        })
        .eq("id", user.id),
      "Verify signup mobile number"
    );
  }

  await unwrapInsForgeResult(
    insforge.database
      .from("PhoneVerificationCode")
      .update({ usedAt })
      .eq("userId", user.id)
      .eq("purpose", record.purpose)
      .is("usedAt", null),
    "Consume phone verification codes"
  );

  const refreshed = await loadUserById(user.id);

  if (!refreshed) {
    throw new Error("The account could not be reloaded after mobile verification.");
  }

  return {
    purpose: record.purpose,
    phone: record.phone,
    user: buildSessionUser(refreshed)
  };
}

export function isGoogleAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function createGoogleAuthorizationRequest() {
  if (!isGoogleAuthConfigured()) {
    throw new Error("Google sign-in is not configured.");
  }

  const state = toBase64Url(randomBytes(24));
  const codeVerifier = toBase64Url(randomBytes(32));
  const codeChallenge = toBase64Url(createHash("sha256").update(codeVerifier).digest());
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID as string);
  url.searchParams.set("redirect_uri", buildGoogleRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");

  return {
    authorizationUrl: url.toString(),
    state,
    codeVerifier
  };
}

async function exchangeGoogleCode(code: string, codeVerifier: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirect_uri: buildGoogleRedirectUri(),
      grant_type: "authorization_code",
      code_verifier: codeVerifier
    })
  });

  if (!response.ok) {
    throw new Error("Google sign-in could not be completed.");
  }

  const payload = (await response.json()) as { id_token?: string };

  if (!payload.id_token) {
    throw new Error("Google did not return an identity token.");
  }

  const verified = await jwtVerify(payload.id_token, googleJwks, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const email = typeof verified.payload.email === "string" ? normalizeEmail(verified.payload.email) : "";
  const sub = typeof verified.payload.sub === "string" ? verified.payload.sub : "";
  const name =
    typeof verified.payload.name === "string" && verified.payload.name.trim()
      ? verified.payload.name.trim()
      : "Transfer Pro customer";
  const emailVerified = verified.payload.email_verified === true;

  if (!sub || !email || !emailVerified) {
    throw new Error("Google account email is not verified.");
  }

  return { sub, email, name };
}

export async function signInWithGoogleCode(code: string, codeVerifier: string) {
  if (!isInsForgeConfigured()) {
    throw new Error("Google sign-in requires a configured backend.");
  }

  if (!isGoogleAuthConfigured()) {
    throw new Error("Google sign-in is not configured.");
  }

  const identity = await exchangeGoogleCode(code, codeVerifier);
  const now = new Date().toISOString();
  const insforge = createInsForgeServerClient();

  const directGoogleMatch = await loadUserByGoogleSub(identity.sub);

  if (directGoogleMatch) {
    return buildSessionUser(directGoogleMatch);
  }

  const directEmailMatch = await loadUserByEmail(identity.email);

  if (directEmailMatch) {
    const linked = (await unwrapInsForgeResult(
      insforge.database
        .from("User")
        .update({
          googleSub: identity.sub,
          emailVerifiedAt: directEmailMatch.emailVerifiedAt ?? now,
          updatedAt: now
        })
        .eq("id", directEmailMatch.id)
        .select("*")
        .single(),
      "Link Google account"
    )) as DbUser;

    return buildSessionUser(linked);
  }

  const pendingEmailMatch = await loadUserByPendingEmail(identity.email);

  if (pendingEmailMatch) {
    const promoted = (await unwrapInsForgeResult(
      insforge.database
        .from("User")
        .update({
          email: identity.email,
          pendingEmail: null,
          googleSub: identity.sub,
          emailVerifiedAt: now,
          updatedAt: now
        })
        .eq("id", pendingEmailMatch.id)
        .select("*")
        .single(),
      "Promote pending email from Google sign-in"
    )) as DbUser;

    await unwrapInsForgeResult(
      insforge.database
        .from("EmailVerificationToken")
        .update({ usedAt: now })
        .eq("userId", promoted.id)
        .eq("purpose", "EMAIL_CHANGE")
        .is("usedAt", null),
      "Consume pending email verification tokens after Google sign-in"
    );

    return buildSessionUser(promoted);
  }

  const userId = `user_${crypto.randomUUID()}`;
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 8);

  const created = (await unwrapInsForgeResult(
    insforge.database
      .from("User")
      .insert({
        id: userId,
        role: "CUSTOMER",
        name: identity.name,
        email: identity.email,
        passwordHash,
        googleSub: identity.sub,
        emailVerifiedAt: now,
        updatedAt: now
      })
      .select("*")
      .single(),
    "Create Google customer"
  )) as DbUser;

  await ensureCustomerProfile(created.id);
  return buildSessionUser(created);
}
