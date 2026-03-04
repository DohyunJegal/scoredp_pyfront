"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface SongItem {
  title: string;
  chart: string;
  level: number;
  unofficial_level: number | null;
}

const LEVELS = [12, 11, 10, 9, 8];

const CHART_STYLE: Record<string, { color: string; prefix: string }> = {
  LEGGENDARIA: { color: "#fd067c", prefix: "† " },
  ANOTHER: { color: "inherit", prefix: "" },
  HYPER: { color: "#ffa500", prefix: "" },
};

function groupByUnofficialLevel(songs: SongItem[]) {
  const map = new Map<string, SongItem[]>();
  for (const s of songs) {
    const key = s.unofficial_level != null ? s.unofficial_level.toFixed(1) : "?";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries()).sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
}

export default function TierPage() {
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [level, setLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const url = new URL(`${API_URL}/songs`);
    if (level) url.searchParams.set("level", String(level));
    fetch(url.toString())
      .then((r) => r.json())
      .then(setSongs)
      .catch(() => setSongs([]))
      .finally(() => setLoading(false));
  }, [level]);

  const groups = groupByUnofficialLevel(songs);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">서열표</h1>

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

      {loading && <p className="text-white/40 text-sm">불러오는 중…</p>}

      {groups.map(([lvKey, items]) => (
        <section key={lvKey} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-indigo-300 border-b border-white/10 pb-1">
            ☆{lvKey}
            <span className="ml-2 text-white/30 font-normal">{items.length}곡</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5">
            {items.map((item, i) => (
              <div
                key={`${item.title}-${item.chart}-${i}`}
                className="flex items-center p-2 border border-white/10 rounded h-12 min-w-0"
              >
                <span
                  className="text-xs leading-tight line-clamp-2"
                  style={{ color: CHART_STYLE[item.chart]?.color ?? "inherit" }}
                >
                  {CHART_STYLE[item.chart]?.prefix}{item.title}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
