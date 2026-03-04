"use client";

import { useEffect, useState, useCallback } from "react";
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
  7: "bg-yellow-400",
  6: "bg-orange-500",
  5: "bg-red-600",
  4: "bg-blue-500",
  3: "bg-green-500",
  2: "bg-purple-500",
  1: "bg-zinc-500",
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

  return (
    <div className="flex flex-row border border-white/10 rounded overflow-hidden h-14">
      <div className="flex flex-col justify-between p-1.5 flex-1 min-w-0">
        <span className="text-xs leading-tight line-clamp-2" style={{ color: chartStyle.color }}>
          {chartStyle.prefix}{item.title}
        </span>
        {hasScore && (
          <span className="text-[10px] text-white/50 font-mono">
            {item.dj_level} {item.score.toLocaleString()}
          </span>
        )}
      </div>
      {item.clear_type > 0 && (
        <div className={`w-2 shrink-0 ${color}`} title={CLEAR_LABEL[item.clear_type]} />
      )}
    </div>
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

export default function ScoresPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const idParam = searchParams.get("id") ?? "";
  const [search, setSearch] = useState(idParam);
  const [level, setLevel] = useState<number | null>(null);
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = useCallback(async (id: string, lv: number | null) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_URL}/scores/${encodeURIComponent(id)}`);
      if (lv) url.searchParams.set("level", String(lv));
      const res = await fetch(url.toString());
      if (res.status === 404) throw new Error("사용자를 찾을 수 없습니다.");
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

  const groups = groupByUnofficialLevel(scores);
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
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-sm transition-colors"
        >
          조회
        </button>
      </form>

      {idParam && (
        <>
          {/* 레벨 필터 */}
          <div className="flex gap-2 flex-wrap">
            {LEVELS.map((lv) => (
              <button
                key={lv}
                onClick={() => setLevel(lv === level ? null : lv)}
                className={`px-3 py-1 rounded text-sm border transition-colors ${
                  level === lv
                    ? "bg-indigo-600 border-indigo-600"
                    : "border-white/20 hover:border-white/40"
                }`}
              >
                ☆{lv}
              </button>
            ))}
          </div>

          {/* 범례 */}
          <div className="flex gap-3 flex-wrap text-xs text-white/50">
            {Object.entries(CLEAR_LABEL).sort((a, b) => Number(b[0]) - Number(a[0])).map(([ct, label]) => (
              <span key={ct} className="flex items-center gap-1">
                <span className={`inline-block w-2 h-2 rounded-sm ${CLEAR_COLOR[Number(ct)]}`} />
                {label}
              </span>
            ))}
          </div>
        </>
      )}

      {loading && <p className="text-white/40 text-sm">불러오는 중…</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {hasResult && groups.length === 0 && (
        <p className="text-white/40 text-sm">스코어 데이터가 없습니다.</p>
      )}

      {groups.map(([lvKey, items]) => (
        <section key={lvKey} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-indigo-300 border-b border-white/10 pb-1">
            ☆{lvKey}
            <span className="ml-2 text-white/30 font-normal">{items.length}곡</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5">
            {items.map((item, i) => (
              <SongCard key={`${item.title}-${item.chart}-${i}`} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}