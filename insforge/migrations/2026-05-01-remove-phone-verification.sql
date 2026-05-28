UPDATE "User"
SET
  "phone" = COALESCE("pendingPhone", "phone"),
  "phoneCountryIso" = COALESCE("pendingPhoneCountryIso", "phoneCountryIso"),
  "pendingPhone" = NULL,
  "pendingPhoneCountryIso" = NULL,
  "phoneVerifiedAt" = COALESCE("phoneVerifiedAt", "updatedAt", CURRENT_TIMESTAMP);

DELETE FROM "PhoneVerificationCode";
