---
project: project-dashboard
status: active
progress: 99
updated: 2026-06-26
pc: DESKTOP-J5NGRMC
---

# 🤝 Handoff Document — Project Dashboard

> 다음 세션(또는 다른 PC)에서 이 문서를 먼저 읽고 이어서 작업하세요.
> 최종 갱신: **2026-06-26**

---

## 1. 이 프로젝트가 뭐예요?

여러 PC에서 굴러가는 여러 프로젝트(Project A, repo-b, repo-c, repo-d 등)의 진행 상황을 한 화면에 모아 보여주는 **개인용 대시보드 웹앱**.

작동 원리:

1. 각 프로젝트 repo 루트에 `STATUS.md` 파일을 둔다.
2. 이 대시보드가 GitHub API로 모든 repo의 `STATUS.md`와 마지막 커밋 날짜를 가져온다.
3. Front Matter(YAML 머리말 — `---` 블록)와 본문을 파싱해서 카드 형태로 그린다.
4. 신호등(초록/노랑/빨강)으로 어느 프로젝트가 방치되고 있는지 한눈에 보여준다.

**현재 운영 중인 배포:**

- 🌐 Production URL: **[project-dashboard-drab.vercel.app](https://project-dashboard-drab.vercel.app)**
- 📦 Repo: **[smilepat/project-dashboard](https://github.com/smilepat/project-dashboard)**
- 📲 **PWA 설치 가능** (PC Chrome/Edge, Android Chrome, iOS Safari에서 홈 화면에 추가)

---

## 2. 지금까지 완료된 것 ✅

### 2-1. 코드

- [x] [app/layout.tsx](app/layout.tsx) — 최상위 레이아웃 + **PWA 메타데이터**(manifest/viewport/themeColor) + service worker 등록
- [x] [app/page.tsx](app/page.tsx) — 대시보드 메인 (서버 컴포넌트, ISR 1시간) + 헤더 우측 액션(새로고침·앱 안내·도움말)
- [x] [app/HelpDialog.tsx](app/HelpDialog.tsx) — 도움말 모달 (client component, useState 토글 + ESC + 본문 스크롤 잠금)
- [x] [app/GuideDialog.tsx](app/GuideDialog.tsx) — "📖 앱 안내" 모달 (앱 개요·작동 방식·사용자 가이드, client component)
- [x] [app/RefreshButton.tsx](app/RefreshButton.tsx) — 헤더 새로고침 버튼 (client) → Server Action 호출로 ISR 즉시 무효화
- [x] [app/actions.ts](app/actions.ts) — Server Action `revalidateRoot()` (`/` ISR 캐시 무효화)
- [x] [app/p/[repo]/page.tsx](app/p/%5Brepo%5D/page.tsx) — `/p/<repo>` preview 페이지 (STATUS.md 본문 마크다운 렌더 + XSS 새니타이즈)
- [x] [app/globals.css](app/globals.css) — 기본 스타일 (inline 스타일 위주, Tailwind 의존성은 제거됨)
- [x] [lib/github.ts](lib/github.ts) — GitHub API 호출 (private repo 자동 스캔, `/user/repos?affiliation=owner` 폴백 + 페이지네이션, 404만 null·그 외 오류는 전파)
- [x] [lib/parse.ts](lib/parse.ts) — STATUS.md → 카드 데이터 변환 + 신호등 계산 (`getHealth`/`daysAgo` export → preview와 공유)
- [x] [proxy.ts](proxy.ts) — 배포본 접근 제어 (Basic Auth, `DASH_PASSWORD`, timing-safe 비교)
- [x] [lib/parse.test.ts](lib/parse.test.ts) · [lib/github.test.ts](lib/github.test.ts) — vitest 단위 테스트 (총 23개 통과) + GitHub Actions CI(`npm test` + `tsc`)
- [x] [templates/STATUS.template.md](templates/STATUS.template.md) — 표준 양식

### 2-2. PWA 자산 (public/ 폴더)

- [x] [public/manifest.json](public/manifest.json) — 앱 정의 (이름·테마색 `#1D9E75`·standalone)
- [x] [public/sw.js](public/sw.js) — service worker (network-first, GitHub API는 캐시 제외)
- [x] [public/icon-192.png](public/icon-192.png), [public/icon-512.png](public/icon-512.png) — 표준 아이콘
- [x] [public/apple-touch-icon.png](public/apple-touch-icon.png) — iOS 홈 화면 아이콘

### 2-3. 인프라

- [x] GitHub 토큰 (fine-grained PAT) — "All repositories" + Contents Read-only
- [x] `.env.local` 정상 세팅 (UTF-8 BOM 없음)
- [x] Vercel 프로젝트 + 환경변수 깔끔 재구성 (3개 환경 모두 적용)
- [x] STATUS.md 표시 중인 repo: `project-dashboard` 외 실제 진행 repo 다수 시딩 완료 (TARGET_REPOS 비움 → 본인 소유 repo 자동 스캔)

### 2-4. 문서

- [x] [README.md](README.md) — Phase 0~4 따라하기 가이드
- [x] [STATUS.md](STATUS.md) — 이 repo 자체용
- [x] HANDOFF.md (← 이 문서)

### 2-5. 자기점검·개선 (2026-06-26)

> 코드 전반 자기점검 후 발견한 개선점 4건 적용. 빌드·타입검사·테스트(23개) 모두 통과.

- [x] **github.ts API 오류 처리** — 404만 `null`, 403(rate limit)·5xx는 위로 전파.
      기존엔 모든 오류를 삼켜서 일시 장애 때 프로젝트가 카드에서 **조용히 사라졌음**. 회귀 방지 테스트 2개 추가.
- [x] **sw.js 비공개 화면 캐시 제외** — `'/'`(Basic Auth 보호 + private 데이터)를 프리캐시·런타임 캐시에서 제외, `CACHE_NAME` v1→v2(옛 캐시 자동 정리).
- [x] **preview 신호등 색 통일** — `/p/[repo]` 헤더 색을 메인 카드와 같은 `getHealth`(커밋 최신성) 기준으로. `parse.ts`의 `getHealth`/`daysAgo` export.
- [x] **page.tsx strict 정합** — `catch (e: any)` → `unknown` + `Error` 좁히기.
- [ ] **(모니터링) Next.js postcss 취약점**(GHSA-qx2v-qp2m-jg93) — 안정판 패치(16.3.0+) 미출시.
      `npm audit fix --force`는 next를 9.x로 다운그레이드시키니 **금지**. 빌드 도구 한정이라 런타임 위험 낮음 → 16.3.0 출시 시 업그레이드.

---

## 3. 오늘(2026-05-24) 한 일과 학습 🧠

### 토큰 prefix 중복 사고 (긴 디버깅 끝에 발견)

- 처음에 `.env.local`의 `GITHUB_TOKEN`이 `github_pat_github_pat_...`로 prefix가 **두 번** 들어가 있었음 → 401 Unauthorized
- BOM/CRLF 의심으로 sanitize 정규식을 5번 commit하며 ASCII-printable까지 가는 과격한 방어 로직을 추가했으나 모두 헛수고
- 진짜 원인은 단순 복붙 사고. 토큰을 다시 만든 뒤 sanitize는 `.trim()`만 남겨 단순화
- **교훈**: 토큰 401일 때 sanitize 늘리기 전에 `.env` 값 자체부터 의심하기

### lib/github.ts 폴백 엔드포인트 문제

- 처음에는 `/users/{username}/repos`(public만 반환)를 폴백으로 사용 → private repo 자동 스캔 누락
- `/user/repos?affiliation=owner`로 교체 → 인증된 본인 모든 repo(private 포함) 스캔

### Vercel 환경변수 분산 문제

- 처음에는 `GITHUB_TOKEN`이 Preview/Production/Development에 **각각 따로** 등록되어 있었고, Preview에는 옛 중복 prefix + 끝에 `↵` 줄바꿈 문자까지 있었음
- 모두 삭제하고 단일 항목 (All Environments)으로 재등록 → 깔끔
- **교훈**: Vercel 환경변수는 환경별 분산 등록을 피하고 처음부터 All Environments 단일 항목으로

### PWA 작업

- `public/manifest.json` + `public/sw.js` + PNG 아이콘 3장 (PowerShell System.Drawing으로 생성)
- Next.js 16은 `apple-mobile-web-app-capable` 대신 더 현대적인 `mobile-web-app-capable`을 자동 출력 (W3C 표준)

---

## 4. 아직 안 한 것 ⏭️

> 시스템은 사실상 완성(유지보수 단계). 사용자 결정 2건도 모두 해소됨(아래). 남은 건 **모니터링 1건**(Next.js 16.3.0 출시 시 postcss 취약점 패치 업그레이드)뿐.

### ✅ 사용자 결정 완료 (2026-06-13)

- [x] **repo 공개 전환** — **public 전환 완료**. 대시보드 URL은 `DASH_PASSWORD` Basic Auth로 계속 보호됨.
- [x] **`DASH_PASSWORD` 환경 스코프** — **All Environments 유지** 결정(로컬도 게이트 적용, 동작엔 무관).

### ✅ 최근 완료 (2026-06-13)

- [x] `lib/parse.ts` 단위 테스트 추가 (vitest 도입, `npm test`)
- [x] `pc` 값을 `hostname`으로 실제 PC 이름 채우도록 세션 규칙 강화 (CLAUDE.md/README/템플릿) + efl-reading-trainer에 CLAUDE.md 전파

### 참고 — 신규 repo는 자동

각 프로젝트에 README의 세션 규칙 블록(`## 세션 규칙`)을 넣으면 매 세션 STATUS.md가 자동 관리된다. `TARGET_REPOS`를 비워둔 상태라 신규 repo도 STATUS.md만 push하면 카드가 자동 추가된다.

---

## 5. 중요한 결정 사항 🧠 (왜 이렇게 만들었는지)

| 결정 | 이유 |
|------|------|
| **서버 컴포넌트** (`"use client"` 없음) | GitHub 토큰이 브라우저에 노출되면 안 됨. 서버에서만 fetch. |
| **ISR 1시간** (`revalidate = 3600`) | GitHub API rate limit 보호 + 충분한 신선도. 즉시 갱신은 Vercel 재배포. |
| **gray-matter** 사용 | STATUS.md의 Front Matter를 안전하게 파싱하기 위해. |
| **폴백을 `/user/repos?affiliation=owner`로** | `/users/{username}/repos`는 public만 반환 → private 자동 스캔 누락. 인증된 본인 컨텍스트로 교체. |
| **`TARGET_REPOS` 비우면 전체 스캔** | 신규 repo 자동 포함. 현재는 비운 상태(자동 스캔). |
| **PWA의 service worker network-first** | GitHub API 호출은 캐시에서 제외 → 항상 최신 데이터. 정적 자산만 캐시. |
| **HelpDialog는 client component로 분리** | 모달 토글·ESC 키 핸들러가 브라우저 API 필요. 서버 컴포넌트인 page.tsx와 자연스럽게 공존. |
| **아이콘 PNG는 PowerShell System.Drawing으로 생성** | 외부 의존성 없이 즉시 생성 가능. SVG도 옵션이지만 일부 OS 호환 위해 PNG 선택. |

---

## 6. 다음 세션 시작 명령 📋

다음 작업을 시작할 때 Claude Code에 아래 중 하나를 붙여넣으세요.

### 유지보수/상태 확인 이어가기

```text
HANDOFF.md와 STATUS.md 읽고 현재 상태 요약. 남은 사용자 결정 2건
(repo 공개 / DASH_PASSWORD 스코프) 중 정할 게 있으면 진행해줘.
```

### 신규 PC에서 처음 시작 (권장 — Vercel이 env의 Single Source of Truth)

```bash
git clone https://github.com/smilepat/project-dashboard.git
cd project-dashboard
npm run setup    # vercel link + vercel env pull(.env.local) + npm install
npm run dev      # http://localhost:3000
```

- `npm run setup`은 처음에 **`vercel login`/프로젝트 선택**을 물어본다(브라우저 인증).
  연결 후 Vercel에 등록된 환경변수를 `.env.local`로 자동 내려받으므로 **토큰을 손으로 복붙할 필요 없다**.
- env를 바꾸면(예: 토큰 교체) Vercel 대시보드에서 수정 → `vercel env pull .env.local`로 재동기화.
- **`DASH_PASSWORD`**: 로컬 dev는 비어 있어도 됨(인증 게이트 비활성). 아래 "주의" 참고.

> 🔁 **이미 옛 클론이 있는 PC라면**: 2026-06-01에 git 히스토리를 재작성(force push)했으므로
> `git pull`이 충돌난다. 폴더를 지우고 다시 clone하거나
> `git fetch origin && git reset --hard origin/master` 한 번만 실행하면 이후 정상.

#### 수동 셋업(Vercel CLI 없이)이 필요할 때

```bash
git clone https://github.com/smilepat/project-dashboard.git
cd project-dashboard
npm install
cp .env.local.example .env.local   # GITHUB_USERNAME/GITHUB_TOKEN 직접 채우기, DASH_PASSWORD는 비워도 됨
npm run dev
```

> ⚠️ **DASH_PASSWORD 환경 스코프**: 로컬 dev가 매번 Basic Auth를 묻지 않게 하려면
> Vercel에서 `DASH_PASSWORD`를 **Production·Preview에만** 두고 **Development는 비활성**으로 둔다.
> 그러면 `vercel env pull`이 가져오는 .env.local의 DASH_PASSWORD가 비어 로컬은 게이트 없이 뜨고,
> 배포본(Production/Preview)만 잠긴다. (현재 All Environments로 두면 로컬도 잠기지만 동작엔 문제 없음.)

---

## 7. 알아두면 좋은 함정들 ⚠️

- **pull/reset 직후 테스트·빌드가 깨짐** (`vitest`/`sanitize-html` 못 찾음 등) → 다른 PC에서 받은 `node_modules`가 옛 `package.json` 기준이라 새 의존성이 빠진 것. **pull·reset 받으면 `npm install` 먼저** 실행. (2026-06-26 실제 발생)
- **카드가 안 보임** → 해당 repo에 `STATUS.md`가 푸시되었는지 확인. 토큰의 Repository access가 그 repo를 포함하는지 확인. (참고: 이제 403/5xx 같은 일시적 API 오류는 카드를 숨기지 않고 상단 에러 배너로 표시됨.)
- **GitHub API 401/403** → 토큰 prefix 중복(`github_pat_github_pat_...`) 또는 권한 부족. `.env.local`의 값 자체를 먼저 의심.
- **모두 빨강(방치)로 표시** → 마지막 커밋이 7일 넘은 것. push 하면 색 살아남.
- **진행률 0%** → Front Matter `progress:` 숫자가 없고 체크리스트도 없을 때. 둘 중 하나는 있어야 함.
- **ISR 캐시 때문에 변경이 즉시 안 보임** → 최대 1시간 대기 또는 Vercel에서 재배포.
- **Vercel 환경변수가 환경별로 분산되어 등록** → "All Environments" 단일 항목으로 재등록 권장.
- **PowerShell로 Vercel CLI를 통해 환경변수 set 시 BOM/CRLF가 끼어듦** → Vercel 웹 UI에 직접 붙여넣기 권장.

---

## 8. 파일 구조 한눈에 보기 📁

```text
project-dashboard/
├─ app/
│  ├─ layout.tsx        ✅ PWA 메타 + SW 등록
│  ├─ page.tsx          ✅ 대시보드 메인 + 헤더 액션(새로고침·앱안내·도움말)
│  ├─ HelpDialog.tsx    ✅ 도움말 버튼 + 모달 (client)
│  ├─ GuideDialog.tsx   ✅ "📖 앱 안내" 모달 (client)
│  ├─ RefreshButton.tsx ✅ 새로고침 버튼 (client) → Server Action
│  ├─ actions.ts        ✅ Server Action (revalidateRoot)
│  ├─ p/[repo]/page.tsx ✅ STATUS.md 본문 preview (마크다운 + XSS 새니타이즈)
│  └─ globals.css       ✅
├─ lib/
│  ├─ github.ts         ✅ /user/repos 폴백+페이지네이션, 404만 null·그외 전파
│  ├─ github.test.ts    ✅ vitest (8개)
│  ├─ parse.ts          ✅ getHealth/daysAgo export
│  └─ parse.test.ts     ✅ vitest (15개)
├─ proxy.ts             ✅ 배포본 Basic Auth 게이트 (DASH_PASSWORD)
├─ vitest.config.ts     ✅
├─ public/              ✅ PWA 자산 (manifest + sw + 아이콘 3장)
│  ├─ manifest.json
│  ├─ sw.js             ✅ '/' 비공개 화면은 캐시 제외 (v2)
│  ├─ icon-192.png
│  ├─ icon-512.png
│  └─ apple-touch-icon.png
├─ templates/
│  └─ STATUS.template.md
├─ .github/workflows/   ✅ CI (npm test + tsc)
├─ docs/                ⚪ 비어있음
├─ .env.local.example   ✅
├─ .env.local           ✅ 새 토큰 + TARGET_REPOS 비움(자동 스캔)
├─ package.json         ✅
├─ README.md            ✅ (Phase 0~4 가이드, 일부 옛 내용 있음)
├─ STATUS.md            ✅ (대시보드 카드용)
└─ HANDOFF.md           ← 이 문서
```

---

## 9. 한 줄 요약 🎯

> 대시보드는 production 작동 중 + PWA 설치 가능 + 단위 테스트 23개·CI 완비 + Basic Auth 게이트. 사용자 결정 2건도 모두 해소(repo public 전환 / DASH_PASSWORD All Environments). 코드 작업은 사실상 종료(유지보수 단계). 2026-06-26 자기점검으로 API 오류 처리·SW 캐시·preview 색·strict 정합 4건 개선. 남은 건 모니터링 1건(Next.js 16.3.0 출시 시 postcss 취약점 패치 업그레이드)뿐.
