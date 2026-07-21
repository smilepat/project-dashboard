"use client";

// app/ProjectGrid.tsx
// ─────────────────────────────────────────────────────────────
// 카드 그리드 + 필터 칩 (클라이언트 컴포넌트).
// page.tsx(서버)가 GitHub 토큰으로 데이터를 가져와 Project[]를 넘겨주면,
// 여기서는 화면 렌더링과 "어떤 카드를 보여줄지" 필터 상태만 담당한다.
// (토큰은 서버에만 있으므로 클라이언트로 넘어오지 않는다.)
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Project, Health } from "@/lib/parse";

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

// ── 필터 정의 ──
// 60개 넘는 미작성 stub이 실제 프로젝트를 가리므로, 골라볼 수 있게 한다.
type FilterKey = "all" | "written" | "stub" | "stale" | "done";
const FILTERS: { key: FilterKey; label: string; match: (p: Project) => boolean }[] = [
  { key: "all", label: "전체", match: () => true },
  { key: "written", label: "작성됨", match: (p) => !p.isStub },
  { key: "stale", label: "방치", match: (p) => p.health === "red" },
  { key: "stub", label: "미작성", match: (p) => p.isStub },
  { key: "done", label: "완료", match: (p) => p.status === "done" },
];

// ── 카드 한 장 ──
// 큰 영역(제목·진행률·메타) = GitHub로 이동 (a 태그)
// 카드 하단 "본문 보기" 작은 링크 = 대시보드 안 /p/[repo] preview 페이지로
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
      <a
        href={p.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", color: "inherit", display: "block", flex: 1 }}
      >
        {/* 윗줄: 프로젝트명 + 신호등 배지 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</h2>
            {/* 스윕이 만든 미작성 stub — 커밋일 기준 초록으로 떠도 알맹이가 없음을 표시 */}
            {p.isStub && (
              <span
                title="스윕이 자동 생성한 미작성 카드 — STATUS.md를 실제 내용으로 채우면 사라집니다"
                style={{
                  fontSize: 11, fontWeight: 600, color: "#8a7a2e",
                  background: "#f4efdb", padding: "3px 8px", borderRadius: 999,
                  whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                🌱 미작성
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 12, fontWeight: 600, color,
              background: `${color}1a`, padding: "3px 10px", borderRadius: 999, flexShrink: 0,
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
          marginTop: 14, paddingTop: 10, borderTop: "1px solid #f0eee7",
          display: "flex", justifyContent: "flex-end",
        }}
      >
        <Link
          href={`/p/${encodeURIComponent(p.repo)}`}
          style={{
            fontSize: 12, fontWeight: 600, color: "#73726c", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 4,
          }}
        >
          📄 본문 보기
        </Link>
      </div>
    </div>
  );
}

export default function ProjectGrid({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  // 각 필터에 몇 개가 걸리는지 (칩 라벨에 표시)
  const counts = useMemo(() => {
    const c = {} as Record<FilterKey, number>;
    for (const f of FILTERS) c[f.key] = projects.filter(f.match).length;
    return c;
  }, [projects]);

  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const visible = projects.filter(active.match);

  return (
    <>
      {/* 필터 칩 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {FILTERS.map((f) => {
          const on = f.key === filter;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                padding: "6px 12px", borderRadius: 999,
                border: `1px solid ${on ? "#3d3d3a" : "#e6e3da"}`,
                background: on ? "#3d3d3a" : "#ffffff",
                color: on ? "#ffffff" : "#73726c",
              }}
            >
              {f.label} {counts[f.key]}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p style={{ color: "#a8a69d", fontSize: 14 }}>해당하는 프로젝트가 없습니다.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 18,
          }}
        >
          {visible.map((p) => (
            <Card key={p.repo} p={p} />
          ))}
        </div>
      )}
    </>
  );
}
