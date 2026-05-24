'use server';

// app/actions.ts
// ─────────────────────────────────────────────────────────────
// Server Action — 클라이언트에서 호출 가능한 서버 함수.
// 'use server' 지시어가 핵심: 이 파일의 export 함수들은 RPC 형태로
// 클라이언트에서 직접 호출되지만, 실제 실행은 서버에서 일어난다.
// ─────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache';

/**
 * 대시보드 첫 페이지(/)의 ISR 캐시를 무효화한다.
 * RefreshButton에서 호출 → Next.js가 즉시 새 데이터를 GitHub에서
 * 가져와 페이지를 다시 빌드. Vercel Redeploy 없이도 카드가 갱신됨.
 */
export async function revalidateRoot(): Promise<void> {
  revalidatePath('/');
}
