import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const bookmarklet = `javascript:$.getScript("${API_URL}/c");`;

export default function HomePage() {
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
            <code>javascript:$.getScript("http://localhost:8000/c");</code> 를 콘솔에 입력합니다.
          </li>
          <li>크롤러가 정보를 수집해 서버에 전송합니다.</li> 
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">참고</h2>
        <a href="https://zasa.sakura.ne.jp/dp/" target="_blank" className="text-indigo-400 underline">
          DP 서열표 사이트
        </a>
      </section>
    </div>
  );
}