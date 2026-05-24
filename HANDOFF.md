---
project: project-dashboard
status: active
progress: 95
updated: 2026-05-24
pc: home-desktop
---

# 🤝 Handoff Document — Project Dashboard

> 다음 세션(또는 다른 PC)에서 이 문서를 먼저 읽고 이어서 작업하세요.
> 최종 갱신: **2026-05-24**

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
- [x] [app/page.tsx](app/page.tsx) — 대시보드 메인 (서버 컴포넌트, ISR 1시간) + 헤더 우측 도움말 버튼
- [x] [app/HelpDialog.tsx](app/HelpDialog.tsx) — 도움말 모달 (client component, useState 토글 + ESC + 본문 스크롤 잠금)
- [x] [app/globals.css](app/globals.css) — Tailwind + 기본 스타일
- [x] [lib/github.ts](lib/github.ts) — GitHub API 호출 (private repo 자동 스캔, `/user/repos?affiliation=owner` 폴백)
- [x] [lib/parse.ts](lib/parse.ts) — STATUS.md → 카드 데이터 변환 + 신호등 계산
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
- [x] STATUS.md 표시 중인 repo: `project-dashboard`, `repo-e` (2장)

### 2-4. 문서

- [x] [README.md](README.md) — Phase 0~4 따라하기 가이드
- [x] [STATUS.md](STATUS.md) — 이 repo 자체용
- [x] HANDOFF.md (← 이 문서)

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

### 🟡 우선순위 1 — 다른 repo의 STATUS.md 배포

대시보드는 잘 뜨지만 카드가 아직 2장. 더 많은 repo에 STATUS.md를 두면 카드가 늘어남.

- [ ] `repo-a`에 STATUS.md 작성·push (사용자에게 진행 상황 물어본 뒤)
- [ ] `repo-c`에 STATUS.md 작성·push (사용자에게 진행 상황 물어본 뒤)
- [ ] (선택) `repo-d`, `repo-b` 등이 실제 존재하면 STATUS.md 추가

### 🟢 우선순위 2 — 다른 repo의 CLAUDE.md 자동 갱신 블록

각 프로젝트의 `CLAUDE.md`에 README의 "Phase 4" 블록을 넣어 매 세션 STATUS.md를 자동 관리하도록.

### 🔵 우선순위 3 — 미세 개선

- [ ] README.md를 PWA·도움말 버튼 반영해 갱신
- [ ] 이 repo의 STATUS.md `progress: 80`을 현재 상황 반영해 갱신

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

### 다른 repo STATUS.md 배포 이어가기

```text
HANDOFF.md 읽고 우선순위 1번부터 진행. repo-a와 repo-c의
진행 상황을 짧게 물어본 뒤 STATUS.md 두 개 작성하고 push 안내해줘.
```

### repo-e Turso 마이그레이션 (E: 드라이브 준비 후)

```text
repo-e Turso 마이그레이션 재개. E: 드라이브
연결됐어. STATUS.md의 '재개 메모' 섹션 읽고 1번(vocab_reference 시드
상태 확인)부터 진행해줘.
```

### 신규 PC에서 처음 시작

```bash
git clone https://github.com/smilepat/project-dashboard.git
cd project-dashboard
npm install
cp .env.local.example .env.local   # 토큰 채우기
npm run dev
```

---

## 7. 알아두면 좋은 함정들 ⚠️

- **카드가 안 보임** → 해당 repo에 `STATUS.md`가 푸시되었는지 확인. 토큰의 Repository access가 그 repo를 포함하는지 확인.
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
│  ├─ page.tsx          ✅ 대시보드 메인 + HelpDialog 배치
│  ├─ HelpDialog.tsx    ✅ 도움말 버튼 + 모달 (client)
│  └─ globals.css       ✅
├─ lib/
│  ├─ github.ts         ✅ /user/repos 폴백 + sanitize 단순화
│  └─ parse.ts          ✅
├─ public/              ✅ PWA 자산 (manifest + sw + 아이콘 3장)
│  ├─ manifest.json
│  ├─ sw.js
│  ├─ icon-192.png
│  ├─ icon-512.png
│  └─ apple-touch-icon.png
├─ templates/
│  └─ STATUS.template.md
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

> 대시보드는 production 작동 중 + PWA 설치 가능. 남은 일은 다른 repo의 STATUS.md 배포와 repo-e의 Turso 마이그레이션(E: 드라이브 대기 중).
