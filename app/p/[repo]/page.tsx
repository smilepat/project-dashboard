// app/p/[repo]/page.tsx
// ─────────────────────────────────────────────────────────────
// /p/<repo-name> 동적 라우트.
// 그 repo의 STATUS.md를 GitHub에서 가져와 대시보드 안에서
// 마크다운 형태로 직접 렌더. GitHub에 안 가도 본문 확인 가능.
// 서버 컴포넌트(토큰 보호) + 1시간 ISR.
// ─────────────────────────────────────────────────────────────

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { marked } from 'marked';
import matter from 'gray-matter';
import { fetchProjectStatus } from '@/lib/github';

// 1시간(3600초) ISR — 첫 페이지(/)와 같은 캐시 주기
export const revalidate = 3600;

type Props = {
  params: Promise<{ repo: string }>;
};

// gray-matter는 YAML의 따옴표 없는 날짜(`updated: 2026-05-24`)를
// Date 객체로 자동 변환한다. React는 객체를 직접 렌더 못 하니
// string으로 변환하는 헬퍼가 필요.
function fmText(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

const COLOR = {
  green: '#1D9E75',
  yellow: '#EF9F27',
  red: '#E24B4A',
  border: '#e6e3da',
  text: '#3d3d3a',
  sub: '#73726c',
  bg: '#ffffff',
  hover: '#f0eee7',
};

const STATUS_LABEL: Record<string, string> = {
  active: '진행중',
  paused: '보류',
  done: '완료',
};

export default async function PreviewPage({ params }: Props) {
  const { repo } = await params;
  // URL-encoded repo 이름(예: project%2Ddashboard)을 원래대로 복원
  const repoName = decodeURIComponent(repo);

  let raw;
  try {
    raw = await fetchProjectStatus(repoName);
  } catch {
    // 토큰 권한 없거나 repo 미존재 → 404
    notFound();
  }

  // STATUS.md 자체가 없으면 404
  if (!raw.statusRaw) {
    notFound();
  }

  // Front matter(--- 머리말) 분리 + 본문만 마크다운으로 렌더
  const parsed = matter(raw.statusRaw);
  // 실제 YAML이 어떻게 파싱될지 단정 못함(updated가 Date가 되거나 progress가
  // string이 되는 사례). unknown으로 받고 렌더 시 헬퍼로 변환.
  const fm = parsed.data as Record<string, unknown>;
  const bodyHtml = (await marked.parse(parsed.content)) as string;

  const progressNum =
    typeof fm.progress === 'number'
      ? fm.progress
      : Number(fmText(fm.progress)) || 0;
  const statusStr = fmText(fm.status);
  const statusColor =
    statusStr === 'done' ? COLOR.green : statusStr === 'paused' ? COLOR.yellow : COLOR.green;

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 64px' }}>
      {/* 상단 내비 — 대시보드로 / GitHub로 */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          fontSize: 13,
        }}
      >
        <Link
          href='/'
          style={{
            color: COLOR.sub,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ← 대시보드로
        </Link>
        <a
          href={raw.url}
          target='_blank'
          rel='noopener noreferrer'
          style={{
            color: COLOR.green,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontWeight: 600,
          }}
        >
          GitHub에서 보기 ↗
        </a>
      </nav>

      {/* 메타 헤더 */}
      <header
        style={{
          padding: '20px 24px',
          background: COLOR.bg,
          border: `1px solid ${COLOR.border}`,
          borderLeft: `4px solid ${statusColor}`,
          borderRadius: 12,
          marginBottom: 28,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 10px', color: COLOR.text }}>
          {fmText(fm.project) || repoName}
        </h1>

        {/* 진행률 막대 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              flex: 1,
              height: 8,
              background: '#f0eee7',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressNum}%`,
                height: '100%',
                background: statusColor,
              }}
            />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 38, textAlign: 'right' }}>
            {progressNum}%
          </span>
        </div>

        {/* 메타 정보 */}
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: COLOR.sub, flexWrap: 'wrap' }}>
          {statusStr && <span>{STATUS_LABEL[statusStr] ?? statusStr}</span>}
          {fmText(fm.updated) && (
            <>
              <span>·</span>
              <span>최근 수정: {fmText(fm.updated)}</span>
            </>
          )}
          {fmText(fm.pc) && (
            <>
              <span>·</span>
              <span>{fmText(fm.pc)}</span>
            </>
          )}
        </div>
      </header>

      {/* STATUS.md 본문 — marked로 변환된 HTML */}
      <article
        className='md-body'
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />

      {/* 마크다운 본문 전용 스타일 — 외부 CSS 의존 없이 페이지에 inline */}
      <style>{`
        .md-body { color: ${COLOR.text}; line-height: 1.7; font-size: 15px; }
        .md-body h1 { font-size: 1.7em; font-weight: 700; margin: 1.4em 0 0.5em; }
        .md-body h2 { font-size: 1.3em; font-weight: 700; margin: 1.6em 0 0.5em; padding-bottom: 6px; border-bottom: 1px solid ${COLOR.border}; }
        .md-body h3 { font-size: 1.1em; font-weight: 600; margin: 1.4em 0 0.4em; }
        .md-body h4 { font-size: 1em; font-weight: 600; margin: 1.2em 0 0.3em; }
        .md-body p { margin: 0.6em 0; }
        .md-body ul, .md-body ol { padding-left: 1.6em; margin: 0.6em 0; }
        .md-body li { margin: 0.25em 0; }
        .md-body code { background: ${COLOR.hover}; padding: 1px 6px; border-radius: 4px; font-size: 0.9em; font-family: ui-monospace, SFMono-Regular, monospace; }
        .md-body pre { background: ${COLOR.hover}; padding: 12px 14px; border-radius: 8px; overflow-x: auto; }
        .md-body pre code { background: transparent; padding: 0; }
        .md-body blockquote { border-left: 3px solid ${COLOR.border}; padding-left: 12px; color: ${COLOR.sub}; margin: 0.8em 0; }
        .md-body a { color: ${COLOR.green}; }
        .md-body table { border-collapse: collapse; margin: 0.8em 0; font-size: 0.92em; }
        .md-body th, .md-body td { border: 1px solid ${COLOR.border}; padding: 6px 10px; text-align: left; }
        .md-body th { background: ${COLOR.hover}; font-weight: 600; }
        .md-body hr { border: none; border-top: 1px solid ${COLOR.border}; margin: 1.4em 0; }
        .md-body input[type="checkbox"] { margin-right: 6px; }
      `}</style>
    </main>
  );
}
