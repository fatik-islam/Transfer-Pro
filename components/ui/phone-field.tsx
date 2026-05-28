"use client";

import { countryPhoneOptions, defaultPhoneCountryIso } from "@/lib/phone";
import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";

export function PhoneField({
  countryName = "phoneCountryIso",
  numberName = "phoneNationalNumber",
  defaultCountryIso,
  defaultNationalNumber,
  required = false,
  className,
  numberPlaceholder = "Mobile number"
}: {
  countryName?: string;
  numberName?: string;
  defaultCountryIso?: string;
  defaultNationalNumber?: string;
  required?: boolean;
  className?: string;
  numberPlaceholder?: string;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]", className)}>
      <select
        name={countryName}
        defaultValue={defaultCountryIso ?? defaultPhoneCountryIso}
        required={required}
        className="block min-h-14 w-full appearance-none rounded-[1.3rem] border border-white/40 bg-white/70 px-4 py-3.5 text-base text-ink shadow-[0_12px_30px_rgba(8,20,38,0.07)] backdrop-blur-xl outline-none transition focus:border-copper/45 focus:bg-white/82 focus:ring-4 focus:ring-copper/10 md:text-[15px]"
      >
        {countryPhoneOptions.map((country) => (
          <option key={country.iso} value={country.iso}>
            {`${country.flag} ${country.dialCode} ${country.name}`}
          </option>
        ))}
      </select>
      <Input
        name={numberName}
        defaultValue={defaultNationalNumber}
        placeholder={numberPlaceholder}
        inputMode="tel"
        autoComplete="tel-national"
        required={required}
      />
    </div>
  );
}
