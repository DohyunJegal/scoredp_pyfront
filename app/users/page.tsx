"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface User {
  iidx_id: string;
  dj_name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/users`)
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {});
  }, []);

  const filtered = users.filter((u) => {
    const q = query.toLowerCase();
    return u.dj_name.toLowerCase().includes(q) || u.iidx_id.includes(q);
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">사용자</h1>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="닉네임 또는 IIDX ID 검색"
        className="px-3 py-1.5 rounded border border-white/20 bg-white/5 text-sm w-64 focus:outline-none focus:border-indigo-400"
      />

      {filtered.length === 0 ? (
        <p className="text-white/40 text-sm">검색 결과가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((user) => (
            <Link
              key={user.iidx_id}
              href={`/scores?id=${user.iidx_id}`}
              className="flex flex-col gap-1 p-4 rounded-lg border border-white/10 hover:border-indigo-400 hover:bg-indigo-400/5 transition-all"
            >
              <span className="font-semibold truncate">{user.dj_name}</span>
              <span className="text-xs text-white/40 font-mono">{user.iidx_id}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}