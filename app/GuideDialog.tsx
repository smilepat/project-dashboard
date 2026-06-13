'use client';

// app/GuideDialog.tsx
// ─────────────────────────────────────────────────────────────
// 헤더 우측의 "앱 안내" 버튼 + 클릭 시 뜨는 개요/작동방식/가이드 모달.
// HelpDialog(❓ 사용 방법, 작업·트러블슈팅 중심)과 역할을 분리한다:
//   - GuideDialog: 이 앱이 무엇이고 어떻게 굴러가는지(개요·작동 원리·사용 흐름)
//   - HelpDialog : 새 프로젝트를 띄우는 구체적 단계·문제 해결
// client component('use client'): 토글 상태(useState)와 ESC 키 처리 때문.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';

// 공통 색상 — page.tsx / HelpDialog 톤과 통일
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

export default function GuideDialog() {
  const [open, setOpen] = useState(false);

  // ESC 키로 닫기 + 열렸을 때 본문 스크롤 잠금
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
      {/* 버튼 — 헤더 우측 flex 안에 배치 */}
      <button
        type='button'
        onClick={() => setOpen(true)}
        aria-label='앱 안내 열기'
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          fontSize: 13,
          fontWeight: 600,
          color: COLOR.bg,
          background: COLOR.green,
          border: `1px solid ${COLOR.green}`,
          borderRadius: 999,
          cursor: 'pointer',
        }}
      >
        <span aria-hidden>📖</span>
        <span>앱 안내</span>
      </button>

      {/* 모달 */}
      {open && (
        <div
          role='dialog'
          aria-modal='true'
          aria-label='앱 안내'
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
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: COLOR.bg,
              borderRadius: 16,
              maxWidth: 760,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              padding: '28px 28px 24px',
              position: 'relative',
            }}
          >
            {/* 닫기 */}
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
              📖 앱 안내
            </h2>
            <p style={{ fontSize: 13, color: COLOR.sub, margin: '0 0 22px' }}>
              앱 개요 · 작동 방식 · 사용자 가이드
            </p>

            {/* 한 줄 요약 */}
            <Callout title='🎯 한 줄 요약'>
              <p style={{ ...pStyle, margin: 0 }}>
                여러 PC·여러 프로젝트의 진행 상황을, 각 repo에 둔{' '}
                <Code>STATUS.md</Code> 한 파일로 모아 <strong>한 화면의 카드 + 신호등</strong>으로
                보여주는 개인용 대시보드입니다.
              </p>
            </Callout>

            {/* 1. 앱 개요 */}
            <Section title='📌 앱 개요'>
              <p style={pStyle}>
                여러 PC를 오가며 여러 repo를 작업하면 “지금 뭐가 어디까지 됐는지”가
                흩어지기 쉽습니다. 이 앱은 각 프로젝트가 자기 repo에 적어 둔{' '}
                <Code>STATUS.md</Code>를 GitHub에서 모아, 방치된 순으로 카드로 정렬해
                한눈에 보여줍니다.
              </p>
              <p style={{ ...pStyle, margin: '4px 0 8px', fontWeight: 600 }}>카드가 보여주는 것</p>
              <ul style={listStyle}>
                <li>프로젝트명 · 한 줄 상태 · 진행률(%)</li>
                <li>다음에 할 일(첫 항목) · 마지막 작업일(“X일 전”)</li>
                <li>마지막 작업 PC · 상태(진행중/보류/완료)</li>
                <li>방치 정도를 알려주는 신호등(🟢/🟡/🔴)</li>
              </ul>
              <p style={{ ...pStyle, margin: '10px 0 0', fontSize: 12.5, color: COLOR.sub }}>
                기술: Next.js + Vercel + GitHub API · PWA 설치 가능 · 1시간마다 자동 새로고침(ISR).
              </p>
            </Section>

            {/* 2. 작동 방식 */}
            <Section title='🔧 작동 방식'>
              <p style={pStyle}>
                진실의 출처(SSoT)는 <strong>각 repo의 STATUS.md</strong>입니다. 대시보드는
                그것을 GitHub API로 <strong>읽어서 그릴 뿐</strong>인 읽기 전용 뷰어예요.
              </p>
              <Code block margin>{`각 프로젝트 repo                       이 대시보드
┌──────────────────┐               ┌──────────────────────┐
│ my-app/STATUS.md │──┐            │ ① GitHub API로 수집   │
│ proj-b/STATUS.md │──┼─ git push →│   STATUS.md + 커밋일  │
│ proj-c/STATUS.md │──┘  [GitHub]  │ ② 파싱(Front Matter) │
└──────────────────┘               │ ③ 카드 + 신호등 렌더  │
                                   └──────────────────────┘`}</Code>

              <SubSection title='① STATUS.md 한 파일이 카드가 된다'>
                <p style={pStyle}>
                  repo 루트의 <Code>STATUS.md</Code>를 가져와 맨 위 Front Matter
                  (<Code>---</Code> 블록)의 <Code>progress</Code>·<Code>status</Code>·
                  <Code>updated</Code>·<Code>pc</Code>와 본문(한 줄 상태·다음 할 일·체크리스트)을
                  카드로 변환합니다. STATUS.md가 없는 repo는 카드에서 자동 제외됩니다.
                </p>
              </SubSection>

              <SubSection title='② 여러 PC는 어떻게 합쳐지나'>
                <p style={pStyle}>
                  대시보드는 <strong>PC를 인식하지 않습니다.</strong> 모든 PC가{' '}
                  <Code>git push</Code>로 GitHub의 STATUS.md에 모이고, 대시보드는 그 결과를
                  읽을 뿐입니다. 카드의 PC 이름은 STATUS.md의 <Code>pc</Code> 필드에 적힌
                  텍스트예요. 즉 멀티-PC 동기화의 책임은 100% <strong>git pull/push</strong>에
                  있습니다.
                </p>
              </SubSection>

              <SubSection title='③ 신호등 색은 이렇게 정해진다'>
                <ul style={listStyle}>
                  <li>🟢 <strong>활발</strong> — 마지막 커밋 3일 이내 또는 <Code>status: done</Code></li>
                  <li>🟡 <strong>주의</strong> — 4~7일 또는 <Code>status: paused</Code> 또는 커밋 기록 없음</li>
                  <li>🔴 <strong>방치</strong> — 8일 이상 + done/paused 아님</li>
                </ul>
                <p style={{ ...pStyle, margin: '8px 0 0', fontSize: 12.5, color: COLOR.sub }}>
                  표시 데이터는 최대 1시간 캐시(ISR). 즉시 갱신은 헤더의 🔄 새로고침 버튼.
                </p>
              </SubSection>
            </Section>

            {/* 3. 사용자 가이드 */}
            <Section title='📖 사용자 가이드'>
              <SubSection title='1. 새 프로젝트를 카드로 띄우기'>
                <p style={pStyle}>
                  그 앱 repo 루트에 <Code>STATUS.md</Code>를 만들어 push하면 끝입니다
                  (대시보드 repo가 아니라 <strong>그 앱 repo</strong>에).
                </p>
                <Code block margin>{`git add STATUS.md
git commit -m "add STATUS.md"
git push`}</Code>
              </SubSection>

              <SubSection title='2. 매일 쓰는 두 마디 (Claude Code)'>
                <div style={callBlock}>
                  <p style={{ ...pStyle, margin: '0 0 4px', fontWeight: 600 }}>작업 시작 (git pull 후)</p>
                  <Code block>STATUS.md 읽고 현재 상황 요약해줘. &quot;다음에 할 일&quot; 1번부터 이어서 하자.</Code>
                </div>
                <div style={{ ...callBlock, marginTop: 10 }}>
                  <p style={{ ...pStyle, margin: '0 0 4px', fontWeight: 600 }}>작업 종료</p>
                  <Code block>오늘 한 작업 기준으로 STATUS.md 업데이트하고 git push 명령어 알려줘.</Code>
                  <p style={{ ...pStyle, margin: '8px 0 0', fontSize: 12, color: COLOR.sub }}>
                    → 각 repo의 CLAUDE.md에 세션 규칙 블록이 있으면, progress·updated·pc·체크리스트를
                    자동 갱신하고 push 명령어까지 안내합니다. (pc는 <Code>hostname</Code>으로 실제 PC 이름을 채움)
                  </p>
                </div>
              </SubSection>

              <SubSection title='3. 화면에서 할 수 있는 것'>
                <ul style={listStyle}>
                  <li><strong>🔄 새로고침</strong> — 1시간 캐시를 무시하고 GitHub에서 즉시 재수집</li>
                  <li><strong>❓ 사용 방법</strong> — 새 프로젝트 등록 단계·문제 해결 체크리스트</li>
                  <li><strong>📄 본문 보기</strong>(카드 하단) — GitHub에 가지 않고 STATUS.md 본문을 바로 열람</li>
                  <li>카드 본체 클릭 — 해당 GitHub repo로 이동</li>
                </ul>
              </SubSection>

              <p style={{ ...pStyle, margin: '12px 0 0', fontSize: 12.5, color: COLOR.sub }}>
                💡 새 프로젝트 등록의 자세한 단계·PWA 설치·트러블슈팅은 헤더의{' '}
                <strong>❓ 사용 방법</strong> 버튼을 참고하세요.
              </p>
            </Section>
          </div>
        </div>
      )}
    </>
  );
}

// ── 작은 보조 컴포넌트들 (HelpDialog와 동일 톤) ──

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
