"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "메인" },
  { href: "/users", label: "사용자" },
  { href: "/scores", label: "기록" },
  { href: "/tier", label: "서열표" },
  { href: "/random", label: "랜덤" },
  { href: "/rivals", label: "라이벌" },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-white/10 px-6 py-3">
      <div className="flex items-center justify-between sm:justify-start sm:gap-6">
        <Link href="/" className="font-bold text-lg tracking-tight" onClick={() => setOpen(false)}>
          score<span className="text-indigo-400">dp</span>
        </Link>

        <nav className="hidden sm:flex gap-4 text-sm text-white/60">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="메뉴"
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
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
