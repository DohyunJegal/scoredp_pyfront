"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { toPng } from "html-to-image";
import { useSearchParams, useRouter } from "next/navigation";
import { CHART_STYLE, getTitleColor } from "../songStyle";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ScoreItem {
  song_id: number;
  title: string;
  level: number;
  chart: string;
  unofficial_level: number | null;
  version_id: number | null;
  clear_type: number;
  score: number;
  dj_level: string;
}

interface OptionItem {
  song_id: number;
  flip: number;
  left_arr: number;
  right_arr: number;
}

const ARR_LABEL = ['-', 'M', 'R', 'RR', 'SR'];

function formatOption(opt: OptionItem): string {
  const flip = opt.flip ? 'F ' : '';
  return `${flip}${ARR_LABEL[opt.left_arr]}/${ARR_LABEL[opt.right_arr]}`;
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

const LEVELS = [12, 11, 10, 9, 8];

function SongCard({ item, option, editMode, onEdit }: {
  item: ScoreItem;
  option?: OptionItem;
  editMode: boolean;
  onEdit: (item: ScoreItem) => void;
}) {
  const color = CLEAR_COLOR[item.clear_type] ?? "bg-zinc-800";
  const hasScore = item.score > 0;
  const chartStyle = CHART_STYLE[item.chart] ?? { color: "inherit", prefix: "" };
  const titleColor = getTitleColor(item.chart, item.version_id);
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    if (editMode) {
      onEdit(item);
      return;
    }
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
      <div
        className={`flex flex-row border rounded overflow-hidden h-12 sm:h-14 active:opacity-70 cursor-pointer ${editMode ? "border-indigo-400/60" : "border-white/10"}`}
        onClick={handleClick}
      >
        <div className="flex flex-col justify-between p-1 sm:p-1.5 flex-1 min-w-0">
          <span className="text-[10px] sm:text-xs leading-tight line-clamp-2" style={{ color: titleColor }}>
            {chartStyle.prefix}{item.title}
          </span>
          <div className="flex justify-between items-end">
            {hasScore && (
              <span className="text-[8px] sm:text-[10px] text-white/50 font-mono">
                {item.dj_level} {item.score.toLocaleString()}
              </span>
            )}
            {option && (option.flip || option.left_arr || option.right_arr) ? (
              <span className="text-[8px] sm:text-[10px] text-indigo-300/70 font-mono ml-auto">
                {formatOption(option)}
              </span>
            ) : null}
          </div>
        </div>
        {item.clear_type > 0 && (
          <div className="w-2 shrink-0" style={{ background: color }} title={CLEAR_LABEL[item.clear_type]} />
        )}
      </div>
    </>
  );
}

const ARR_OPTIONS = ['None', 'Mirror', 'Random', 'R-Random', 'S-Random'];

function OptionModal({ item, existing, iidxId, password, onSave, onClose }: {
  item: ScoreItem;
  existing?: OptionItem;
  iidxId: string;
  password: string;
  onSave: (updated: OptionItem) => void;
  onClose: () => void;
}) {
  const [flip, setFlip] = useState(existing?.flip ?? 0);
  const [leftArr, setLeftArr] = useState(existing?.left_arr ?? 0);
  const [rightArr, setRightArr] = useState(existing?.right_arr ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iidx_id: iidxId, password, song_id: item.song_id, flip, left_arr: leftArr, right_arr: rightArr }),
      });
      if (res.status === 401) { setError("비밀번호가 올바르지 않습니다."); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onSave({ song_id: item.song_id, flip, left_arr: leftArr, right_arr: rightArr });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const chartStyle = CHART_STYLE[item.chart] ?? { color: "inherit", prefix: "" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 w-80 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold leading-snug line-clamp-2" style={{ color: chartStyle.color }}>
              {chartStyle.prefix}{item.title}
            </span>
            <span className="text-xs text-white/40">
              ☆{item.level}{item.unofficial_level != null ? ` (☆${item.unofficial_level})` : ""}
            </span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 ml-3 shrink-0 cursor-pointer">✕</button>
        </div>

        {/* 3열 그리드: 플립 / 좌측 / 우측 */}
        <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
          {/* 헤더 */}
          {["플립", "좌측", "우측"].map(h => (
            <span key={h} className="text-white/50 text-xs text-center pb-0.5">{h}</span>
          ))}

          {/* None 행 */}
          {[
            { active: flip === 0,     onClick: () => setFlip(0) },
            { active: leftArr === 0,  onClick: () => setLeftArr(0) },
            { active: rightArr === 0, onClick: () => setRightArr(0) },
          ].map((btn, i) => (
            <button key={i} onClick={btn.onClick}
              className={`py-1.5 text-xs rounded border transition-colors cursor-pointer w-full ${btn.active ? "bg-indigo-600 border-indigo-600" : "border-white/20 hover:border-white/40"}`}>
              None
            </button>
          ))}

          {/* Flip / Mirror / Mirror */}
          {[
            { label: "Flip",     active: flip === 1,     onClick: () => setFlip(1) },
            { label: "Mirror",   active: leftArr === 1,  onClick: () => setLeftArr(1) },
            { label: "Mirror",   active: rightArr === 1, onClick: () => setRightArr(1) },
          ].map((btn, i) => (
            <button key={i} onClick={btn.onClick}
              className={`py-1.5 text-xs rounded border transition-colors cursor-pointer w-full ${btn.active ? "bg-indigo-600 border-indigo-600" : "border-white/20 hover:border-white/40"}`}>
              {btn.label}
            </button>
          ))}

          {/* 나머지 배치 행 (좌/우만, 플립 열은 빈 칸) */}
          {ARR_OPTIONS.slice(2).map((label, idx) => {
            const i = idx + 2;
            return [
              <div key={`empty-${i}`} />,
              <button key={`l-${i}`} onClick={() => setLeftArr(i)}
                className={`py-1.5 text-xs rounded border transition-colors cursor-pointer w-full ${leftArr === i ? "bg-indigo-600 border-indigo-600" : "border-white/20 hover:border-white/40"}`}>
                {label}
              </button>,
              <button key={`r-${i}`} onClick={() => setRightArr(i)}
                className={`py-1.5 text-xs rounded border transition-colors cursor-pointer w-full ${rightArr === i ? "bg-indigo-600 border-indigo-600" : "border-white/20 hover:border-white/40"}`}>
                {label}
              </button>,
            ];
          })}</div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-white/50 hover:text-white/80 cursor-pointer">취소</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded text-sm transition-colors cursor-pointer">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
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

function ScoresContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const idParam = searchParams.get("id") ?? "";
  const [search, setSearch] = useState(idParam);
  const [level, setLevel] = useState<number | null>(12);
  const [sortByClear, setSortByClear] = useState(false);
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [optionMap, setOptionMap] = useState<Map<number, OptionItem>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [editPassword, setEditPassword] = useState("");
  const [savedPassword, setSavedPassword] = useState<string | null>(null);
  const [showPwPrompt, setShowPwPrompt] = useState(false);
  const [editSong, setEditSong] = useState<ScoreItem | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [djName, setDjName] = useState<string | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);

  const handleCapture = async () => {
    if (!captureRef.current) return;
    setCapturing(true);
    const clone = captureRef.current.cloneNode(true) as HTMLElement;
    // 캡처본은 7열
    clone.querySelectorAll(".song-grid").forEach((el) => {
      el.className = "song-grid grid grid-cols-7 gap-1.5";
    });
    const hider = document.createElement("div");
    hider.style.cssText = "position:fixed;left:-10000px;top:0;";
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "width:1200px;padding:16px;box-sizing:border-box;background:#0f0f1a;";
    wrapper.appendChild(clone);
    hider.appendChild(wrapper);
    document.body.appendChild(hider);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      const url = await toPng(wrapper, { backgroundColor: "#0f0f1a", pixelRatio: 4 });
      const a = document.createElement("a");
      a.href = url;
      a.download = `scoredp_${idParam}_${level}.png`;
      a.click();
    } finally {
      document.body.removeChild(hider);
      setCapturing(false);
    }
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

  const handleEditToggle = () => {
    if (editMode) { setEditMode(false); return; }
    if (savedPassword) { setEditMode(true); return; }
    setShowPwPrompt(true);
  };

  const [pwError, setPwError] = useState<string | null>(null);
  const [pwChecking, setPwChecking] = useState(false);

  const handlePwConfirm = async () => {
    if (!/^\d{4}$/.test(editPassword)) return;
    setPwChecking(true);
    setPwError(null);
    try {
      const res = await fetch(`${API_URL}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iidx_id: idParam, password: editPassword }),
      });
      if (res.status === 401) { setPwError("비밀번호가 올바르지 않습니다."); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSavedPassword(editPassword);
      setEditPassword("");
      setShowPwPrompt(false);
      setEditMode(true);
    } catch (e) {
      setPwError((e as Error).message);
    } finally {
      setPwChecking(false);
    }
  };

  const handleOptionSave = (updated: OptionItem) => {
    setOptionMap(prev => {
      const next = new Map(prev);
      if (!updated.flip && !updated.left_arr && !updated.right_arr) {
        next.delete(updated.song_id);
      } else {
        next.set(updated.song_id, updated);
      }
      return next;
    });
    setEditSong(null);
  };

  const fetchOptions = useCallback(async (id: string) => {
    try {
      const [optRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/options/${encodeURIComponent(id)}`),
        fetch(`${API_URL}/auth/status/${encodeURIComponent(id)}`),
      ]);
      if (optRes.ok) {
        const data: OptionItem[] = await optRes.json();
        setOptionMap(new Map(data.map(o => [o.song_id, o])));
      }
      if (statusRes.ok) {
        const { has_password, dj_name } = await statusRes.json();
        setHasPassword(has_password);
        setDjName(dj_name);
        if (!has_password) { setEditMode(false); setSavedPassword(null); }
      }
    } catch {
      // 무시
    }
  }, []);

  useEffect(() => {
    if (idParam) {
      setSearch(idParam);
      fetchScores(idParam, level);
      fetchOptions(idParam);
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
              className="flex items-center gap-1 p-1 text-sm text-white/40 hover:text-white/60 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
              캡처
            </button>
            {hasPassword && (
              <button
                onClick={handleEditToggle}
                title="배치 저장 모드"
                className={`flex items-center gap-1 p-1 transition-colors cursor-pointer text-sm ${editMode ? "text-indigo-400" : "text-white/40 hover:text-white/60"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                </svg>
                배치 저장 모드
              </button>
            )}
          </div>
        </>
      )}

      {capturing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {showPwPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowPwPrompt(false)}>
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 w-72 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">배치 저장 비밀번호</span>
              <button onClick={() => setShowPwPrompt(false)} className="text-white/40 hover:text-white/70 cursor-pointer">✕</button>
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={editPassword}
              onChange={e => setEditPassword(e.target.value.replace(/\D/g, ""))}
              onKeyDown={e => e.key === "Enter" && handlePwConfirm()}
              autoFocus
              className="px-3 py-2 rounded border border-white/20 bg-white/5 focus:outline-none focus:border-indigo-400 font-mono text-center text-lg tracking-widest"
            />
            {pwError && <p className="text-red-400 text-xs">{pwError}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowPwPrompt(false); setPwError(null); setEditPassword(""); }} className="px-3 py-1.5 text-sm text-white/50 hover:text-white/80 cursor-pointer">취소</button>
              <button onClick={handlePwConfirm} disabled={editPassword.length !== 4 || pwChecking}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded text-sm transition-colors cursor-pointer">
                {pwChecking ? "확인 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <p className="text-white/40 text-sm">데이터를 가져오는 중...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {hasResult && groups.length === 0 && (
        <p className="text-white/40 text-sm">스코어 데이터가 비어있어요.</p>
      )}

      {hasResult && scores.length > 0 && (
        <div ref={captureRef} className="flex flex-col gap-6">
          {djName && (
            <div className="text-sm font-medium text-white/60">
              DJ {djName} ({idParam?.replace(/(\d{4})(\d{4})/, "$1-$2")}) / ☆{level}
            </div>
          )}

          {/* 범례 */}
          <div className="flex gap-3 flex-wrap text-xs text-white/50">
            {Object.entries(CLEAR_LABEL).sort((a, b) => Number(b[0]) - Number(a[0])).map(([ct, label]) => (
              <span key={ct} className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm" style={{ background: CLEAR_COLOR[Number(ct)] }} />
                {label}
              </span>
            ))}
          </div>

          {/* 클리어 집계 바 */}
          <div className="flex text-xs font-mono rounded overflow-hidden max-w-md">
            {(() => {
              const noPlayCount = scores.filter(s => s.clear_type === 0).length;
              const played = scores.length - noPlayCount;
              if (played === 0) {
                return (
                  <div className="flex items-center justify-center py-0.5 flex-1 bg-white/10 text-white/50">
                    {noPlayCount}
                  </div>
                );
              }
              return (
                <>
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
                    {noPlayCount}
                  </div>
                </>
              );
            })()}
          </div>

          {groups.map(([lvKey, items]) => (
            <section key={lvKey} className="flex flex-col gap-2">
              <h2 className="sticky top-0 z-10 bg-[#0f0f1a]/90 backdrop-blur text-sm font-semibold text-indigo-300 border-b border-white/10 py-1">
                ☆{lvKey}
                <span className="ml-2 text-white/30 font-normal">{items.length}곡</span>
              </h2>
              <div className="song-grid grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1.5">
                {items.map((item, i) => (
                  <SongCard
                    key={item.song_id}
                    item={item}
                    option={optionMap.get(item.song_id)}
                    editMode={editMode}
                    onEdit={setEditSong}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      {editSong && savedPassword && (
        <OptionModal
          item={editSong}
          existing={optionMap.get(editSong.song_id)}
          iidxId={idParam}
          password={savedPassword}
          onSave={handleOptionSave}
          onClose={() => setEditSong(null)}
        />
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