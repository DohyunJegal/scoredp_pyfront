"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { toPng } from "html-to-image";
import { useSearchParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ScoreItem {
  title: string;
  level: number;
  chart: string;
  unofficial_level: number | null;
  clear_type: number;
  score: number;
  dj_level: string;
}

const CLEAR_LABEL: Record<number, string> = {
  7: "FULL COMBO",
  6: "EX HARD",
  5: "HARD",
  4: "CLEAR",
  3: "EASY",
  2: "ASSIST",
  1: "FAILED",
};

const CLEAR_COLOR: Record<number, string> = {
  7: "linear-gradient(to bottom, #7bdcff, #f1fbfb)",
  6: "#fbfb70",
  5: "#fffffd",
  4: "#2efffd",
  3: "#afe14f",
  2: "#d35ad3",
  1: "#808080",
};

const CHART_STYLE: Record<string, { color: string; prefix: string }> = {
  LEGGENDARIA: { color: "#fd067c", prefix: "† " },
  ANOTHER: { color: "inherit", prefix: "" },
  HYPER: { color: "#ffa500", prefix: "" },
};

const LEVELS = [12, 11, 10, 9, 8];

function SongCard({ item }: { item: ScoreItem }) {
  const color = CLEAR_COLOR[item.clear_type] ?? "bg-zinc-800";
  const hasScore = item.score > 0;
  const chartStyle = CHART_STYLE[item.chart] ?? { color: "inherit", prefix: "" };
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.title.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <>
      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur text-white text-xs px-4 py-2 rounded-full pointer-events-none">
          곡명이 복사되었어요
        </div>
      )}
    <div className="flex flex-row border border-white/10 rounded overflow-hidden h-12 sm:h-14 active:opacity-70" onClick={handleCopy}>
      <div className="flex flex-col justify-between p-1 sm:p-1.5 flex-1 min-w-0">
        <span className="text-[10px] sm:text-xs leading-tight line-clamp-2" style={{ color: chartStyle.color }}>
          {chartStyle.prefix}{item.title}
        </span>
        {hasScore && (
          <span className="text-[8px] sm:text-[10px] text-white/50 font-mono">
            {item.dj_level} {item.score.toLocaleString()}
          </span>
        )}
      </div>
      {item.clear_type > 0 && (
        <div className="w-2 shrink-0" style={{ background: color }} title={CLEAR_LABEL[item.clear_type]} />
      )}
    </div>
    </>
  );
}

function groupByUnofficialLevel(scores: ScoreItem[]) {
  const map = new Map<string, ScoreItem[]>();
  for (const s of scores) {
    const key = s.unofficial_level != null ? s.unofficial_level.toFixed(1) : "?";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries()).sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
}

function ScoresContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const idParam = searchParams.get("id") ?? "";
  const [search, setSearch] = useState(idParam);
  const [level, setLevel] = useState<number | null>(12);
  const [sortByClear, setSortByClear] = useState(false);
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const handleCapture = () => {
    if (!captureRef.current) return;
    toPng(captureRef.current, { backgroundColor: "#0f0f1a", pixelRatio: 4 }).then((url) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = `scoredp_${idParam}_${level}.png`;
      a.click();
    });
  };

  const fetchScores = useCallback(async (id: string, lv: number | null) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_URL}/scores/${encodeURIComponent(id)}`);
      if (lv) url.searchParams.set("level", String(lv));
      const res = await fetch(url.toString());
      if (res.status === 404) throw new Error("사용자를 찾을 수 없어요.");
      if (!res.ok) throw new Error("서버 오류가 발생했습니다.");
      setScores(await res.json());
    } catch (e) {
      setError((e as Error).message);
      setScores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (idParam) {
      setSearch(idParam);
      fetchScores(idParam, level);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam]);

  useEffect(() => {
    if (idParam) fetchScores(idParam, level);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const id = search.trim().replace(/-/g, "");
    if (!id) return;
    router.push(`/scores?id=${id}`);
  };

  const groups = groupByUnofficialLevel(scores).map(([lvKey, items]) => [
    lvKey,
    sortByClear
      ? [...items].sort((a, b) => b.clear_type - a.clear_type || a.title.localeCompare(b.title, 'ja'))
      : items,
  ] as [string, ScoreItem[]]);
  const hasResult = !loading && !error && idParam;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">기록</h1>

      {/* 검색 */}
      <form onSubmit={handleSearch} className="flex gap-2 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="IIDX ID"
          className="px-3 py-1.5 rounded border border-white/20 bg-white/5 text-sm w-48 focus:outline-none focus:border-indigo-400"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-sm transition-colors cursor-pointer"
        >
          조회
        </button>
      </form>

      {idParam && (
        <>
          {/* 레벨 필터 */}
          <div className="flex gap-2 flex-wrap items-center">
            {LEVELS.map((lv) => (
              <button
                key={lv}
                onClick={() => setLevel(lv)}
                className={`px-3 py-1 rounded text-sm border transition-colors cursor-pointer ${
                  level === lv
                    ? "bg-indigo-600 border-indigo-600"
                    : "border-white/20 hover:border-white/40"
                }`}
              >
                ☆{lv}
              </button>
            ))}
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-white/60">
              <input type="checkbox" className="sr-only" checked={sortByClear} onChange={() => setSortByClear((v) => !v)} />
              <span className={`relative inline-block w-9 h-5 rounded-full transition-colors duration-200 ${sortByClear ? "bg-indigo-600" : "bg-white/20"}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${sortByClear ? "translate-x-4" : "translate-x-0"}`} />
              </span>
              램프순
            </label>
            <button
              onClick={handleCapture}
              title="이미지 저장"
              className="p-1 text-white/40 hover:text-white/60 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
            </button>
          </div>

          {/* 범례 */}
          <div className="flex gap-3 flex-wrap text-xs text-white/50">
            {Object.entries(CLEAR_LABEL).sort((a, b) => Number(b[0]) - Number(a[0])).map(([ct, label]) => (
              <span key={ct} className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm" style={{ background: CLEAR_COLOR[Number(ct)] }} />
                {label}
              </span>
            ))}
          </div>
        </>
      )}

      {loading && <p className="text-white/40 text-sm">데이터를 가져오는 중...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {hasResult && groups.length === 0 && (
        <p className="text-white/40 text-sm">스코어 데이터가 비어있어요.</p>
      )}

      {hasResult && scores.length > 0 && (
        <div ref={captureRef} className="flex flex-col gap-6">
          {/* 클리어 집계 바 */}
          <div className="flex text-xs font-mono rounded overflow-hidden max-w-md">
            {Object.entries(CLEAR_LABEL).sort((a, b) => Number(b[0]) - Number(a[0])).map(([ct, label]) => {
              const count = scores.filter(s => s.clear_type === Number(ct)).length;
              return (
                <div
                  key={ct}
                  className="flex items-center justify-center py-0.5 overflow-hidden whitespace-nowrap min-w-[1.5rem]"
                  style={{ background: CLEAR_COLOR[Number(ct)], color: "#111", flexGrow: count, flexBasis: 0 }}
                  title={`${label}: ${count}`}
                >
                  {count}
                </div>
              );
            })}
            <div className="flex items-center justify-center px-2 py-0.5 shrink-0 bg-white/10 text-white/50">
              {scores.length}
            </div>
          </div>

          {groups.map(([lvKey, items]) => (
            <section key={lvKey} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-indigo-300 border-b border-white/10 pb-1">
                ☆{lvKey}
                <span className="ml-2 text-white/30 font-normal">{items.length}곡</span>
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1.5">
                {items.map((item, i) => (
                  <SongCard key={`${item.title}-${item.chart}-${i}`} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScoresPage() {
  return (
    <Suspense>
      <ScoresContent />
    </Suspense>
  );
}