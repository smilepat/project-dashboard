'use client';

// app/RefreshButton.tsx
// ─────────────────────────────────────────────────────────────
// 헤더의 "새로고침" 버튼.
// 클릭 시 Server Action(revalidateRoot)을 호출해 1시간 ISR 캐시를
// 즉시 무효화 → GitHub에서 최신 데이터를 새로 가져와 카드 갱신.
// useTransition으로 진행 중(pending) 상태를 시각화한다.
// ─────────────────────────────────────────────────────────────

import { useState, useTransition } from 'react';
import { revalidateRoot } from './actions';

const COLOR = {
  green: '#1D9E75',
  border: '#e6e3da',
  text: '#3d3d3a',
  sub: '#73726c',
  bg: '#ffffff',
};

export default function RefreshButton() {
  const [pending, startTransition] = useTransition();
  // 마지막 새로고침 시각 — 사용자 신선도 인지용
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const handleClick = () => {
    startTransition(async () => {
      await revalidateRoot();
      setLastRefreshed(new Date());
    });
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <button
        type='button'
        onClick={handleClick}
        disabled={pending}
        aria-label='카드 강제 새로고침'
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          fontSize: 13,
          fontWeight: 600,
          color: pending ? COLOR.sub : COLOR.green,
          background: COLOR.bg,
          border: `1px solid ${pending ? COLOR.border : COLOR.green}`,
          borderRadius: 999,
          cursor: pending ? 'wait' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            animation: pending ? 'rb-spin 0.8s linear infinite' : 'none',
          }}
        >
          🔄
        </span>
        <span>{pending ? '갱신 중…' : '새로고침'}</span>
      </button>

      {/* 마지막 새로고침 시각 — 미세하게 옆에 표시 */}
      {lastRefreshed && !pending && (
        <span style={{ fontSize: 11, color: COLOR.sub }}>
          {formatAgo(lastRefreshed)}
        </span>
      )}

      {/* 회전 애니메이션 — 외부 CSS 파일 없이 inline 정의 */}
      <style>{`@keyframes rb-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// "방금" / "Ns 전" / "Nm 전" 형태로 짧게 표시
function formatAgo(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 5) return '방금 갱신';
  if (sec < 60) return `${sec}초 전 갱신`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전 갱신`;
  return `${Math.floor(min / 60)}시간 전 갱신`;
}
