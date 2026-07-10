// app/digest/page.tsx
// ─────────────────────────────────────────────────────────────
// /digest — repo-ops-system 이 매일 굽는 registry/digest.json 을
// GitHub API로 읽어(서버 컴포넌트, 토큰 보호) 한 화면에 보여준다.
// 전체 레포 모멘텀(활성/식는중/정체) + 적신호 + PC별 미저장 작업.
// 1시간 ISR — 매일 커밋되는 digest 를 최대 1시간 지연으로 반영.
// ─────────────────────────────────────────────────────────────

import Link from 'next/link';
import { fetchDigest, type Digest, type DigestRepo } from '@/lib/github';
import RefreshButton from '../RefreshButton';

export const revalidate = 3600;

const COLOR = {
  border: '#e6e3da', text: '#3d3d3a', sub: '#73726c', bg: '#ffffff',
  hover: '#f0eee7', red: '#E24B4A', amber: '#EF9F27', green: '#1D9E75', blue: '#3B7DD8',
};

function agoText(days?: number): string {
  if (days === null || days === undefined) return '기록 없음';
  if (days <= 0) return '오늘';
  if (days === 1) return '어제';
  return `${days}일 전`;
}

function fmtWhen(iso?: string): string {
  if (!iso) return '';
  // 재현성/서버-클라 불일치 방지: ISO 앞 16자(YYYY-MM-DD HH:MM)만
  return iso.replace('T', ' ').slice(0, 16) + ' UTC';
}

// 레포 한 줄
function RepoRow({ r }: { r: DigestRepo }) {
  const chips: string[] = [`${agoText(r.age)}`];
  if (r.openPRs) chips.push(`PR ${r.openPRs}`);
  if (r.openIssues) chips.push(`이슈 ${r.openIssues}`);
  if (r.action) chips.push(`action:${r.action}`);
  return (
    <li style={{ margin: '8px 0', lineHeight: 1.5 }}>
      <a href={r.url} target="_blank" rel="noopener noreferrer"
        style={{ color: COLOR.text, fontWeight: 600, textDecoration: 'none' }}>
        {r.full_name}
      </a>
      <span style={{ color: COLOR.sub, fontSize: 13 }}> · {chips.join(' · ')}</span>
      {r.next && (
        <div style={{ fontSize: 13, color: COLOR.sub, marginTop: 2 }}>
          <span style={{ color: '#a8a69d' }}>다음 → </span>{r.next}
        </div>
      )}
    </li>
  );
}

function Section({ title, accent, repos, empty }: { title: string; accent: string; repos?: DigestRepo[]; empty: string }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: COLOR.text, borderLeft: `4px solid ${accent}`, paddingLeft: 10 }}>
        {title} <span style={{ color: COLOR.sub, fontWeight: 400 }}>({repos?.length ?? 0})</span>
      </h2>
      {repos && repos.length ? (
        <ul style={{ listStyle: 'none', padding: '4px 0 0 14px', margin: 0 }}>
          {repos.map((r) => <RepoRow key={r.full_name} r={r} />)}
        </ul>
      ) : (
        <p style={{ color: '#a8a69d', fontSize: 13, padding: '4px 0 0 14px', margin: 0 }}>{empty}</p>
      )}
    </section>
  );
}

export default async function DigestPage() {
  let d: Digest | null = null;
  let error: string | null = null;
  try {
    d = await fetchDigest();
  } catch (e: any) {
    error = e?.message ?? '다이제스트를 불러오지 못했습니다.';
  }

  const c = d?.counts ?? {};
  const freshMachines = (d?.machines ?? []).filter((m) => !m.stale && (m.repos?.length ?? 0) > 0);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 64px' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, fontSize: 13 }}>
        <Link href="/" style={{ color: COLOR.sub, textDecoration: 'none' }}>← 대시보드로</Link>
        <RefreshButton />
      </nav>

      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>📋 프로젝트 다이제스트</h1>
        <p style={{ color: COLOR.sub, marginTop: 6, fontSize: 13 }}>
          전체 레포 모멘텀 · repo-ops-system 이 매일 자동 생성
          {d?.generatedAt && <> · {fmtWhen(d.generatedAt)}</>}
          {d && <> · {d.enriched ? `보강 ${d.enrichedCount}` : 'CSV 전용'}</>}
        </p>
      </header>

      {error && (
        <div style={{ padding: 20, background: '#fdeaea', color: '#a32d2d', borderRadius: 12, fontSize: 14, lineHeight: 1.6 }}>
          <b>다이제스트를 불러오지 못했습니다.</b><br />{error}
          <div style={{ marginTop: 10, color: '#7a4a2d', fontSize: 13 }}>
            대개 배포 토큰(<code>GITHUB_TOKEN</code>)이 private <code>smilepat/repo-ops-system</code> 레포에 접근 권한이 없을 때입니다.
            토큰 Repository access를 <b>All repositories</b>(또는 repo-ops-system 포함)로 넓히고 Vercel 환경변수를 갱신하세요.
            또한 그 레포 <code>main</code> 에 <code>registry/digest.json</code> 이 커밋돼 있어야 합니다(Daily digest 워크플로 1회 실행).
          </div>
        </div>
      )}

      {d && !error && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {[
              ['전체', c.total], ['활성', c.active], ['식는중', c.cooling],
              ['정체', c.stale_with_intent], ['파킹', c.parked], ['적신호', c.redFlags], ['미저장', c.dirtyWork],
            ].map(([label, n]) => (
              <span key={label as string} style={{ fontSize: 13, background: COLOR.hover, color: COLOR.text, padding: '5px 12px', borderRadius: 999 }}>
                {label} <b>{(n as number) ?? 0}</b>
              </span>
            ))}
          </div>

          {(d.redFlags?.length ?? 0) > 0 && (
            <section style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: COLOR.red, borderLeft: `4px solid ${COLOR.red}`, paddingLeft: 10 }}>
                🚨 적신호 <span style={{ color: COLOR.sub, fontWeight: 400 }}>({d.redFlags!.length})</span>
              </h2>
              <ul style={{ listStyle: 'none', padding: '4px 0 0 14px', margin: 0 }}>
                {d.redFlags!.map((f, i) => (
                  <li key={i} style={{ margin: '6px 0', fontSize: 14, color: COLOR.text }}>
                    <span style={{ color: COLOR.red, fontWeight: 700 }}>·</span> {f.detail}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Section title="🔥 활성 (≤7일)" accent={COLOR.green} repos={d.active} empty="없음" />
          <Section title="🟢 식는 중 (8–21일)" accent={COLOR.amber} repos={d.cooling} empty="없음" />
          <Section title="🟡 정체됐지만 의도 있음 (>21일)" accent={COLOR.amber} repos={d.stale_with_intent} empty="없음" />

          {freshMachines.length > 0 && (
            <section style={{ marginBottom: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: COLOR.blue, borderLeft: `4px solid ${COLOR.blue}`, paddingLeft: 10 }}>
                💻 PC별 미저장/미푸시 작업
              </h2>
              <p style={{ fontSize: 12, color: COLOR.sub, margin: '0 0 6px 14px' }}>GitHub엔 안 보이는, 어느 PC에 남은 미커밋·미푸시 작업.</p>
              {freshMachines.map((m) => (
                <div key={m.hostname} style={{ padding: '10px 14px', background: COLOR.bg, border: `1px solid ${COLOR.border}`, borderRadius: 10, marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.hostname} <span style={{ color: COLOR.sub, fontWeight: 400, fontSize: 12 }}>({m.ageHours}시간 전)</span></div>
                  <ul style={{ listStyle: 'none', padding: '4px 0 0', margin: 0 }}>
                    {(m.repos ?? []).map((r, i) => (
                      <li key={i} style={{ fontSize: 13, color: COLOR.text, margin: '3px 0' }}>
                        {r.name}: 미커밋 {r.dirty ?? 0}{r.ahead ? ` · 미푸시 ${r.ahead}` : ''} · <code style={{ background: COLOR.hover, padding: '1px 5px', borderRadius: 4 }}>{r.branch}</code>
                        {r.subject ? <span style={{ color: COLOR.sub }}> — {r.subject}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}
