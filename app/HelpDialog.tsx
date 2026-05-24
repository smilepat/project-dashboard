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
              maxWidth: 640,
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
              이 대시보드가 어떻게 동작하고, 스마트폰·PC에 앱처럼 설치하는 방법
            </p>

            {/* 섹션 1 — 대시보드 기본 사용법 */}
            <Section title='🟢 대시보드 자체 사용법'>
              <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, fontSize: 14, color: COLOR.text }}>
                <li>
                  각 프로젝트 repo 루트에 <Code>STATUS.md</Code> 파일을 둡니다 (템플릿:{' '}
                  <Code>templates/STATUS.template.md</Code>).
                </li>
                <li>
                  그 파일의 <Code>--- 머리말 ---</Code> 블록에 <Code>progress</Code>,{' '}
                  <Code>status</Code>, <Code>updated</Code> 3줄을 채우고 GitHub에 push.
                </li>
                <li>
                  이 대시보드가 1시간마다 자동으로 모든 repo의 STATUS.md를 가져와 카드로 그립니다.
                </li>
                <li>
                  카드 색(초록·노랑·빨강)은 마지막 커밋 날짜와 status로 자동 계산됩니다.
                </li>
              </ol>
            </Section>

            {/* 섹션 2 — PWA 설치 */}
            <Section title='📲 앱처럼 설치하기 (PWA)'>
              <p style={{ fontSize: 13, color: COLOR.sub, margin: '0 0 12px' }}>
                홈 화면 아이콘 + 독립 창 실행. 한 번 설치하면 브라우저 주소창 없이 진짜 앱처럼 사용.
              </p>
              <InstallTable />
              <p style={{ fontSize: 12, color: COLOR.sub, margin: '12px 0 0' }}>
                💡 첫 방문 시 1초 정도 service worker 등록 대기 후 새로고침(F5)하면 설치 버튼이 보입니다.
              </p>
            </Section>

            {/* 섹션 3 — 자주 막히는 곳 */}
            <Section title='🆘 카드가 안 보일 때'>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, fontSize: 14, color: COLOR.text }}>
                <li>해당 repo에 STATUS.md가 실제로 push되었는지 확인</li>
                <li>GitHub 토큰의 Repository access에 그 repo가 포함되어 있는지 확인</li>
                <li>최대 1시간 ISR 캐시 — 즉시 갱신하려면 Vercel 재배포</li>
              </ul>
            </Section>
          </div>
        </div>
      )}
    </>
  );
}

// ── 작은 보조 컴포넌트들 ──

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 22 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px', color: COLOR.text }}>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
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
