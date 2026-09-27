"use client";

import Image from "next/image";
import { useT } from "./lib/i18n";

export default function NotFound() {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <Image src="/404.png" alt="404" width={1408} height={768} className="w-full max-w-lvh h-auto" />
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold">{t("notFound.title")}</h1>
        <p className="text-sm text-white/40">{t("notFound.subtitle")}</p>
      </div>
    </div>
  );
}
