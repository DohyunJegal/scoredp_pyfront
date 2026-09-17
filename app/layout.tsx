import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import NavBar from "./NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "scoredp",
  description: "beatmania IIDX DP 스코어 트래커",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full min-w-[344px]">
          {children}
        </main>
      <Analytics />
      </body>
    </html>
  );
}