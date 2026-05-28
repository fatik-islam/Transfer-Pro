DO $$
BEGIN
  CREATE TYPE "PhoneVerificationPurpose" AS ENUM ('SIGN_UP', 'PHONE_CHANGE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneCountryIso" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pendingPhone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pendingPhoneCountryIso" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "PhoneVerificationCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "phoneCountryIso" TEXT NOT NULL,
  "purpose" "PhoneVerificationPurpose" NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PhoneVerificationCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PhoneVerificationCode_codeHash_key"
  ON "PhoneVerificationCode"("codeHash");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PhoneVerificationCode_userId_fkey'
  ) THEN
    ALTER TABLE "PhoneVerificationCode"
      ADD CONSTRAINT "PhoneVerificationCode_userId_fkey"
      FOREIGN KEY ("userId")
      REFERENCES "User"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

UPDATE "User"
SET "phoneVerifiedAt" = COALESCE("phoneVerifiedAt", "createdAt", CURRENT_TIMESTAMP)
WHERE "phoneVerifiedAt" IS NULL
  AND "phone" IS NOT NULL;
