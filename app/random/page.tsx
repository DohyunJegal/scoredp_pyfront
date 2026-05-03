"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const LEVELS = [8, 9, 10, 11, 12];

const CHART_STYLE: Record<string, { color: string; prefix: string }> = {
  LEGGENDARIA: { color: "#fd067c", prefix: "† " },
  ANOTHER: { color: "inherit", prefix: "" },
  HYPER: { color: "#ffa500", prefix: "" },
};

interface SongItem {
  title: string;
  chart: string;
  level: number;
  unofficial_level: number | null;
}

export default function RandomPage() {
  const [fromLevel, setFromLevel] = useState(12);
  const [fromOptions, setFromOptions] = useState<number[]>([]);
  const [fromUnofficial, setFromUnofficial] = useState<number | null>(null);

  const [toLevel, setToLevel] = useState(12);
  const [toOptions, setToOptions] = useState<number[]>([]);
  const [toUnofficial, setToUnofficial] = useState<number | null>(null);

  const [allOptions, setAllOptions] = useState<Record<number, number[]>>({});
  const [result, setResult] = useState<SongItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  // 마운트 시 전체 레벨의 비공식 난이도 1회 로드
  useEffect(() => {
    fetch(`${API_URL}/unofficial_levels`)
      .then((r) => r.json())
      .then((data: Record<number, number[]>) => {
        setAllOptions(data);
        const fromOpts = data[fromLevel] ?? [];
        const toOpts = data[toLevel] ?? [];
        setFromOptions(fromOpts);
        setToOptions(toOpts);
        setFromUnofficial(fromOpts[0] ?? null);
        setToUnofficial(toOpts[toOpts.length - 1] ?? null);
      })
      .catch(() => {});
  }, []);

  // fromLevel 변경 시 옵션 교체
  useEffect(() => {
    const opts = allOptions[fromLevel] ?? [];
    setFromOptions(opts);
    setFromUnofficial((prev) => (opts.includes(prev!) ? prev : opts[0] ?? null));
  }, [fromLevel, allOptions]);

  // toLevel 변경 시 옵션 교체
  useEffect(() => {
    const opts = allOptions[toLevel] ?? [];
    setToOptions(opts);
    setToUnofficial((prev) => (opts.includes(prev!) ? prev : opts[opts.length - 1] ?? null));
  }, [toLevel, allOptions]);

  async function pick() {
    if (fromUnofficial == null || toUnofficial == null) return;
    setPicking(true);
    setError(null);
    try {
      const url = new URL(`${API_URL}/songs/random`);
      url.searchParams.set("from_level", String(fromLevel));
      url.searchParams.set("from_unofficial", String(fromUnofficial));
      url.searchParams.set("to_level", String(toLevel));
      url.searchParams.set("to_unofficial", String(toUnofficial));
      const r = await fetch(url.toString());
      if (r.status === 404) {
        setError("해당 범위에 곡이 없습니다");
        setResult(null);
      } else {
        setResult(await r.json());
      }
    } catch {
      setError("오류가 발생했습니다");
    } finally {
      setPicking(false);
    }
  }

  const selectCls =
    "bg-[#0f0f1a] border border-white/20 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">랜덤</h1>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* From */}
          <div className="flex items-center gap-2">
            <select
              value={fromLevel}
              onChange={(e) => setFromLevel(Number(e.target.value))}
              className={selectCls}
            >
              {LEVELS.map((lv) => (
                <option key={lv} value={lv}>☆{lv}</option>
              ))}
            </select>
            <select
              value={fromUnofficial ?? ""}
              onChange={(e) => setFromUnofficial(Number(e.target.value))}
              disabled={fromOptions.length === 0}
              className={selectCls}
            >
              {fromOptions.map((v) => (
                <option key={v} value={v}>{v.toFixed(1)}</option>
              ))}
            </select>
          </div>

          <span className="text-white/40">-</span>

          {/* To */}
          <div className="flex items-center gap-2">
            <select
              value={toLevel}
              onChange={(e) => setToLevel(Number(e.target.value))}
              className={selectCls}
            >
              {LEVELS.map((lv) => (
                <option key={lv} value={lv}>☆{lv}</option>
              ))}
            </select>
            <select
              value={toUnofficial ?? ""}
              onChange={(e) => setToUnofficial(Number(e.target.value))}
              disabled={toOptions.length === 0}
              className={selectCls}
            >
              {toOptions.map((v) => (
                <option key={v} value={v}>{v.toFixed(1)}</option>
              ))}
            </select>
          </div>

          <button
            onClick={pick}
            disabled={picking || fromUnofficial == null || toUnofficial == null}
            className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm font-semibold transition-colors"
          >
            {picking ? "뽑는 중" : "뽑기"}
          </button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {result && (
        <div className="border border-indigo-500/40 rounded-lg p-6 flex flex-col gap-3 bg-indigo-950/20">
          <p
            className="text-2xl font-bold leading-tight"
            style={{ color: CHART_STYLE[result.chart]?.color ?? "inherit" }}
          >
            {CHART_STYLE[result.chart]?.prefix}{result.title}
          </p>
          <div className="flex gap-3 text-sm text-white/50">
            {result.unofficial_level != null && (
              <span>☆{result.unofficial_level.toFixed(1)}</span>
            )}
            <span>(☆{result.level} {result.chart})</span>
          </div>
        </div>
      )}
    </div>
  );
}