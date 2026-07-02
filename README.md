# scoredp

[scoredp.vercel.app](https://scoredp.vercel.app)

beatmania IIDX DP 서열표 기록 사이트 

Next.js + Tailwind + Vercel

## 실행 방법

```bash
npm install
npm run dev
```

### 환경 변수 (`.env.local`)

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_API_URL` | 백엔드 API 주소. 미설정 시 `http://localhost:8000` |

Vercel 배포 시 프로젝트 설정의 환경변수에 등록해야 합니다.

## 페이지 구조

| 경로 | 파일 | 설명                                 |
|---|---|------------------------------------|
| `/` | `app/page.tsx` | 메인 페이지. 크롤러, 배치 저장용 비밀번호 등록 북마클릿 안내 |
| `/users` | `app/users/page.tsx` | 전체 사용자 목록, 사용자 검색                  |
| `/scores` | `app/scores/page.tsx` | 사용자 기록 조회 (`?id=IIDX_ID`)          |
| `/tier` | `app/tier/page.tsx` | 전체 서열표                             |
| `/random` | `app/random/page.tsx` | 비공식 난이도 구간을 지정해 무작위 선곡             |
| `/admin` | `app/admin/page.tsx` | 관리자 페이지. `X-Admin-Key` 헤더 인증(세션 저장) |
