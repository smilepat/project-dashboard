// app/page.tsx
// ─────────────────────────────────────────────────────────────
// 대시보드 메인 화면.
// 서버에서 GitHub 데이터를 가져와(fetchAllProjects),
// 가공한 뒤(parseAll), 프로젝트 카드들을 그린다.
// "use client" 없이 서버 컴포넌트로 동작 → 토큰이 브라우저에 노출 안 됨(안전).
// ─────────────────────────────────────────────────────────────

import Link from "next/link";
import { fetchAllProjects } from "@/lib/github";
import { parseAll, Project, Health } from "@/lib/parse";
import HelpDialog from "./HelpDialog";
import GuideDialog from "./GuideDialog";
import RefreshButton from "./RefreshButton";

// 1시간(3600초)마다 페이지를 자동으로 새로 굽는다 (ISR)
export const revalidate = 3600;

// 신호등 색 → 실제 CSS 색상
const HEALTH_COLOR: Record<Health, string> = {
  green: "#1D9E75",
  yellow: "#EF9F27",
  red: "#E24B4A",
};
const HEALTH_LABEL: Record<Health, string> = {
  green: "활발",
  yellow: "주의",
  red: "방치",
};
const STATUS_LABEL: Record<string, string> = {
  active: "진행중",
  paused: "보류",
  done: "완료",
};

// 며칠 전인지 사람이 읽기 좋게
function agoText(days: number | null): string {
  if (days === null) return "기록 없음";
  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  return `${days}일 전`;
}

// ── 카드 한 장 ──
// 큰 영역(제목·진행률·메타) = GitHub로 이동 (a 태그)
// 카드 하단 "본문 보기" 작은 링크 = 대시보드 안 /p/[repo] preview 페이지로
// 둘은 분리 필요: HTML 규격상 <a> 안에 <a>를 중첩할 수 없음
function Card({ p }: { p: Project }) {
  const color = HEALTH_COLOR[p.health];
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e6e3da",
        borderLeft: `4px solid ${color}`,
        borderRadius: 12,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 큰 영역 — 클릭 시 GitHub repo 새 탭으로 */}
      <a
        href={p.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "block",
          flex: 1,
        }}
      >
        {/* 윗줄: 프로젝트명 + 신호등 배지 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{p.name}</h2>
          <span
            style={{
              fontSize: 12, fontWeight: 600, color,
              background: `${color}1a`, padding: "3px 10px", borderRadius: 999,
            }}
          >
            {HEALTH_LABEL[p.health]}
          </span>
        </div>

        {/* 한 줄 상태 */}
        <p style={{ fontSize: 14, color: "#73726c", margin: "8px 0 16px", lineHeight: 1.5 }}>
          {p.headline || "—"}
        </p>

        {/* 진행률 막대 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 8, background: "#f0eee7", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${p.progress}%`, height: "100%", background: color }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 38, textAlign: "right" }}>
            {p.progress}%
          </span>
        </div>

        {/* 다음 할 일 (첫 항목만) */}
        {p.nextActions[0] && (
          <div style={{ fontSize: 13, marginBottom: 12 }}>
            <span style={{ color: "#a8a69d" }}>다음 → </span>
            <span style={{ color: "#3d3d3a" }}>{p.nextActions[0]}</span>
          </div>
        )}

        {/* 아랫줄: 메타 정보 */}
        <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#a8a69d" }}>
          <span>{STATUS_LABEL[p.status] ?? p.status}</span>
          <span>·</span>
          <span>{agoText(p.daysSinceCommit)}</span>
          <span>·</span>
          <span>{p.pc}</span>
        </div>
      </a>

      {/* 카드 하단 — "본문 보기" 별도 링크 (대시보드 내 preview 페이지) */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 10,
          borderTop: "1px solid #f0eee7",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Link
          href={`/p/${encodeURIComponent(p.repo)}`}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#73726c",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          📄 본문 보기
        </Link>
      </div>
    </div>
  );
}

// ── 페이지 ──
export default async function Page() {
  let projects: Project[] = [];
  let error: string | null = null;
  try {
    const raws = await fetchAllProjects();
    projects = parseAll(raws);
  } catch (e: unknown) {
    // strict 모드 권장: any 대신 unknown으로 받고 Error인지 좁혀서 메시지 추출
    error = e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.";
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
      <header
        style={{
          marginBottom: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>프로젝트 대시보드</h1>
          <p style={{ color: "#73726c", marginTop: 6, fontSize: 14 }}>
            진행 중인 프로젝트 {projects.length}개 · 방치된 순으로 정렬
          </p>
        </div>
        {/* 헤더 우측 액션 — 새로고침 + 도움말 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <RefreshButton />
          <GuideDialog />
          <HelpDialog />
        </div>
      </header>

      {error && (
        <div style={{ padding: 20, background: "#fdeaea", color: "#a32d2d", borderRadius: 12 }}>
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 18,
        }}
      >
        {projects.map((p) => (
          <Card key={p.repo} p={p} />
        ))}
      </div>
    </main>
  );
}
