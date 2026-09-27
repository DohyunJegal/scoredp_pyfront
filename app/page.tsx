"use client";

import { useState } from "react";
import { useT } from "./lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const bookmarklet = `javascript:$.getScript("${API_URL}/c");`;
const bookmarklet_p = `javascript:$.getScript("${API_URL}/p");`;

export default function HomePage() {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const t = useT();

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-10 max-w-xl">
      <section>
        <h1 className="text-3xl font-bold mb-2">
          score<span className="text-indigo-400">dp</span>
        </h1>
        <p className="text-white/60">{t("home.subtitle")}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("home.collect.title")}</h2>
        <ol className="list-decimal list-inside flex flex-col gap-2 text-sm text-white/80 leading-relaxed">
          <li>
            <a href="https://p.eagate.573.jp" target="_blank" className="text-indigo-400 underline">
              e-amusement
            </a>
            {t("home.loginSuffix")}
          </li>
          <li>
            {t("home.collect.step2")}
          </li>
          <li>
            {t("home.collect.step3")}
            <div className="mt-2 flex items-center gap-2">
              <code className="block flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-xs font-mono break-all">
                {bookmarklet}
              </code>
              <button
                onClick={() => handleCopy(bookmarklet, "c")}
                className="shrink-0 px-3 py-2 rounded border border-white/20 bg-white/5 hover:bg-white/10 text-xs transition-colors"
              >
                {copiedType === "c" ? t("home.copied") : t("home.copy")}
              </button>
            </div>
          </li>
          <li>{t("home.collect.step4")}</li>
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("home.batch.title")}</h2>
        <ol className="list-decimal list-inside flex flex-col gap-2 text-sm text-white/80 leading-relaxed">
          <li>
            <a href="https://p.eagate.573.jp" target="_blank" className="text-indigo-400 underline">
              e-amusement
            </a>
            {t("home.loginSuffix")}
          </li>
          <li>
            {t("home.collect.step3")}
            <div className="mt-2 flex items-center gap-2">
              <code className="block flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-xs font-mono break-all">
                {bookmarklet_p}
              </code>
              <button
                onClick={() => handleCopy(bookmarklet_p, "p")}
                className="shrink-0 px-3 py-2 rounded border border-white/20 bg-white/5 hover:bg-white/10 text-xs transition-colors"
              >
                {copiedType === "p" ? t("home.copied") : t("home.copy")}
              </button>
            </div>
          </li>
          <li>{t("home.batch.step4")}</li>
          <li>{t("home.batch.step5")}</li>
          <li>{t("home.batch.step6")}</li>
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("home.reference.title")}</h2>
        <a href="https://zasa.sakura.ne.jp/dp/" target="_blank" className="text-indigo-400">
          {t("home.reference.unofficial")}
        </a>
      </section>

      <section className="flex flex-col gap-3 mb-4">
        <h2 className="text-lg font-semibold">{t("home.misc.title")}</h2>
        <a href="https://ereter.net/" target="_blank" className="text-indigo-400">
          ereter.net
        </a>
        <a href="https://iidx.in/" target="_blank" className="text-indigo-400">
          {t("home.misc.osori")}
        </a>
        <a href="https://dpoptionz.vercel.app/" target="_blank" className="text-indigo-400">
          {t("home.misc.dpoptionz")}
        </a>
        <a href="https://open.kakao.com/o/sHxDbXrh" target="_blank" className="text-indigo-400">
          {t("home.misc.donate")}
        </a>
      </section>
    </div>
  );
}
