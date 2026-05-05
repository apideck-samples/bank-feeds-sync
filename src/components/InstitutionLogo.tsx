"use client";
import { useState } from "react";
import { Institution, institutionInitials } from "@/lib/institutions";

export default function InstitutionLogo({
  institution,
  size = 36,
}: {
  institution: Institution;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);

  const bgStyle: React.CSSProperties = institution.brandColor
    ? { backgroundColor: institution.brandColor }
    : {};

  if (institution.logoUrl && !broken) {
    return (
      <div
        className={`shrink-0 rounded-full ${
          institution.brandColor ? "" : institution.logoBg
        } flex items-center justify-center overflow-hidden ring-1 ring-white/10`}
        style={{ width: size, height: size, ...bgStyle }}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={institution.logoUrl}
          alt=""
          className="w-[78%] h-[78%] object-contain"
          onError={() => setBroken(true)}
        />
      </div>
    );
  }

  const initials = institutionInitials(institution);
  return (
    <div
      className={`shrink-0 rounded-full ${
        institution.brandColor ? "" : institution.logoBg
      } ${institution.logoText} flex items-center justify-center ring-1 ring-white/10 font-bold tracking-tight`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        ...bgStyle,
      }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
