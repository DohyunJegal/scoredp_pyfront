"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const bookmarklet = `javascript:$.getScript("${API_URL}/c");`;

export default function HomePage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarklet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-10 max-w-xl">
      <section>
        <h1 className="text-3xl font-bold mb-2">
          score<span className="text-indigo-400">dp</span>
        </h1>
        <p className="text-white/60">beatmania IIDX DP 서열표 기록 사이트</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">데이터 수집 방법</h2>
        <ol className="list-decimal list-inside flex flex-col gap-2 text-sm text-white/80 leading-relaxed">
          <li>
            <a href="https://p.eagate.573.jp" target="_blank" className="text-indigo-400 underline">
              e-amusement
            </a>
            에 로그인합니다.
          </li>
          <li>
            베이직 코스에 가입하지 않으셨다면, 가입을 진행합니다.
          </li>
          <li>
            아래 코드를 콘솔에 입력합니다.
            <div className="mt-2 flex items-center gap-2">
              <code className="block flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-xs font-mono break-all">
                {bookmarklet}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 px-3 py-2 rounded border border-white/20 bg-white/5 hover:bg-white/10 text-xs transition-colors"
              >
                {copied ? "완료" : "복사"}
              </button>
            </div>
          </li>
          <li>크롤러가 정보를 수집해 서버에 전송합니다.</li>
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">참고</h2>
        <a href="https://zasa.sakura.ne.jp/dp/" target="_blank" className="text-indigo-400">
          DP 서열표 사이트
        </a>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">기타</h2>
        <a href="https://ereter.net/" target="_blank" className="text-indigo-400">
          ereter.net
        </a>
        <a href="https://dpoptionz.vercel.app/" target="_blank" className="text-indigo-400">
          Double Play Optionz - DP 배치 추천 사이트
        </a>
        <a href="https://open.kakao.com/o/sHxDbXrh" target="_blank" className="text-indigo-400">
          불쌍한 개발자에게 한 푼 줘야지 (카카오톡 오픈채팅)
        </a>
      </section>
    </div>
  );
}
