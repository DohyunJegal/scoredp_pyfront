import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "scoredp",
  description: "beatmania IIDX DP 스코어 트래커",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-white/10 px-6 py-3 flex items-center gap-6">
          <Link href="/" className="font-bold text-lg tracking-tight">
            score<span className="text-indigo-400">dp</span>
          </Link>
          <nav className="flex gap-4 text-sm text-white/60">
            <Link href="/" className="hover:text-white transition-colors">메인</Link>
            <Link href="/users" className="hover:text-white transition-colors">사용자</Link>
            <Link href="/scores" className="hover:text-white transition-colors">기록</Link>
            <Link href="/tier" className="hover:text-white transition-colors">서열표</Link>
          </nav>
        </header>
        <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </body>
    </html>
  );
}