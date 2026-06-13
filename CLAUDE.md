# CLAUDE.md — Project Dashboard

> Claude Code가 이 repo에서 작업할 때 자동으로 읽는 파일.
> 글로벌 `~/.claude/CLAUDE.md` 위에 이 프로젝트 특화 규칙이 얹힌다.

---

## 📌 프로젝트

여러 PC에서 굴러가는 여러 프로젝트의 STATUS.md를 GitHub API로 모아 한 화면에 카드로 보여주는 개인용 대시보드.

- **Tech**: Next.js 16 (Turbopack) + TypeScript + Vercel
- **Production**: <https://project-dashboard-drab.vercel.app>
- **PWA**: 설치 가능 (manifest + sw + 아이콘 3장)

---

## 🔄 세션 규칙 (STATUS.md 자동 관리) — 가장 중요

- **세션을 시작하면 항상 STATUS.md를 먼저 읽고** 현재 진행 상황을 파악한다.
- **작업을 마치면 STATUS.md를 갱신한다:**
  - Front Matter의 `progress`(0~100), `updated`(오늘 날짜), `pc`(현재 PC) 수정
  - 완료한 체크리스트 항목을 `[x]`로 변경
  - "다음에 할 일" 목록 갱신
- **`pc` 값은 추측하거나 템플릿 예시값(`home-desktop` 등)을 그대로 두지 않는다.**
  반드시 실제 작업 중인 이 PC의 이름을 명령으로 확인해서 채운다:
  - Windows: `hostname` (또는 `$env:COMPUTERNAME`)
  - macOS/Linux: `hostname`
  - 사용자가 정해둔 별칭(예: `한국-데스크탑`)이 있으면 그 별칭을 우선한다.
- STATUS.md의 **Front Matter `---` 블록 형식은 절대 깨뜨리지 않는다**.
- 갱신 후 `git add STATUS.md && git commit && git push` 명령어를 안내한다.
- 장기 인수인계용 HANDOFF.md도 큰 변경 후엔 함께 갱신 권장.

---

## 🛠️ 자주 쓰는 명령

```bash
npm run dev      # 로컬 dev 서버 (포트 3000)
npm run build    # 프로덕션 빌드 (Vercel과 동일)
```

> lint 스크립트는 없음(eslint 미설정). 타입 검사는 `npm run build`가 함께 수행한다.

---

## ⚠️ 알아두면 좋은 함정

- **토큰 401/403** → `.env.local`의 `GITHUB_TOKEN` 값 자체부터 의심. 과거에 `github_pat_github_pat_...`처럼 prefix 중복된 사고가 있었음. sanitize 정규식 늘리기 전에 값을 먼저 확인.
- **카드 즉시 갱신 안 됨** → `revalidate = 3600` ISR 캐시. 즉시 갱신은 Vercel Deployments → ⋯ → Redeploy.
- **Vercel 환경변수** → 환경별 분산 등록을 피하고 처음부터 **All Environments** 단일 항목으로 등록.
- **PowerShell pipe로 Vercel CLI에 env set 시 BOM/CRLF 끼어듦** → Vercel 웹 UI에 직접 붙여넣기 권장.

---

## 📂 핵심 파일

| 파일 | 역할 |
|---|---|
| `app/page.tsx` | 대시보드 메인 (서버 컴포넌트) |
| `proxy.ts` | 접근 제어 Basic Auth 게이트 (`DASH_PASSWORD`, 구 middleware 관례) |
| `app/p/[repo]/page.tsx` | STATUS.md 본문 preview (marked + sanitize-html) |
| `app/layout.tsx` | PWA 메타 + service worker 등록 |
| `app/HelpDialog.tsx` | 도움말 버튼/모달 (client component) |
| `lib/github.ts` | GitHub API (`/user/repos?affiliation=owner` 폴백) |
| `lib/parse.ts` | STATUS.md → 카드 데이터 변환 + 신호등 계산 |
| `public/manifest.json` | PWA 앱 정의 |
| `public/sw.js` | service worker (network-first, GitHub API는 캐시 제외) |
| `STATUS.md` | 이 repo의 카드 데이터 |
| `HANDOFF.md` | 장기 인수인계 문서 |
