// proxy.ts
// ─────────────────────────────────────────────────────────────
// 배포된 대시보드 접근 제어 (Basic Auth).
// Next.js 16의 proxy 관례(구 middleware) — 모든 요청을 가로채 인증을 검사한다.
//
// 이 앱은 private repo의 STATUS.md 내용·repo 이름을 화면에 노출하므로,
// Vercel URL을 아는 누구나 볼 수 있으면 안 된다.
//
// 동작:
//   - 환경변수 DASH_PASSWORD가 설정돼 있으면 모든 페이지에 Basic Auth 요구.
//     (아이디는 admin 고정, 비밀번호는 DASH_PASSWORD)
//   - DASH_PASSWORD가 비어 있으면 게이트를 적용하지 않는다(로컬 개발 편의).
//     ⚠️ 따라서 공개 배포 시 Vercel 환경변수에 DASH_PASSWORD를 반드시 설정할 것.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';

// 상수 시간(timing-safe) 문자열 비교.
// 일반 `!==`는 첫 불일치 문자에서 즉시 끝나 비교 시간이 입력에 따라 달라지므로,
// 이론상 타이밍 공격으로 비밀번호를 한 글자씩 추측당할 수 있다.
// Edge 런타임에는 Node의 crypto.timingSafeEqual이 없으므로, 조기 반환 없이
// 더 긴 쪽 길이만큼 순회하며 차이를 누적해 항상 동일한 경로로 비교한다.
function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length; // 길이 차이도 불일치로 반영
  for (let i = 0; i < len; i++) {
    // 범위를 벗어나면 charCodeAt가 NaN → `| 0`으로 0 처리
    diff |= (a.charCodeAt(i) | 0) ^ (b.charCodeAt(i) | 0);
  }
  return diff === 0;
}

export function proxy(req: NextRequest) {
  const password = process.env.DASH_PASSWORD;

  // 비밀번호 미설정 → 게이트 비활성(개발 편의). 배포 시 반드시 설정해야 보호됨.
  if (!password) return NextResponse.next();

  const auth = req.headers.get('authorization') ?? '';
  // btoa는 Edge 런타임(proxy)에서 사용 가능
  const expected = 'Basic ' + btoa(`admin:${password}`);

  if (!safeEqual(auth, expected)) {
    return new NextResponse('Authentication required.', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="project-dashboard"' },
    });
  }
  return NextResponse.next();
}

// 정적 자산·PWA 파일은 인증에서 제외(설치/아이콘 로딩이 막히지 않도록).
// 페이지 HTML(정적 프리렌더 포함)은 proxy가 먼저 가로채므로 보호된다.
export const config = {
  matcher: ['/((?!_next/|favicon.ico|manifest.json|sw.js|icon-|apple-touch-icon).*)'],
};
