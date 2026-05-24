// lib/parse.ts
// ─────────────────────────────────────────────────────────────
// 이 파일이 하는 일:
//   github.ts가 가져온 STATUS.md "글자 덩어리"를
//   화면 카드에 바로 쓸 수 있는 구조화된 데이터로 바꾼다.
//   - Front Matter(맨 위 --- 블록) → progress, status, updated 등
//   - 본문 → 한 줄 상태, 다음 할 일, 체크리스트 진행률
// ─────────────────────────────────────────────────────────────

import matter from "gray-matter";
import { RawProject } from "./github";

// 신호등 색: 마지막 활동이 오래될수록 빨강
export type Health = "green" | "yellow" | "red";

// 화면 카드 한 장에 필요한 모든 정보
export type Project = {
  name: string;         // 표시명 (STATUS.md의 project: 필드)
  repo: string;         // 실제 GitHub repo 이름 (URL 라우팅용)
  status: string;       // active | paused | done
  progress: number;     // 0~100
  updated: string;      // YYYY-MM-DD
  pc: string;
  headline: string;     // 🎯 한 줄 상태
  nextActions: string[];// ⏭️ 다음에 할 일
  checklist: { text: string; done: boolean }[];
  daysSinceCommit: number | null; // 마지막 커밋 후 며칠
  health: Health;
  url: string;
};

// 두 날짜 사이가 며칠인지 계산
function daysAgo(iso: string | null): number | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// 방치 일수 + 상태로 신호등 색 결정
function getHealth(days: number | null, status: string): Health {
  if (status === "done") return "green";
  if (status === "paused") return "yellow";
  if (days === null) return "yellow";
  if (days <= 3) return "green";   // 3일 이내 = 활발
  if (days <= 7) return "yellow";  // 일주일 이내 = 주의
  return "red";                    // 그 이상 = 방치
}

// 본문에서 특정 섹션(## 제목) 아래 내용을 뽑아낸다
function extractSection(body: string, heading: string): string[] {
  const lines = body.split("\n");
  const out: string[] = [];
  let inside = false;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      // heading 키워드가 들어간 ## 줄을 만나면 수집 시작
      inside = line.includes(heading);
      continue;
    }
    if (inside && line.trim()) out.push(line.trim());
  }
  return out;
}

// "- [x] 할일" / "1. 할일" 같은 머리표 기호를 떼어 깔끔하게
function cleanItem(line: string): string {
  return line.replace(/^[-*]\s*\[[ xX]\]\s*/, "")
             .replace(/^[-*]\s*/, "")
             .replace(/^\d+\.\s*/, "")
             .trim();
}

// ── 메인 함수 ──
// raw 데이터 1개 → 화면용 Project 1개
export function parseProject(raw: RawProject): Project {
  const { data, content } = matter(raw.statusRaw!); // Front Matter 분리

  // 체크리스트 파싱 ([x]=완료, [ ]=미완료)
  const checkLines = content
    .split("\n")
    .filter((l) => /^[-*]\s*\[[ xX]\]/.test(l.trim()));
  const checklist = checkLines.map((l) => ({
    text: cleanItem(l),
    done: /\[[xX]\]/.test(l),
  }));

  // progress가 Front Matter에 없으면 체크리스트 비율로 자동 계산
  let progress = Number(data.progress);
  if (isNaN(progress) && checklist.length > 0) {
    const doneCount = checklist.filter((c) => c.done).length;
    progress = Math.round((doneCount / checklist.length) * 100);
  }
  if (isNaN(progress)) progress = 0;

  const headline = extractSection(content, "한 줄 상태")[0] ?? "";
  const nextActions = extractSection(content, "다음에 할 일").map(cleanItem);
  const days = daysAgo(raw.lastCommit);
  const status = String(data.status ?? "active");

  return {
    name: String(data.project ?? raw.repo),
    repo: raw.repo,
    status,
    progress,
    updated: String(data.updated ?? "?"),
    pc: String(data.pc ?? "?"),
    headline,
    nextActions,
    checklist,
    daysSinceCommit: days,
    health: getHealth(days, status),
    url: raw.url,
  };
}

// raw 여러 개 → Project 여러 개 (방치된 순으로 정렬)
export function parseAll(raws: RawProject[]): Project[] {
  return raws
    .map(parseProject)
    .sort((a, b) => (b.daysSinceCommit ?? 0) - (a.daysSinceCommit ?? 0));
}
