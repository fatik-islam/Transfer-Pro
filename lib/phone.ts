export type CountryPhoneOption = {
  iso: string;
  name: string;
  flag: string;
  dialCode: string;
};

export const defaultPhoneCountryIso = "CA";

export const countryPhoneOptions: CountryPhoneOption[] = [
  { iso: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
  { iso: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
  { iso: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { iso: "AE", name: "United Arab Emirates", flag: "🇦🇪", dialCode: "+971" },
  { iso: "PK", name: "Pakistan", flag: "🇵🇰", dialCode: "+92" },
  { iso: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
  { iso: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
  { iso: "NZ", name: "New Zealand", flag: "🇳🇿", dialCode: "+64" },
  { iso: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49" },
  { iso: "FR", name: "France", flag: "🇫🇷", dialCode: "+33" },
  { iso: "IT", name: "Italy", flag: "🇮🇹", dialCode: "+39" },
  { iso: "ES", name: "Spain", flag: "🇪🇸", dialCode: "+34" },
  { iso: "NL", name: "Netherlands", flag: "🇳🇱", dialCode: "+31" },
  { iso: "BE", name: "Belgium", flag: "🇧🇪", dialCode: "+32" },
  { iso: "CH", name: "Switzerland", flag: "🇨🇭", dialCode: "+41" },
  { iso: "IE", name: "Ireland", flag: "🇮🇪", dialCode: "+353" },
  { iso: "TR", name: "Turkey", flag: "🇹🇷", dialCode: "+90" },
  { iso: "SA", name: "Saudi Arabia", flag: "🇸🇦", dialCode: "+966" },
  { iso: "QA", name: "Qatar", flag: "🇶🇦", dialCode: "+974" },
  { iso: "KW", name: "Kuwait", flag: "🇰🇼", dialCode: "+965" },
  { iso: "BH", name: "Bahrain", flag: "🇧🇭", dialCode: "+973" },
  { iso: "OM", name: "Oman", flag: "🇴🇲", dialCode: "+968" },
  { iso: "ZA", name: "South Africa", flag: "🇿🇦", dialCode: "+27" },
  { iso: "SG", name: "Singapore", flag: "🇸🇬", dialCode: "+65" },
  { iso: "MY", name: "Malaysia", flag: "🇲🇾", dialCode: "+60" },
  { iso: "TH", name: "Thailand", flag: "🇹🇭", dialCode: "+66" },
  { iso: "CN", name: "China", flag: "🇨🇳", dialCode: "+86" },
  { iso: "JP", name: "Japan", flag: "🇯🇵", dialCode: "+81" },
  { iso: "KR", name: "South Korea", flag: "🇰🇷", dialCode: "+82" },
  { iso: "MX", name: "Mexico", flag: "🇲🇽", dialCode: "+52" }
];

export function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function getCountryPhoneOption(iso?: string | null) {
  const normalizedIso = (iso ?? "").trim().toUpperCase();
  return countryPhoneOptions.find((country) => country.iso === normalizedIso) ?? null;
}

export function normalizePhoneCountryIso(iso?: string | null) {
  return getCountryPhoneOption(iso)?.iso ?? defaultPhoneCountryIso;
}

export function buildPhoneNumber(countryIso: string, nationalNumber: string) {
  const country = getCountryPhoneOption(countryIso);

  if (!country) {
    throw new Error("Select a valid country code.");
  }

  const digits = normalizePhoneDigits(nationalNumber).replace(/^0+/, "");
  const totalDigits = `${normalizePhoneDigits(country.dialCode)}${digits}`;

  if (digits.length < 6) {
    throw new Error("Enter a valid mobile number.");
  }

  if (totalDigits.length > 15) {
    throw new Error("Enter a valid mobile number.");
  }

  return `${country.dialCode}${digits}`;
}

export function inferCountryFromPhone(phone?: string | null) {
  const value = phone?.trim() ?? "";

  if (!value.startsWith("+")) {
    return defaultPhoneCountryIso;
  }

  const match = [...countryPhoneOptions]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((country) => value.startsWith(country.dialCode));

  return match?.iso ?? defaultPhoneCountryIso;
}

export function splitPhoneForField(phone?: string | null, countryIso?: string | null) {
  const resolvedCountryIso = normalizePhoneCountryIso(countryIso ?? inferCountryFromPhone(phone));
  const country = getCountryPhoneOption(resolvedCountryIso);
  const rawDigits = normalizePhoneDigits(phone ?? "");
  const dialDigits = normalizePhoneDigits(country?.dialCode ?? "");
  const nationalNumber =
    rawDigits && dialDigits && rawDigits.startsWith(dialDigits)
      ? rawDigits.slice(dialDigits.length)
      : rawDigits;

  return {
    countryIso: resolvedCountryIso,
    nationalNumber
  };
}

export function maskPhoneNumber(phone?: string | null) {
  const value = phone?.trim() ?? "";

  if (!value) {
    return "your mobile number";
  }

  const visibleTail = value.slice(-4);
  return `${value.slice(0, Math.max(0, value.length - 6))}••${visibleTail}`;
}
