"use client";

import Link from "next/link";
import { useState } from "react";
import { useT, useLocale, Locale } from "./lib/i18n";

const NAV_ITEMS = [
  { href: "/", key: "nav.main" },
  { href: "/users", key: "nav.users" },
  { href: "/scores", key: "nav.scores" },
  { href: "/tier", key: "nav.tier" },
  { href: "/random", key: "nav.random" },
  { href: "/rivals", key: "nav.rivals" },
] as const;

const LOCALES: Locale[] = ["ko", "ja", "en"];

function LangSwitch({ className }: { className?: string }) {
  const [locale, setLocale] = useLocale();
  return (
    <div className={`flex gap-2 text-xs ${className ?? ""}`}>
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`cursor-pointer ${l === locale ? "text-white font-semibold" : "text-white/40 hover:text-white/70"}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <header className="border-b border-white/10 px-6 py-3">
      <div className="flex items-center justify-between sm:justify-start sm:gap-6">
        <Link href="/" className="font-bold text-lg tracking-tight" onClick={() => setOpen(false)}>
          score<span className="text-indigo-400">dp</span>
        </Link>

        <nav className="hidden sm:flex gap-4 text-sm text-white/60">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white transition-colors">
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <LangSwitch className="hidden sm:flex sm:ml-auto" />

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={t("nav.menu")}
          className="sm:hidden text-white/60 hover:text-white p-1 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="sm:hidden flex flex-col gap-1 pt-3 text-sm text-white/60">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="py-1.5 hover:text-white transition-colors"
            >
              {t(item.key)}
            </Link>
          ))}
          <LangSwitch className="pt-2 mt-1 border-t border-white/10" />
        </nav>
      )}
    </header>
  );
}
