---
project: project-dashboard
status: active
progress: 55
updated: 2026-05-23
pc: home-desktop
---

# 🤝 Handoff Document — Project Dashboard

> 다음 세션(또는 다른 PC)에서 이 문서를 먼저 읽고 이어서 작업하세요.
> 작성일: **2026-05-23**

---

## 1. 이 프로젝트가 뭐예요?

여러 PC에서 굴러가는 여러 프로젝트(Project A, repo-b, repo-c, repo-d 등)의 진행 상황을 한 화면에 모아 보여주는 **개인용 대시보드 웹앱**.

작동 원리:
1. 각 프로젝트 repo 루트에 `STATUS.md` 파일을 둔다.
2. 이 대시보드가 GitHub API로 모든 repo의 `STATUS.md`와 마지막 커밋 날짜를 가져온다.
3. Front Matter(YAML 머리말 — `---` 블록)와 본문을 파싱(parse, 글자 → 구조)해서 카드 형태로 그린다.
4. 신호등(초록/노랑/빨강)으로 어느 프로젝트가 방치되고 있는지 한눈에 보여준다.

---

## 2. 지금까지 완료된 것 ✅

### 코드 (전부 작동 가능 상태)
- [x] [app/layout.tsx](app/layout.tsx) — 최상위 레이아웃 (한국어 lang, 폰트, 배경색)
- [x] [app/page.tsx](app/page.tsx) — 대시보드 메인 화면 (서버 컴포넌트, ISR 1시간)
- [x] [app/globals.css](app/globals.css) — Tailwind + 기본 스타일
- [x] [lib/github.ts](lib/github.ts) — GitHub API 호출 (STATUS.md + 마지막 커밋 수집)
- [x] [lib/parse.ts](lib/parse.ts) — STATUS.md → 카드 데이터 변환 + 신호등 계산
- [x] [templates/STATUS.template.md](templates/STATUS.template.md) — 각 프로젝트에 복사해 쓸 표준 양식

### 설정 파일
- [x] [package.json](package.json) — Next 14.2.5 / React 18.3 / gray-matter
- [x] [tsconfig.json](tsconfig.json) — TypeScript strict 모드
- [x] [tailwind.config.ts](tailwind.config.ts), [postcss.config.js](postcss.config.js)
- [x] [next.config.mjs](next.config.mjs)
- [x] [.env.local.example](.env.local.example) — 환경변수 양식
- [x] [.gitignore](.gitignore)

### 문서
- [x] [README.md](README.md) — Phase 0~4 따라하기 가이드 (사용자님이 직접 읽고 실행 가능)

---

## 3. 아직 안 한 것 ⏭️ (우선순위 순)

### 🔴 우선순위 1 — 로컬에서 돌려보기 (가장 먼저!)
이 4개를 차례대로 해야 화면을 볼 수 있어요.

- [ ] **(1)** `npm install` — 라이브러리 설치 (현재 `node_modules` 폴더 없음)
- [ ] **(2)** GitHub 토큰 발급 — https://github.com/settings/tokens?type=beta
  - Repository access: 대시보드에 띄울 repo들만 선택
  - Permissions → Repository → **Contents: Read-only** 만 체크
- [ ] **(3)** `.env.local` 파일 만들기 (현재 없음)
  ```bash
  cp .env.local.example .env.local
  ```
  그리고 안에 `GITHUB_USERNAME`, `GITHUB_TOKEN`, `TARGET_REPOS` 채우기
- [ ] **(4)** `npm run dev` 실행 → http://localhost:3000 에서 카드 확인

### 🟡 우선순위 2 — 각 프로젝트에 STATUS.md 배포 (Phase 0)
대시보드가 잘 떠도, 각 repo에 `STATUS.md`가 없으면 카드가 안 나옵니다.

- [ ] `templates/STATUS.template.md` 복사 → 각 프로젝트 루트에 `STATUS.md`로 저장
- [ ] 대상 repo 4개 (`.env.local`의 `TARGET_REPOS` 기본값 기준):
  - [ ] `repo-a`
  - [ ] `repo-b`
  - [ ] `repo-c`
  - [ ] `repo-d`
- [ ] 각 repo에서 커밋 & 푸시:
  ```bash
  git add STATUS.md
  git commit -m "add STATUS.md"
  git push
  ```

### 🟢 우선순위 3 — Vercel 배포 (Phase 3)
폰·태블릿·다른 PC에서도 보려면 필요.

- [ ] 이 폴더를 GitHub repo로 push (`project-dashboard` 이름 추천)
- [ ] https://vercel.com → "Add New Project" → 그 repo 선택
- [ ] **Environment Variables**에 `GITHUB_USERNAME`, `GITHUB_TOKEN`, `TARGET_REPOS` 3개 등록
  - production / preview / development 환경 **모두**에 등록 (CLAUDE.md 체크리스트 규칙)
- [ ] Deploy → `프로젝트이름.vercel.app` 주소를 즐겨찾기

### 🔵 우선순위 4 — Claude Code 세션 연동 (Phase 4)
각 프로젝트의 `CLAUDE.md`에 STATUS.md 자동 관리 블록 넣기.

- [ ] 4개 repo 각각의 `CLAUDE.md`에 README의 "Phase 4" 블록 복사

---

## 4. 중요한 결정 사항 🧠

이 세션에서 내린 기술적 결정들 (왜 이렇게 만들었는지):

| 결정 | 이유 |
|------|------|
| **서버 컴포넌트** (`"use client"` 없음) | GitHub 토큰이 브라우저에 노출되면 안 됨. 서버에서만 fetch. |
| **ISR 1시간** (`revalidate = 3600`) | GitHub API rate limit 보호 + 충분한 신선도. 즉시 갱신은 Vercel 재배포. |
| **gray-matter** 사용 | STATUS.md의 Front Matter(YAML 머리말)를 안전하게 파싱하기 위해. |
| **STATUS.md가 없는 repo는 자동 제외** | `lib/github.ts`의 `getStatusFile`이 null 반환 → `fetchAllProjects`에서 필터링. |
| **신호등 규칙** (`lib/parse.ts:getHealth`) | done=초록, paused=노랑, 3일이내=초록, 7일이내=노랑, 그 이상=빨강 |
| **`TARGET_REPOS` 비우면 전체 스캔** | 신규 repo 자동 포함. 단 API 호출 늘어남 → 명시 권장. |
| **progress 자동 계산** | Front Matter에 `progress:` 숫자가 없으면 체크리스트 완료 비율로 계산 (`lib/parse.ts:86-91`). |

---

## 5. 다음 세션 시작 명령 📋

다음에 작업 시작할 때 Claude Code에 이대로 붙여넣기:

```
HANDOFF.md 읽고 현재 상황 요약해줘.
"아직 안 한 것" 우선순위 1번부터 이어서 하자.
먼저 npm install부터 진행하면 돼.
```

---

## 6. 알아두면 좋은 함정들 ⚠️

세션 중 마주칠 가능성이 있는 문제:

- **카드가 안 보임** → 해당 repo에 `STATUS.md`가 푸시되었는지, `TARGET_REPOS`의 이름이 repo 이름과 **정확히** 일치하는지 확인.
- **GitHub API 401/403** → 토큰 만료 또는 권한 부족. `Contents: Read-only` 다시 확인.
- **모두 빨강(방치)으로 표시** → 마지막 커밋이 7일 넘은 것. push 하면 색 살아남.
- **진행률 0%** → Front Matter `progress:` 숫자가 없고 체크리스트도 없으면 0. 둘 중 하나는 있어야 함.
- **ISR 캐시 때문에 변경이 즉시 안 보임** → 최대 1시간 대기 또는 Vercel에서 재배포.

---

## 7. 파일 구조 한눈에 보기 📁

```
project-dashboard/
├─ app/
│  ├─ layout.tsx        ✅ 완료
│  ├─ page.tsx          ✅ 완료 (대시보드 메인)
│  └─ globals.css       ✅ 완료
├─ lib/
│  ├─ github.ts         ✅ 완료 (GitHub API)
│  └─ parse.ts          ✅ 완료 (STATUS.md 파서)
├─ templates/
│  └─ STATUS.template.md ✅ 완료
├─ docs/                ⚪ 비어있음 (예: 예시 STATUS 파일 보관용)
├─ .env.local.example   ✅ 완료
├─ .env.local           ❌ 아직 생성 안 됨 ← 다음 작업
├─ node_modules/        ❌ 아직 설치 안 됨 ← 다음 작업
├─ package.json         ✅ 완료
├─ README.md            ✅ 완료
└─ HANDOFF.md           ← 이 문서
```

---

## 8. 한 줄 요약 🎯

**"코드는 다 짰고, 이제 `npm install` → 토큰 발급 → `.env.local` 작성 → `npm run dev` 4단계만 하면 화면이 뜬다."**
