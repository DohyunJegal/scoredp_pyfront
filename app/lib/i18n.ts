"use client";

import { useSyncExternalStore } from "react";

export type Locale = "ko" | "ja" | "en";

const STORAGE_KEY = "scoredp_locale";
const LOCALES: Locale[] = ["ko", "ja", "en"];

let currentLocale: Locale = "ko";
let initialized = false;
const listeners = new Set<() => void>();

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "ko";
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("ja")) return "ja";
  if (lang.startsWith("en")) return "en";
  return "ko";
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  const saved = localStorage.getItem(STORAGE_KEY);
  currentLocale = LOCALES.includes(saved as Locale) ? (saved as Locale) : detectLocale();
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* 무시 */ }
  listeners.forEach((fn) => fn());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => { listeners.delete(callback); };
}

function getSnapshot(): Locale {
  init();
  return currentLocale;
}

function getServerSnapshot(): Locale {
  return "ko";
}

export function useLocale(): [Locale, typeof setLocale] {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [locale, setLocale];
}

const dict = {
  "nav.main": { ko: "메인", ja: "メイン", en: "Main" },
  "nav.users": { ko: "사용자", ja: "ユーザー", en: "Users" },
  "nav.scores": { ko: "기록", ja: "記録", en: "Scores" },
  "nav.tier": { ko: "서열표", ja: "難易度表", en: "Tier List" },
  "nav.random": { ko: "랜덤", ja: "ランダム", en: "Random" },
  "nav.rivals": { ko: "라이벌", ja: "ライバル", en: "Rivals" },
  "nav.menu": { ko: "메뉴", ja: "メニュー", en: "Menu" },

  "home.subtitle": { ko: "beatmania IIDX DP 서열표 기록 사이트", ja: "beatmania IIDX DP 記録・難易度表サイト", en: "beatmania IIDX DP score tracker & tier list" },
  "home.loginSuffix": { ko: "에 로그인합니다.", ja: "にログインします。", en: " and log in." },
  "home.collect.title": { ko: "데이터 수집 방법", ja: "データ収集方法", en: "How to collect your data" },
  "home.collect.step2": { ko: "베이직 코스에 가입하지 않으셨다면, 가입을 진행합니다.", ja: "ベーシックコースに未加入の場合は、加入手続きを行ってください。", en: "If you haven't subscribed to the Basic Course, sign up for it." },
  "home.collect.step3": { ko: "페이지에서 f12를 누른 뒤, 콘솔에 아래 코드를 입력합니다.", ja: "ページでF12を押し、コンソールに以下のコードを入力します。", en: "Press F12 on the page, then enter the code below into the console." },
  "home.collect.step4": { ko: "크롤러가 정보를 수집해 서버에 전송합니다.", ja: "クローラーが情報を収集してサーバーに送信します。", en: "The crawler collects your data and sends it to the server." },
  "home.copy": { ko: "복사", ja: "コピー", en: "Copy" },
  "home.copied": { ko: "완료", ja: "完了", en: "Copied" },

  "home.batch.title": { ko: "배치 기록 방법", ja: "配置記録の方法", en: "How to save your option layout" },
  "home.batch.step4": { ko: "비밀번호를 설정합니다.", ja: "パスワードを設定します。", en: "Set a password." },
  "home.batch.step5": { ko: "자신의 기록 페이지로 이동하여, 배치 저장 모드를 누르고 비밀번호를 입력합니다.", ja: "自分の記録ページに移動し、配置保存モードを押してパスワードを入力します。", en: "Go to your own scores page, tap the save-layout mode, and enter your password." },
  "home.batch.step6": { ko: "곡을 선택한 뒤 배치를 저장합니다.", ja: "曲を選択してから配置を保存します。", en: "Select a song, then save its layout." },

  "home.reference.title": { ko: "참고", ja: "参考", en: "Reference" },
  "home.reference.unofficial": { ko: "DP 비공식 난이도표 사이트", ja: "DP非公式難易度表サイト", en: "DP unofficial difficulty tier list site" },

  "home.misc.title": { ko: "기타", ja: "その他", en: "Others" },
  "home.misc.osori": { ko: "오소리넷 - DP 리커멘드 계산 & 곡 추천 서비스 by grom", ja: "オソリネット - DPレコメンド計算＆曲おすすめサービス by grom", en: "Osorinet - DP recommend calculator & song suggestion service by grom" },
  "home.misc.dpoptionz": { ko: "Double Play Optionz - DP 배치 추천 사이트 by 𝔸𝕁(DXR*00)", ja: "Double Play Optionz - DP配置おすすめサイト by 𝔸𝕁(DXR*00)", en: "Double Play Optionz - DP layout recommendation site by 𝔸𝕁(DXR*00)" },
  "home.misc.donate": { ko: "불쌍한 개발자에게 한 푼 줘야지 (카카오톡 오픈채팅)", ja: "貧乏な開発者に投げ銭してあげよう（カカオトークオープンチャット）", en: "Throw the poor developer a coin (KakaoTalk open chat)" },

  "common.searchPlaceholder": { ko: "닉네임 또는 IIDX ID", ja: "ニックネームまたはIIDX ID", en: "Nickname or IIDX ID" },
  "common.loading": { ko: "데이터를 가져오는 중...", ja: "データを読み込み中...", en: "Loading data..." },
  "common.cancel": { ko: "취소", ja: "キャンセル", en: "Cancel" },
  "common.save": { ko: "저장", ja: "保存", en: "Save" },
  "common.saving": { ko: "저장 중...", ja: "保存中...", en: "Saving..." },
  "common.confirm": { ko: "확인", ja: "確認", en: "Confirm" },
  "common.confirming": { ko: "확인 중...", ja: "確認中...", en: "Confirming..." },
  "common.wrongPassword": { ko: "비밀번호가 올바르지 않습니다.", ja: "パスワードが正しくありません。", en: "Incorrect password." },
  "common.search": { ko: "조회", ja: "検索", en: "Search" },
  "common.serverError": { ko: "서버 오류가 발생했습니다.", ja: "サーバーエラーが発生しました。", en: "A server error occurred." },
  "common.nickname": { ko: "닉네임", ja: "ニックネーム", en: "Nickname" },
  "common.password": { ko: "비밀번호", ja: "パスワード", en: "Password" },
  "common.edit": { ko: "수정", ja: "編集", en: "Edit" },
  "common.delete": { ko: "삭제", ja: "削除", en: "Delete" },
  "common.loadingSimple": { ko: "불러오는 중...", ja: "読み込み中...", en: "Loading..." },
  "common.all": { ko: "전체", ja: "すべて", en: "All" },

  "dan.1": { ko: "초단", ja: "初段", en: "1st Dan" },
  "dan.2": { ko: "2단", ja: "2段", en: "2nd Dan" },
  "dan.3": { ko: "3단", ja: "3段", en: "3rd Dan" },
  "dan.4": { ko: "4단", ja: "4段", en: "4th Dan" },
  "dan.5": { ko: "5단", ja: "5段", en: "5th Dan" },
  "dan.6": { ko: "6단", ja: "6段", en: "6th Dan" },
  "dan.7": { ko: "7단", ja: "7段", en: "7th Dan" },
  "dan.8": { ko: "8단", ja: "8段", en: "8th Dan" },
  "dan.9": { ko: "9단", ja: "9段", en: "9th Dan" },
  "dan.10": { ko: "10단", ja: "10段", en: "10th Dan" },
  "dan.chuuden": { ko: "중전", ja: "中伝", en: "Chuuden" },
  "dan.kaiden": { ko: "개전", ja: "皆伝", en: "Kaiden" },

  "users.title": { ko: "사용자", ja: "ユーザー", en: "Users" },
  "users.noResults": { ko: "검색 결과가 없습니다.", ja: "検索結果がありません。", en: "No results found." },

  "tier.title": { ko: "서열표", ja: "難易度表", en: "Tier List" },
  "tier.copied": { ko: "곡명이 복사되었어요", ja: "曲名がコピーされました", en: "Song title copied" },
  "tier.songCountSuffix": { ko: "곡", ja: "曲", en: " songs" },

  "scores.title": { ko: "기록", ja: "記録", en: "Scores" },
  "scores.sortByClear": { ko: "램프순", ja: "ランプ順", en: "Sort by clear" },
  "scores.saveImage": { ko: "이미지 저장", ja: "画像を保存", en: "Save image" },
  "scores.capture": { ko: "캡처", ja: "キャプチャ", en: "Capture" },
  "scores.batchMode": { ko: "배치 저장 모드", ja: "配置保存モード", en: "Layout save mode" },
  "scores.batchPassword": { ko: "배치 저장 비밀번호", ja: "配置保存パスワード", en: "Layout save password" },
  "scores.userNotFound": { ko: "사용자를 찾을 수 없어요.", ja: "ユーザーが見つかりません。", en: "User not found." },
  "scores.emptyScores": { ko: "스코어 데이터가 비어있어요.", ja: "スコアデータがありません。", en: "No score data yet." },
  "scores.option.flip": { ko: "플립", ja: "フリップ", en: "Flip" },
  "scores.option.left": { ko: "좌측", ja: "左", en: "Left" },
  "scores.option.right": { ko: "우측", ja: "右", en: "Right" },

  "rivals.title": { ko: "라이벌 찾기", ja: "ライバル探し", en: "Find a Rival" },
  "rivals.titlePlaceholder": { ko: "제목", ja: "タイトル", en: "Title" },
  "rivals.contentPlaceholderSimple": { ko: "내용", ja: "内容", en: "Content" },
  "rivals.contentPlaceholder": { ko: "내용\n\n과도한 욕설이나 정치 관련, 지역감정, 혐오 표현 등 부적절한 표현을 사용하면 삭제될 수 있습니다.", ja: "内容\n\n過度な暴言や政治関連、地域感情、嫌悪表現など不適切な表現を使用すると削除されることがあります。", en: "Content\n\nPosts with excessive profanity, political content, regional or hate speech may be removed." },
  "rivals.commentPlaceholder": { ko: "댓글\n과도한 욕설이나 정치 관련, 지역감정, 혐오 표현 등 부적절한 표현을 사용하면 삭제될 수 있습니다.", ja: "コメント\n過度な暴言や政治関連、地域感情、嫌悪表現など不適切な表現を使用すると削除されることがあります。", en: "Comment\nComments with excessive profanity, political content, regional or hate speech may be removed." },
  "rivals.dan": { ko: "단위", ja: "段位", en: "Dan" },
  "rivals.arena": { ko: "아레나", ja: "アリーナ", en: "Arena" },
  "rivals.linkAttach": { ko: "링크 첨부", ja: "リンク添付", en: "Attach link" },
  "rivals.register": { ko: "등록", ja: "投稿", en: "Post" },
  "rivals.registering": { ko: "등록 중...", ja: "投稿中...", en: "Posting..." },
  "rivals.reset": { ko: "초기화", ja: "リセット", en: "Reset" },
  "rivals.write": { ko: "글쓰기", ja: "投稿する", en: "Write" },
  "rivals.noPosts": { ko: "글이 없습니다.", ja: "投稿がありません。", en: "No posts yet." },
  "rivals.prev": { ko: "이전", ja: "前へ", en: "Previous" },
  "rivals.next": { ko: "다음", ja: "次へ", en: "Next" },
  "rivals.deleteConfirm": { ko: "삭제 확인", ja: "削除確認", en: "Confirm delete" },
  "rivals.backToList": { ko: "← 목록으로", ja: "← 一覧へ", en: "← Back to list" },
  "rivals.commentsCountPrefix": { ko: "댓글 ", ja: "コメント ", en: "Comments " },
  "rivals.notFound": { ko: "글을 찾을 수 없습니다.", ja: "投稿が見つかりません。", en: "Post not found." },

  "random.title": { ko: "랜덤", ja: "ランダム", en: "Random" },
  "random.pick": { ko: "뽑기", ja: "選ぶ", en: "Pick" },
  "random.picking": { ko: "뽑는 중", ja: "選択中", en: "Picking..." },
  "random.noSongs": { ko: "해당 범위에 곡이 없습니다", ja: "該当範囲に曲がありません", en: "No songs in that range" },
  "random.error": { ko: "오류가 발생했습니다", ja: "エラーが発生しました", en: "An error occurred" },

  "notFound.title": { ko: "페이지를 찾을 수 없습니다", ja: "ページが見つかりません", en: "Page not found" },
  "notFound.subtitle": { ko: "배고파서 먹어버렸을지도 몰라요...", ja: "お腹が空いて食べられちゃったのかも…", en: "Maybe it got hungry and ate it..." },
} satisfies Record<string, Record<Locale, string>>;

export type TKey = keyof typeof dict;

export function useT() {
  const [locale] = useLocale();
  return (key: TKey) => dict[key][locale];
}

const DAN_KEYS: TKey[] = ["dan.1", "dan.2", "dan.3", "dan.4", "dan.5", "dan.6", "dan.7", "dan.8", "dan.9", "dan.10", "dan.chuuden", "dan.kaiden"];

export function useDanOptions() {
  const t = useT();
  return DAN_KEYS.map((key, i) => ({ value: i + 1, label: t(key) })).reverse();
}

export function useDanLabel() {
  const t = useT();
  return (v: number | null) => (v != null ? (t(DAN_KEYS[v - 1]) ?? "-") : "-");
}
