export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <img src="/404.png" alt="404" className="w-full max-w-lvh" />
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-white/40">배고파서 먹어버렸을지도 몰라요...</p>
      </div>
    </div>
  );
}
