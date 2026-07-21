// app/page.tsx
// ─────────────────────────────────────────────────────────────
// 대시보드 메인 화면 (서버 컴포넌트).
// 서버에서 GitHub 데이터를 가져와(fetchAllProjects) 가공한 뒤(parseAll),
// 카드 렌더링·필터는 클라이언트 컴포넌트 ProjectGrid에 넘긴다.
// "use client" 없이 서버에서 페치 → 토큰이 브라우저에 노출 안 됨(안전).
// ─────────────────────────────────────────────────────────────

import Link from "next/link";
import { fetchAllProjects } from "@/lib/github";
import { parseAll, Project } from "@/lib/parse";
import HelpDialog from "./HelpDialog";
import GuideDialog from "./GuideDialog";
import RefreshButton from "./RefreshButton";
import ProjectGrid from "./ProjectGrid";

// 1시간(3600초)마다 페이지를 자동으로 새로 굽는다 (ISR)
export const revalidate = 3600;

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

  const stubCount = projects.filter((p) => p.isStub).length;

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
            프로젝트 {projects.length}개
            {stubCount > 0 && ` · 미작성 ${stubCount}개`} · 방치된 순으로 정렬
          </p>
        </div>
        {/* 헤더 우측 액션 — 다이제스트 + 새로고침 + 도움말 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Link
            href="/digest"
            style={{
              fontSize: 13, fontWeight: 600, color: "#ffffff", background: "#3d3d3a",
              padding: "8px 14px", borderRadius: 8, textDecoration: "none",
            }}
          >
            📋 다이제스트
          </Link>
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

      <ProjectGrid projects={projects} />
    </main>
  );
}
