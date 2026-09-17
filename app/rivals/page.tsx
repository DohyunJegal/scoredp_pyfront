"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const DAN_LABELS = ["초단", "2단", "3단", "4단", "5단", "6단", "7단", "8단", "9단", "10단", "중전", "개전"];
const DAN_OPTIONS = DAN_LABELS.map((label, i) => ({ value: i + 1, label })).reverse();

function danLabel(v: number | null): string {
  return v != null ? (DAN_LABELS[v - 1] ?? "-") : "-";
}

interface RivalPost {
  id: number;
  iidx_id: string;
  dj_name: string;
  sp_dan: number | null;
  dp_dan: number | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  comment_count: number;
}

interface RivalComment {
  id: number;
  post_id: number;
  iidx_id: string;
  dj_name: string;
  content: string;
  created_at: string;
}

const asciiOnly = (v: string) => v.replace(/[^\x21-\x7E]/g, "");
const digitsOnly = (v: string) => v.replace(/\D/g, "");
const djNameFilter = (v: string) => asciiOnly(v).toUpperCase();
const noAngleBrackets = (v: string) => v.replace(/[<>]/g, "");
const formatId = (id: string) => id.replace(/(\d{4})(\d{4})/, "$1-$2");
const formatDate = (iso: string) => iso.replace("T", " ").slice(0, 16);
const PAGE_SIZE = 20;

// 페이지네이션 번호
function pageWindow(current: number, totalPages: number, span = 2): number[] {
  if (totalPages <= 0) return [];
  const size = span * 2 + 1;
  let start = Math.max(1, current - span);
  let end = Math.min(totalPages, current + span);
  if (end - start + 1 < size) {
    if (start === 1) end = Math.min(totalPages, start + size - 1);
    else if (end === totalPages) start = Math.max(1, end - size + 1);
  }
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

const URL_RE = /(https?:\/\/[^\s<>"]+)/g;

// 본문 속 http(s) URL만 클릭 가능한 링크로 변환
function Linkify({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part;
        const trailMatch = part.match(/[.,!?)\]}'"”’]+$/);
        const trailing = trailMatch ? trailMatch[0] : "";
        const url = trailing ? part.slice(0, -trailing.length) : part;
        return (
          <span key={i}>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300 break-all">
              {url}
            </a>
            {trailing}
          </span>
        );
      })}
    </>
  );
}

function DanSelect({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-white/60">
      {label}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="px-2 py-1 rounded border border-white/20 bg-zinc-800 text-white text-xs focus:outline-none focus:border-indigo-400"
      >
        <option value="">전체</option>
        {DAN_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </label>
  );
}

// 글쓰기 모달
function WriteModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: RivalPost) => void }) {
  const [iidxId, setIidxId] = useState("");
  const [djName, setDjName] = useState("");
  const [password, setPassword] = useState("");
  const [spDan, setSpDan] = useState<number | null>(null);
  const [dpDan, setDpDan] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachScoredp, setAttachScoredp] = useState(false);
  const [attachOhsorry, setAttachOhsorry] = useState(false);
  const [attachEreter, setAttachEreter] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = iidxId.trim() && djName.trim() && password.trim() && title.trim() && content.trim();

  const buildContent = () => {
    if (!iidxId.trim()) return content;
    const links: string[] = [];
    if (attachScoredp) links.push(`https://scoredp.vercel.app/scores?id=${iidxId}`);
    if (attachOhsorry) links.push(`https://iidx.in/grid/${iidxId}`);
    if (attachEreter) links.push(`https://ereter.net/iidxplayerdata/${iidxId}`);
    return links.length ? `${content}\n\n${links.join("\n")}` : content;
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/rivals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iidx_id: iidxId, dj_name: djName, password,
          sp_dan: spDan, dp_dan: dpDan, title, content: buildContent(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail?.[0]?.msg ?? body?.detail ?? `HTTP ${res.status}`);
      }
      onCreated(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 w-full max-w-md flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold">라이벌 찾기</span>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 cursor-pointer">✕</button>
        </div>

        <div className="flex gap-2">
          <input
            type="text" placeholder="닉네임" value={djName} maxLength={6}
            onChange={(e) => setDjName(djNameFilter(e.target.value))}
            className="w-20 shrink-0 px-2 py-1.5 rounded border border-white/20 bg-white/5 text-sm focus:outline-none focus:border-indigo-400"
          />
          <input
            type="text" placeholder="IIDX ID" value={iidxId} maxLength={8}
            onChange={(e) => setIidxId(digitsOnly(e.target.value))}
            className="w-24 shrink-0 px-2 py-1.5 rounded border border-white/20 bg-white/5 text-sm focus:outline-none focus:border-indigo-400"
          />
          <input
            type="password" autoComplete="new-password" placeholder="비밀번호" value={password} maxLength={72}
            onChange={(e) => setPassword(asciiOnly(e.target.value))}
            className="flex-1 min-w-0 px-3 py-1.5 rounded border border-white/20 bg-white/5 text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>

        <input
          type="text" placeholder="제목" value={title} maxLength={60}
          onChange={(e) => setTitle(noAngleBrackets(e.target.value))}
          className="px-3 py-1.5 rounded border border-white/20 bg-white/5 text-sm focus:outline-none focus:border-indigo-400"
        />

        <textarea
          placeholder={"내용\n\n과도한 욕설이나 정치 관련, 지역감정, 혐오 표현 등 부적절한 표현을 사용하면 삭제될 수 있습니다."} value={content} maxLength={1000} rows={5}
          onChange={(e) => setContent(noAngleBrackets(e.target.value))}
          className="px-3 py-1.5 rounded border border-white/20 bg-white/5 text-sm resize-none focus:outline-none focus:border-indigo-400"
        />

        <div className="flex gap-3">
          <DanSelect label="SP" value={spDan} onChange={setSpDan} />
          <DanSelect label="DP" value={dpDan} onChange={setDpDan} />
        </div>

        <div className="flex gap-4 text-xs text-white/60">
          링크 첨부
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={attachScoredp} disabled={!iidxId.trim()}
              onChange={(e) => setAttachScoredp(e.target.checked)} />
            scoredp
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={attachOhsorry} disabled={!iidxId.trim()}
              onChange={(e) => setAttachOhsorry(e.target.checked)} />
            오소리넷
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={attachEreter} disabled={!iidxId.trim()}
              onChange={(e) => setAttachEreter(e.target.checked)} />
            이레터넷
          </label>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-white/50 hover:text-white/80 cursor-pointer">취소</button>
          <button onClick={handleSubmit} disabled={!canSubmit || saving}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded text-sm transition-colors cursor-pointer">
            {saving ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}

// 리스트
function RivalsList() {
  const router = useRouter();
  const [posts, setPosts] = useState<RivalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWrite, setShowWrite] = useState(false);

  const [query, setQuery] = useState("");
  const [spDanFilter, setSpDanFilter] = useState<number | null>(null);
  const [dpDanFilter, setDpDanFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchPosts = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/rivals`);
      if (query.trim()) url.searchParams.set("q", query.trim());
      if (spDanFilter) url.searchParams.set("sp_dan", String(spDanFilter));
      if (dpDanFilter) url.searchParams.set("dp_dan", String(dpDanFilter));
      url.searchParams.set("page", String(targetPage));
      const res = await fetch(url.toString());
      const data = await res.json();
      setPosts(data.items ?? []);
      setHasMore(!!data.has_more);
      setTotal(data.total ?? 0);
      setPage(targetPage);
    } catch {
      setPosts([]);
      setHasMore(false);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [query, spDanFilter, dpDanFilter]);

  // 검색어나 필터가 바뀔 때마다 1페이지부터 자동 검색
  useEffect(() => {
    const t = setTimeout(() => fetchPosts(1), 300);
    return () => clearTimeout(t);
  }, [fetchPosts]);

  const handleReset = () => {
    setQuery("");
    setSpDanFilter(null);
    setDpDanFilter(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">라이벌 찾기</h1>

      <div className="flex gap-2 flex-wrap items-center">
        <input
          type="text" placeholder="닉네임 또는 IIDX ID" value={query} maxLength={8}
          onChange={(e) => setQuery(djNameFilter(e.target.value))}
          className="w-28 sm:w-56 px-3 py-1.5 rounded border border-white/20 bg-white/5 text-sm focus:outline-none focus:border-indigo-400"
        />
        <DanSelect label="SP" value={spDanFilter} onChange={setSpDanFilter} />
        <DanSelect label="DP" value={dpDanFilter} onChange={setDpDanFilter} />
        {/* 모바일에서만 줄바꿈 강제 */}
        <div className="basis-full sm:hidden" />
        <button type="button" onClick={handleReset}
          className="px-3 py-1.5 border border-white/20 hover:border-white/40 rounded text-sm transition-colors cursor-pointer">
          초기화
        </button>
        <button type="button" onClick={() => setShowWrite(true)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-sm transition-colors cursor-pointer">
          글쓰기
        </button>
      </div>

      {loading ? (
        <p className="text-white/40 text-sm">불러오는 중...</p>
      ) : posts.length === 0 ? (
        <p className="text-white/40 text-sm">글이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {posts.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/rivals?post=${p.id}`)}
              className="flex flex-col gap-1 p-3 rounded-lg border border-white/10 hover:border-indigo-400 hover:bg-indigo-400/5 transition-all text-left cursor-pointer"
            >
              <div className="flex justify-between items-start gap-2">
                <span className="text-sm font-semibold line-clamp-1">{p.title}</span>
                <span className="text-xs text-white/30 shrink-0">{formatDate(p.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40 flex-wrap">
                <span>{p.dj_name} ({formatId(p.iidx_id)})</span>
                {p.sp_dan != null && <span className="text-indigo-300/70">SP {danLabel(p.sp_dan)}</span>}
                {p.dp_dan != null && <span className="text-indigo-300/70">DP {danLabel(p.dp_dan)}</span>}
                <span className="ml-auto">댓글 {p.comment_count}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="flex gap-1.5 justify-center items-center">
          <button type="button" onClick={() => fetchPosts(page - 1)} disabled={page <= 1}
            className="px-3 py-1.5 border border-white/20 hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed rounded text-sm transition-colors cursor-pointer">
            이전
          </button>
          {pageWindow(page, Math.max(1, Math.ceil(total / PAGE_SIZE))).map((p) => (
            <button key={p} type="button" onClick={() => fetchPosts(p)}
              className={`w-8 h-8 rounded text-sm transition-colors cursor-pointer ${
                p === page ? "bg-indigo-600" : "border border-white/20 hover:border-white/40"
              }`}>
              {p}
            </button>
          ))}
          <button type="button" onClick={() => fetchPosts(page + 1)} disabled={!hasMore}
            className="px-3 py-1.5 border border-white/20 hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed rounded text-sm transition-colors cursor-pointer">
            다음
          </button>
        </div>
      )}

      {showWrite && (
        <WriteModal
          onClose={() => setShowWrite(false)}
          onCreated={(p) => { setShowWrite(false); router.push(`/rivals?post=${p.id}`); }}
        />
      )}
    </div>
  );
}

// 댓글
function CommentRow({ comment, onDeleted }: { comment: RivalComment; onDeleted: (id: number) => void }) {
  const [verifyMode, setVerifyMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [password, setPassword] = useState("");
  const [verifiedPassword, setVerifiedPassword] = useState("");
  const [content, setContent] = useState(comment.content);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveContent, setLiveContent] = useState(comment.content);

  const startVerify = () => { setVerifyMode(true); setDeleteMode(false); setPassword(""); setError(null); };
  const startDelete = () => { setDeleteMode(true); setVerifyMode(false); setPassword(""); setError(null); };
  const cancelPrompt = () => { setVerifyMode(false); setDeleteMode(false); setPassword(""); setError(null); };
  const cancelEdit = () => { setEditMode(false); setVerifiedPassword(""); setError(null); setContent(liveContent); };

  const handleVerify = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/rivals/comments/${comment.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.status === 401) { setError("비밀번호가 올바르지 않습니다."); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setVerifiedPassword(password);
      setPassword("");
      setVerifyMode(false);
      setEditMode(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/rivals/comments/${comment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: verifiedPassword, content }),
      });
      if (res.status === 401) { setError("비밀번호가 올바르지 않습니다."); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLiveContent(content);
      setEditMode(false);
      setVerifiedPassword("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/rivals/comments/${comment.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.status === 401) { setError("비밀번호가 올바르지 않습니다."); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onDeleted(comment.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 py-2 border-b border-white/5">
      <div className="flex justify-between items-start gap-2">
        <span className="text-xs text-white/50">{comment.dj_name} ({formatId(comment.iidx_id)})</span>
        <span className="text-xs text-white/30">{formatDate(comment.created_at)}</span>
      </div>

      {!editMode ? (
        <>
          <p className="text-sm whitespace-pre-wrap break-words"><Linkify text={liveContent} /></p>
          <div className="flex gap-2 justify-end">
            <button onClick={startVerify} className="text-xs text-white/30 hover:text-white/60 cursor-pointer">수정</button>
            <button onClick={startDelete} className="text-xs text-white/30 hover:text-red-400 cursor-pointer">삭제</button>
          </div>
          {verifyMode && (
            <div className="flex gap-2 items-center justify-end">
              <input type="password" autoComplete="new-password" placeholder="비밀번호" value={password} maxLength={72}
                onChange={(e) => setPassword(asciiOnly(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="px-2 py-1 rounded border border-white/20 bg-white/5 text-xs w-32 focus:outline-none focus:border-indigo-400" />
              <button onClick={handleVerify} disabled={busy || !password}
                className="text-xs px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 cursor-pointer">확인</button>
              <button onClick={cancelPrompt} className="text-xs px-2 py-1 text-white/40 hover:text-white/70 cursor-pointer">취소</button>
            </div>
          )}
          {deleteMode && (
            <div className="flex gap-2 items-center justify-end">
              <input type="password" autoComplete="new-password" placeholder="비밀번호" value={password} maxLength={72}
                onChange={(e) => setPassword(asciiOnly(e.target.value))}
                className="px-2 py-1 rounded border border-white/20 bg-white/5 text-xs w-32 focus:outline-none focus:border-indigo-400" />
              <button onClick={handleDelete} disabled={busy || !password}
                className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 disabled:opacity-50 cursor-pointer">확인</button>
              <button onClick={cancelPrompt} className="text-xs px-2 py-1 text-white/40 hover:text-white/70 cursor-pointer">취소</button>
            </div>
          )}
          {error && <p className="text-red-400 text-xs text-right">{error}</p>}
        </>
      ) : (
        <div className="flex flex-col gap-1.5">
          <textarea value={content} maxLength={300} rows={2}
            onChange={(e) => setContent(noAngleBrackets(e.target.value))}
            className="px-2 py-1 rounded border border-white/20 bg-white/5 text-sm resize-none focus:outline-none focus:border-indigo-400" />
          <div className="flex gap-2 items-center justify-end">
            <button onClick={handleEdit} disabled={busy || !content.trim()}
              className="text-xs px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 cursor-pointer">저장</button>
            <button onClick={cancelEdit} className="text-xs px-2 py-1 text-white/40 hover:text-white/70 cursor-pointer">취소</button>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
      )}
    </div>
  );
}

// 댓글 작성 폼
function CommentForm({ postId, onCreated }: { postId: number; onCreated: (c: RivalComment) => void }) {
  const [iidxId, setIidxId] = useState("");
  const [djName, setDjName] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = iidxId.trim() && djName.trim() && password.trim() && content.trim();

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/rivals/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iidx_id: iidxId, dj_name: djName, password, content }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail?.[0]?.msg ?? body?.detail ?? `HTTP ${res.status}`);
      }
      onCreated(await res.json());
      setContent("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 pt-3">
      <div className="flex gap-2">
        <input type="text" placeholder="닉네임" value={djName} maxLength={6}
          onChange={(e) => setDjName(djNameFilter(e.target.value))}
          className="w-20 shrink-0 px-2 py-1.5 rounded border border-white/20 bg-white/5 text-sm focus:outline-none focus:border-indigo-400" />
        <input type="text" placeholder="IIDX ID" value={iidxId} maxLength={8}
          onChange={(e) => setIidxId(digitsOnly(e.target.value))}
          className="w-24 shrink-0 px-2 py-1.5 rounded border border-white/20 bg-white/5 text-sm focus:outline-none focus:border-indigo-400" />
        <input type="password" autoComplete="new-password" placeholder="비밀번호" value={password} maxLength={72}
          onChange={(e) => setPassword(asciiOnly(e.target.value))}
          className="flex-1 min-w-0 px-2 py-1.5 rounded border border-white/20 bg-white/5 text-sm focus:outline-none focus:border-indigo-400" />
      </div>
      <div className="flex gap-2">
        <textarea placeholder={"댓글\n과도한 욕설이나 정치 관련, 지역감정, 혐오 표현 등 부적절한 표현을 사용하면 삭제될 수 있습니다."} value={content} maxLength={300} rows={2}
          onChange={(e) => setContent(noAngleBrackets(e.target.value))}
          className="flex-1 min-w-0 px-3 py-1.5 rounded border border-white/20 bg-white/5 text-sm resize-none focus:outline-none focus:border-indigo-400" />
        <button onClick={handleSubmit} disabled={!canSubmit || busy}
          className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded text-sm transition-colors cursor-pointer">
          등록
        </button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

// 상세 화면
function RivalDetail({ postId }: { postId: number }) {
  const router = useRouter();
  const [post, setPost] = useState<RivalPost | null>(null);
  const [comments, setComments] = useState<RivalComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [verifyMode, setVerifyMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [password, setPassword] = useState("");
  const [verifiedPassword, setVerifiedPassword] = useState("");
  const [spDan, setSpDan] = useState<number | null>(null);
  const [dpDan, setDpDan] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const [postRes, commentsRes] = await Promise.all([
        fetch(`${API_URL}/rivals/${postId}`),
        fetch(`${API_URL}/rivals/${postId}/comments`),
      ]);
      if (postRes.status === 404) { setNotFound(true); return; }
      const p: RivalPost = await postRes.json();
      setPost(p);
      setSpDan(p.sp_dan); setDpDan(p.dp_dan);
      setTitle(p.title); setContent(p.content);
      setComments(await commentsRes.json());
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const startVerify = () => { setVerifyMode(true); setEditMode(false); setDeleteMode(false); setPassword(""); setError(null); };
  const cancelEdit = () => {
    setVerifyMode(false); setEditMode(false); setPassword(""); setVerifiedPassword(""); setError(null);
    if (post) { setSpDan(post.sp_dan); setDpDan(post.dp_dan); setTitle(post.title); setContent(post.content); }
  };

  const handleVerify = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/rivals/${postId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.status === 401) { setError("비밀번호가 올바르지 않습니다."); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setVerifiedPassword(password);
      setPassword("");
      setVerifyMode(false);
      setEditMode(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/rivals/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: verifiedPassword, sp_dan: spDan, dp_dan: dpDan, title, content }),
      });
      if (res.status === 401) { setError("비밀번호가 올바르지 않습니다."); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPost(await res.json());
      setEditMode(false); setVerifiedPassword("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/rivals/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.status === 401) { setError("비밀번호가 올바르지 않습니다."); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.push("/rivals");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-white/40 text-sm">불러오는 중...</p>;
  if (notFound || !post) return <p className="text-white/40 text-sm">글을 찾을 수 없습니다.</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">라이벌 찾기</h1>

      <div className="flex flex-col gap-3">
        {!editMode ? (
          <>
            <h2 className="text-lg font-bold break-words">{post.title}</h2>
            <div className="flex items-center justify-between gap-2 text-xs text-white/40">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span>{post.dj_name} ({formatId(post.iidx_id)})</span>
                {post.sp_dan != null && <span className="text-indigo-300/70">SP {danLabel(post.sp_dan)}</span>}
                {post.dp_dan != null && <span className="text-indigo-300/70">DP {danLabel(post.dp_dan)}</span>}
              </div>
              <span className="text-white/30 shrink-0">{formatDate(post.created_at)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap break-words"><Linkify text={post.content} /></p>
            <div className="flex gap-3 justify-end">
              <button onClick={startVerify} className="text-xs text-white/40 hover:text-white/70 cursor-pointer">수정</button>
              <button onClick={() => { setDeleteMode(true); setVerifyMode(false); setPassword(""); setError(null); }}
                className="text-xs text-white/40 hover:text-red-400 cursor-pointer">삭제</button>
            </div>
            {verifyMode && (
              <div className="flex gap-2 items-center justify-end">
                <input type="password" autoComplete="new-password" placeholder="비밀번호" value={password} maxLength={72}
                  onChange={(e) => setPassword(asciiOnly(e.target.value))}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  className="px-2 py-1 rounded border border-white/20 bg-white/5 text-xs w-32 focus:outline-none focus:border-indigo-400" />
                <button onClick={handleVerify} disabled={busy || !password}
                  className="text-xs px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 cursor-pointer">확인</button>
                <button onClick={() => { setVerifyMode(false); setError(null); }} className="text-xs px-2 py-1 text-white/40 hover:text-white/70 cursor-pointer">취소</button>
              </div>
            )}
            {deleteMode && (
              <div className="flex gap-2 items-center justify-end">
                <input type="password" autoComplete="new-password" placeholder="비밀번호" value={password} maxLength={72}
                  onChange={(e) => setPassword(asciiOnly(e.target.value))}
                  className="px-2 py-1 rounded border border-white/20 bg-white/5 text-xs w-32 focus:outline-none focus:border-indigo-400" />
                <button onClick={handleDelete} disabled={busy || !password}
                  className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 disabled:opacity-50 cursor-pointer">삭제 확인</button>
                <button onClick={() => { setDeleteMode(false); setError(null); }} className="text-xs px-2 py-1 text-white/40 hover:text-white/70 cursor-pointer">취소</button>
              </div>
            )}
            {error && <p className="text-red-400 text-xs text-right">{error}</p>}
          </>
        ) : (
          <>
            <span className="text-xs text-white/40">{post.dj_name} ({formatId(post.iidx_id)})</span>
            <div className="flex gap-3">
              <DanSelect label="SP" value={spDan} onChange={setSpDan} />
              <DanSelect label="DP" value={dpDan} onChange={setDpDan} />
            </div>
            <input type="text" placeholder="제목" value={title} maxLength={60}
              onChange={(e) => setTitle(noAngleBrackets(e.target.value))}
              className="px-3 py-1.5 rounded border border-white/20 bg-white/5 text-sm focus:outline-none focus:border-indigo-400" />
            <textarea placeholder="내용" value={content} maxLength={1000} rows={5}
              onChange={(e) => setContent(noAngleBrackets(e.target.value))}
              className="px-3 py-1.5 rounded border border-white/20 bg-white/5 text-sm resize-none focus:outline-none focus:border-indigo-400" />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={cancelEdit} className="px-3 py-1.5 text-sm text-white/50 hover:text-white/80 cursor-pointer">취소</button>
              <button onClick={handleSaveEdit} disabled={busy || !title.trim() || !content.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded text-sm transition-colors cursor-pointer">저장</button>
            </div>
          </>
        )}
        <button onClick={() => router.push("/rivals")} className="text-sm text-white/40 hover:text-white/70 self-end cursor-pointer">
          ← 목록으로
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-white/70">댓글 {comments.length}</h2>
        {comments.map((c) => (
          <CommentRow key={c.id} comment={c} onDeleted={(id) => setComments((prev) => prev.filter((x) => x.id !== id))} />
        ))}
        <CommentForm postId={postId} onCreated={(c) => setComments((prev) => [...prev, c])} />
      </div>
    </div>
  );
}

function RivalsContent() {
  const searchParams = useSearchParams();
  const postParam = searchParams.get("post");
  const postId = postParam ? Number(postParam) : null;

  if (postId != null && !Number.isNaN(postId)) {
    return <RivalDetail key={postId} postId={postId} />;
  }
  return <RivalsList />;
}

export default function RivalsPage() {
  return (
    <Suspense>
      <RivalsContent />
    </Suspense>
  );
}
