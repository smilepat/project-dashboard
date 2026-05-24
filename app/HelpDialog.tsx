'use client';

// app/HelpDialog.tsx
// ─────────────────────────────────────────────────────────────
// 헤더 우측의 "도움말" 버튼 + 클릭 시 뜨는 사용 방법 모달.
// client component('use client'): 토글 상태(useState)와
// 키보드 이벤트(ESC로 닫기)를 처리하기 위해 클라이언트에서 동작.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';

// 공통 색상 — page.tsx 톤과 통일
const COLOR = {
  green: '#1D9E75',
  border: '#e6e3da',
  text: '#3d3d3a',
  sub: '#73726c',
  bg: '#ffffff',
  hover: '#f0eee7',
  callout: '#fffaf0',
  calloutBorder: '#f0d8a8',
};

export default function HelpDialog() {
  const [open, setOpen] = useState(false);

  // ESC 키로 모달 닫기 + 모달 열렸을 때 본문 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  return (
    <>
      {/* 버튼 — 헤더 우측 정렬용으로 부모 flex 안에 들어감 */}
      <button
        type='button'
        onClick={() => setOpen(true)}
        aria-label='사용 방법 열기'
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          fontSize: 13,
          fontWeight: 600,
          color: COLOR.green,
          background: COLOR.bg,
          border: `1px solid ${COLOR.green}`,
          borderRadius: 999,
          cursor: 'pointer',
        }}
      >
        <span aria-hidden>❓</span>
        <span>사용 방법</span>
      </button>

      {/* 모달 — open 일 때만 렌더 */}
      {open && (
        <div
          role='dialog'
          aria-modal='true'
          aria-label='사용 방법'
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          {/* 모달 본문 — 외부 클릭은 닫히고 내부 클릭은 닫히지 않음 */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: COLOR.bg,
              borderRadius: 16,
              maxWidth: 720,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              padding: '28px 28px 24px',
              position: 'relative',
            }}
          >
            {/* 닫기 버튼 */}
            <button
              type='button'
              onClick={() => setOpen(false)}
              aria-label='닫기'
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                fontSize: 18,
                color: COLOR.sub,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 8,
              }}
            >
              ✕
            </button>

            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: COLOR.text }}>
              사용 방법
            </h2>
            <p style={{ fontSize: 13, color: COLOR.sub, margin: '0 0 22px' }}>
              초보자 안내 — 새 프로젝트를 카드에 띄우는 방법과 자동 갱신 동작
            </p>

            {/* TL;DR — 가장 먼저 보이는 핵심 요약 */}
            <Callout title='⏱️ 1분 요약'>
              <ol style={listStyle}>
                <li>
                  새 GitHub repo 만들거나 clone한 뒤, 그 폴더 루트에{' '}
                  <Code>STATUS.md</Code> 파일 1장만 만들어 push하면 끝.
                </li>
                <li>
                  최대 1시간 안에 카드가 자동으로 뜸 (즉시 보려면 Vercel Redeploy).
                </li>
                <li>
                  그 뒤로는 Claude Code에 <Code>오늘 작업 기준으로 STATUS.md 갱신</Code>{' '}
                  한마디만 하면 진행률·날짜 자동 업데이트 + push 명령어 안내.
                </li>
              </ol>
            </Callout>

            {/* 섹션 1 — 자동 갱신 작동 방식 */}
            <Section title='🔄 자동 갱신은 이렇게 작동해요'>
              <p style={pStyle}>
                카드에 표시되는 정보는 <strong>두 갈래</strong>로 갱신됩니다.
              </p>

              <SubSection title='① 신호등 색·"X일 전" 표시 — 코드 push만으로 자동'>
                <p style={pStyle}>
                  그 repo에 <strong>아무 코드라도 push하면</strong> "마지막 커밋 날짜"가
                  갱신되어 신호등 색(초록·노랑·빨강)이 자동으로 살아남. STATUS.md를 안
                  건드려도 OK.
                </p>
              </SubSection>

              <SubSection title='② 진행률·다음 할 일 — STATUS.md를 직접 갱신해야 반영'>
                <p style={pStyle}>
                  Front Matter의 <Code>progress</Code>, <Code>updated</Code>와 본문
                  체크리스트는 STATUS.md를 편집해 push해야 카드에 반영됩니다. 직접
                  편집해도 되지만, 더 편한 방법은:
                </p>

                <div style={{ ...callBlock, marginTop: 10 }}>
                  <p style={{ ...pStyle, margin: '0 0 6px', fontWeight: 600 }}>
                    💬 Claude Code에 작업 끝낼 때 한마디
                  </p>
                  <Code block>오늘 한 작업 기준으로 STATUS.md 업데이트하고 git push 명령어 알려줘.</Code>
                  <p style={{ ...pStyle, margin: '8px 0 0', fontSize: 12, color: COLOR.sub }}>
                    → Claude가 자동으로: STATUS.md의 progress·updated·체크리스트·다음
                    할 일 갱신 + git 명령어 정리해드림. (각 repo의 CLAUDE.md에 세션 규칙
                    블록이 이미 심어져 있을 때 작동)
                  </p>
                </div>

                <div style={{ ...callBlock, marginTop: 10 }}>
                  <p style={{ ...pStyle, margin: '0 0 6px', fontWeight: 600 }}>
                    💬 작업 시작할 때 한마디
                  </p>
                  <Code block>STATUS.md 읽고 현재 상황 요약해줘. "다음에 할 일" 1번부터 이어서 하자.</Code>
                  <p style={{ ...pStyle, margin: '8px 0 0', fontSize: 12, color: COLOR.sub }}>
                    → Claude가 그 repo의 STATUS.md를 읽고 어디서부터 이어갈지 정리해드림.
                  </p>
                </div>
              </SubSection>
            </Section>

            {/* 섹션 2 — 시나리오별 단계 */}
            <Section title='📦 시나리오별 단계'>
              <SubSection title='A. 새 프로젝트를 대시보드에 띄우기'>
                <ol style={listStyle}>
                  <li>
                    GitHub에 새 repo 생성 + 로컬에 clone (또는 이미 있는 repo로 cd)
                  </li>
                  <li>
                    그 폴더 루트에 <Code>STATUS.md</Code> 파일 만들기. 가장 빠른 방법은
                    project-dashboard의 템플릿 복사:
                    <Code block margin>cp ../project-dashboard/templates/STATUS.template.md ./STATUS.md</Code>
                  </li>
                  <li>
                    파일 안의 Front Matter 3줄만 정확히 채우기:
                    <Code block margin>{`---
project: 프로젝트 이름
status: active        # active | paused | done
progress: 0           # 0~100 사이 숫자
updated: 2026-05-24   # YYYY-MM-DD
pc: home-desktop
---`}</Code>
                  </li>
                  <li>
                    push:
                    <Code block margin>git add STATUS.md{`\n`}git commit -m &quot;add STATUS.md&quot;{`\n`}git push</Code>
                  </li>
                  <li>
                    최대 1시간 안에 새 카드 등장. 즉시 보고 싶으면{' '}
                    <strong>Vercel → Deployments → 최신 ⋯ → Redeploy</strong>.
                  </li>
                </ol>
              </SubSection>

              <SubSection title='B. 기존 GitHub repo를 clone해서 작업 재개'>
                <ol style={listStyle}>
                  <li>
                    <Code>git clone</Code>해서 그 폴더로 cd
                  </li>
                  <li>
                    Claude Code 열고{' '}
                    <Code>STATUS.md 읽고 다음에 할 일 1번부터 이어서 하자</Code>
                  </li>
                  <li>
                    작업 끝나면{' '}
                    <Code>오늘 작업 기준으로 STATUS.md 업데이트하고 git push 명령어 알려줘</Code>
                  </li>
                </ol>
              </SubSection>

              <SubSection title='C. 다른 PC에서 이 대시보드(project-dashboard) 자체를 처음 설치'>
                <Code block margin>{`git clone https://github.com/smilepat/project-dashboard.git
cd project-dashboard
npm install
cp .env.local.example .env.local
# .env.local 의 GITHUB_TOKEN 값 채우기
npm run dev`}</Code>
                <p style={{ ...pStyle, margin: '6px 0 0', fontSize: 12, color: COLOR.sub }}>
                  → 브라우저에서 http://localhost:3000 접속.
                </p>
              </SubSection>
            </Section>

            {/* 섹션 3 — PWA 설치 */}
            <Section title='📲 앱처럼 설치하기 (PWA)'>
              <p style={pStyle}>
                홈 화면 아이콘 + 독립 창 실행. 한 번 설치하면 브라우저 주소창 없이
                진짜 앱처럼 사용.
              </p>
              <InstallTable />
              <p style={{ ...pStyle, fontSize: 12, color: COLOR.sub, margin: '10px 0 0' }}>
                💡 첫 방문 시 1초 정도 service worker 등록 대기 후 새로고침(F5)하면
                설치 버튼이 보입니다.
              </p>
            </Section>

            {/* 섹션 4 — 트러블슈팅 */}
            <Section title='🆘 카드가 안 보일 때 체크리스트'>
              <ul style={listStyle}>
                <li>
                  해당 repo에 <Code>STATUS.md</Code>가 <strong>default branch</strong>(main 또는
                  master)에 push되었는가?
                </li>
                <li>
                  Front Matter <Code>---</Code> 블록 형식이 깨지지 않았는가? 들여쓰기·콜론
                  형식 확인.
                </li>
                <li>
                  GitHub 토큰의 Repository access에 그 repo가 포함되어 있는가?
                  (organization repo는 별도 권한 필요)
                </li>
                <li>
                  1시간 ISR 캐시 — 즉시 갱신하려면 Vercel Redeploy.
                </li>
              </ul>
            </Section>

            {/* 섹션 5 — 신호등 규칙 (선택) */}
            <Section title='⚙️ 신호등 색은 어떻게 정해지나요?'>
              <ul style={listStyle}>
                <li>
                  🟢 <strong>활발</strong> — 마지막 커밋이 3일 이내 또는 status: done
                </li>
                <li>
                  🟡 <strong>주의</strong> — 마지막 커밋이 4~7일 또는 status: paused
                </li>
                <li>
                  🔴 <strong>방치</strong> — 마지막 커밋이 8일 이상 + status가 done/paused 아님
                </li>
              </ul>
            </Section>
          </div>
        </div>
      )}
    </>
  );
}

// ── 작은 보조 컴포넌트들 ──

const pStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.7,
  color: COLOR.text,
  margin: '0 0 8px',
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  lineHeight: 1.85,
  fontSize: 14,
  color: COLOR.text,
};

const callBlock: React.CSSProperties = {
  background: COLOR.callout,
  border: `1px solid ${COLOR.calloutBorder}`,
  borderRadius: 8,
  padding: '10px 12px',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px', color: COLOR.text }}>
        {title}
      </h3>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h4 style={{ fontSize: 13.5, fontWeight: 600, margin: '0 0 6px', color: COLOR.text }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ ...callBlock, marginBottom: 22 }}>
      <p style={{ fontSize: 13.5, fontWeight: 700, margin: '0 0 8px', color: COLOR.text }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Code({
  children,
  block,
  margin,
}: {
  children: React.ReactNode;
  block?: boolean;
  margin?: boolean;
}) {
  if (block) {
    return (
      <pre
        style={{
          background: COLOR.hover,
          padding: '10px 12px',
          borderRadius: 6,
          fontSize: 12.5,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          margin: margin ? '6px 0 0' : 0,
          overflowX: 'auto',
          whiteSpace: 'pre',
          color: COLOR.text,
        }}
      >
        {children}
      </pre>
    );
  }
  return (
    <code
      style={{
        background: COLOR.hover,
        padding: '1px 6px',
        borderRadius: 4,
        fontSize: 12.5,
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
      }}
    >
      {children}
    </code>
  );
}

function InstallTable() {
  const rows: Array<[string, string]> = [
    ['PC Chrome / Edge', '주소창 우측 ⊕ 컴퓨터 아이콘 또는 ⋮ → "앱 설치"'],
    ['Android Chrome', '자동 배너 또는 ⋮ → "홈 화면에 추가"'],
    ['iOS Safari', '하단 공유(네모+화살표) → "홈 화면에 추가"'],
    ['iPad Safari', '공유 버튼 → "홈 화면에 추가"'],
  ];
  return (
    <div style={{ border: `1px solid ${COLOR.border}`, borderRadius: 10, overflow: 'hidden' }}>
      {rows.map(([env, how], i) => (
        <div
          key={env}
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr',
            gap: 12,
            padding: '10px 14px',
            fontSize: 13,
            borderTop: i === 0 ? 'none' : `1px solid ${COLOR.border}`,
            background: i % 2 === 0 ? COLOR.bg : '#fafaf6',
          }}
        >
          <div style={{ fontWeight: 600, color: COLOR.text }}>{env}</div>
          <div style={{ color: COLOR.sub }}>{how}</div>
        </div>
      ))}
    </div>
  );
}
