"use client";

import { useEffect, useState, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Song {
  id: number;
  title: string;
  chart: string;
  level: number;
  unofficial_level: number | null;
  zasa_id: string | null;
}

interface UserEntry {
  id: number;
  iidx_id: string;
  dj_name: string;
  score_count: number;
}

const CHARTS = ["HYPER", "ANOTHER", "LEGGENDARIA"];

// ── 곡 편집 행 ────────────────────────────────────────────
function SongRow({ song, onSaved }: { song: Song; onSaved: (s: Song) => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: song.title,
    chart: song.chart,
    level: String(song.level),
    unofficial_level: song.unofficial_level != null ? String(song.unofficial_level) : "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await fetch(`${API_URL}/admin/songs/${song.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        chart: form.chart,
        level: Number(form.level),
        unofficial_level: form.unofficial_level !== "" ? Number(form.unofficial_level) : null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      onSaved(updated);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <tr className="border-b border-white/5 hover:bg-white/5">
        <td className="px-3 py-1.5 text-white/30 text-xs font-mono">{song.id}</td>
        <td className="px-3 py-1.5 text-sm">{song.title}</td>
        <td className="px-3 py-1.5 text-xs text-white/60">{song.chart}</td>
        <td className="px-3 py-1.5 text-xs text-center">{song.level}</td>
        <td className="px-3 py-1.5 text-xs text-center text-indigo-300">
          {song.unofficial_level ?? "-"}
        </td>
        <td className="px-3 py-1.5">
          <button
            onClick={() => setEditing(true)}
            className="text-xs px-2 py-0.5 rounded border border-white/20 hover:border-indigo-400 hover:text-indigo-400 transition-colors"
          >
            편집
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-white/5 bg-indigo-950/30">
      <td className="px-3 py-1.5 text-white/30 text-xs font-mono">{song.id}</td>
      <td className="px-3 py-1.5">
        <input
          className="w-full bg-white/10 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </td>
      <td className="px-3 py-1.5">
        <select
          className="bg-white/10 rounded px-1 py-0.5 text-xs focus:outline-none"
          value={form.chart}
          onChange={(e) => setForm({ ...form, chart: e.target.value })}
        >
          {CHARTS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td className="px-3 py-1.5">
        <input
          type="number"
          className="w-14 bg-white/10 rounded px-2 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-400"
          value={form.level}
          onChange={(e) => setForm({ ...form, level: e.target.value })}
        />
      </td>
      <td className="px-3 py-1.5">
        <input
          type="number"
          step="0.1"
          className="w-16 bg-white/10 rounded px-2 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-400"
          value={form.unofficial_level}
          onChange={(e) => setForm({ ...form, unofficial_level: e.target.value })}
        />
      </td>
      <td className="px-3 py-1.5 flex gap-1">
        <button
          onClick={save}
          disabled={saving}
          className="text-xs px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50"
        >
          저장
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-xs px-2 py-0.5 rounded border border-white/20 hover:border-white/40 transition-colors"
        >
          취소
        </button>
      </td>
    </tr>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState<"songs" | "users">("songs");

  // 곡 관리
  const [songs, setSongs] = useState<Song[]>([]);
  const [songQuery, setSongQuery] = useState("");
  const [songsLoading, setSongsLoading] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [sortKey, setSortKey] = useState<"id" | "title" | "level" | "unofficial_level">("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // 유저 관리
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    if (tab === "songs" && songs.length === 0) loadSongs();
    if (tab === "users" && users.length === 0) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadSongs = async () => {
    setSongsLoading(true);
    const data = await fetch(`${API_URL}/admin/songs`).then((r) => r.json()).catch(() => []);
    setSongs(data);
    setSongsLoading(false);
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    const data = await fetch(`${API_URL}/admin/users`).then((r) => r.json()).catch(() => []);
    setUsers(data);
    setUsersLoading(false);
  };

  const handleExport = () => {
    window.location.href = `${API_URL}/admin/songs/export`;
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/admin/songs/import`, { method: "POST", body: form });
    if (res.ok) {
      const { updated, skipped } = await res.json();
      setImportResult(`완료: ${updated}곡 수정, ${skipped}곡 건너뜀`);
      await loadSongs();
    } else {
      setImportResult("오류가 발생했습니다.");
    }
    e.target.value = "";
  };

  const handleDeleteUser = async (userId: number) => {
    const res = await fetch(`${API_URL}/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
    setDeleteConfirm(null);
  };

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sortArrow = (key: typeof sortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  const filteredSongs = songs
    .filter(
      (s) =>
        songQuery === "" ||
        s.title.toLowerCase().includes(songQuery.toLowerCase())
    )
    .sort((a, b) => {
      let va: number | string = a[sortKey] ?? -Infinity;
      let vb: number | string = b[sortKey] ?? -Infinity;
      if (sortKey === "title") { va = a.title.toLowerCase(); vb = b.title.toLowerCase(); }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">관리자</h1>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-white/10">
        {(["songs", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-indigo-400 text-white"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            {t === "songs" ? "곡 관리" : "유저 관리"}
          </button>
        ))}
      </div>

      {/* ── 곡 관리 ── */}
      {tab === "songs" && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 flex-wrap items-center">
            <input
              type="text"
              value={songQuery}
              onChange={(e) => setSongQuery(e.target.value)}
              placeholder="곡명 검색"
              className="px-3 py-1.5 rounded border border-white/20 bg-white/5 text-sm w-56 focus:outline-none focus:border-indigo-400"
            />
            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded border border-white/20 hover:border-indigo-400 text-sm transition-colors"
            >
              Excel 다운로드
            </button>
            <button
              onClick={() => importRef.current?.click()}
              className="px-3 py-1.5 rounded border border-white/20 hover:border-indigo-400 text-sm transition-colors"
            >
              Excel 업로드
            </button>
            <input ref={importRef} type="file" accept=".xlsx" className="hidden" onChange={handleImport} />
            {importResult && (
              <span className="text-sm text-indigo-300">{importResult}</span>
            )}
          </div>

          <p className="text-xs text-white/30">전체 {songs.length}곡 / 표시 {filteredSongs.length}곡</p>

          {songsLoading ? (
            <p className="text-white/40 text-sm">불러오는 중…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs">
                    {(
                      [
                        { key: "id", label: "ID", cls: "text-left w-12" },
                        { key: "title", label: "곡명", cls: "text-left" },
                        { key: null, label: "차트", cls: "text-left w-28" },
                        { key: "level", label: "레벨", cls: "text-center w-14" },
                        { key: "unofficial_level", label: "비공식", cls: "text-center w-20" },
                      ] as const
                    ).map(({ key, label, cls }) => (
                      <th key={label} className={`px-3 py-2 font-normal ${cls}`}>
                        {key ? (
                          <button onClick={() => toggleSort(key)} className="hover:text-white transition-colors">
                            {label}{sortArrow(key)}
                          </button>
                        ) : label}
                      </th>
                    ))}
                    <th className="px-3 py-2 w-20" />
                  </tr>
                </thead>
                <tbody>
                  {filteredSongs.map((song) => (
                    <SongRow
                      key={song.id}
                      song={song}
                      onSaved={(updated) =>
                        setSongs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 유저 관리 ── */}
      {tab === "users" && (
        <div className="flex flex-col gap-4">
          {usersLoading ? (
            <p className="text-white/40 text-sm">불러오는 중…</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs">
                  <th className="px-3 py-2 text-left font-normal">IIDX ID</th>
                  <th className="px-3 py-2 text-left font-normal">DJ명</th>
                  <th className="px-3 py-2 text-center font-normal w-20">스코어</th>
                  <th className="px-3 py-2 w-20" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-2 font-mono text-xs text-white/60">{user.iidx_id}</td>
                    <td className="px-3 py-2">{user.dj_name}</td>
                    <td className="px-3 py-2 text-center text-white/40 text-xs">{user.score_count}</td>
                    <td className="px-3 py-2">
                      {deleteConfirm === user.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-xs px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 transition-colors"
                          >
                            확인
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs px-2 py-0.5 rounded border border-white/20 hover:border-white/40 transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="text-xs px-2 py-0.5 rounded border border-red-500/40 text-red-400 hover:border-red-500 transition-colors"
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
