# 프로젝트 대시보드 — 따라하기 가이드

[![CI](https://github.com/smilepat/project-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/smilepat/project-dashboard/actions/workflows/ci.yml)

여러 PC에서 진행하는 여러 프로젝트의 진행 상황을, 각 프로젝트의 `STATUS.md`를
모아 웹 대시보드로 보여줍니다.

**현재 운영 중인 배포**: <https://project-dashboard-drab.vercel.app> (PWA 설치 가능)

---

## 🟢 Phase 0 — 각 프로젝트에 STATUS.md 넣기 (먼저!)

대시보드를 만들기 전에, **각 프로젝트 폴더 루트**에 `STATUS.md`를 둡니다.

1. `templates/STATUS.template.md`를 복사 → 각 프로젝트 루트에 `STATUS.md`로 저장
2. 내용 채우기 (사용자님 예시는 이 repo의 `STATUS.md` 참고)
3. 커밋 & 푸시:

   ```bash
   git add STATUS.md
   git commit -m "add STATUS.md"
   git push
   ```

> ⭐ 가장 중요한 3줄: Front Matter의 `progress`, `status`, `updated`.
> 이 세 줄만 정확하면 대시보드 기본 화면이 완성됩니다.

---

## 🔧 Phase 1~2 — 대시보드 로컬 실행

> **다른 PC에서 이어서 작업한다면 이 한 줄이면 끝:**
> ```bash
> git clone https://github.com/smilepat/project-dashboard.git && cd project-dashboard
> npm run setup    # vercel link + env pull(.env.local) + npm install
> npm run dev
> ```
> `npm run setup`이 Vercel 인증·연결 후 환경변수를 자동으로 내려받는다(토큰 복붙 불필요).
> 아래 2~3번은 Vercel CLI 없이 **수동으로** 셋업할 때만 필요하다.

### 1. 라이브러리 설치

```bash
npm install
```

### 2. GitHub 토큰 발급

- <https://github.com/settings/tokens?type=beta> 접속
- "Generate new token" → 이름 아무거나
- Repository access: 대시보드에 띄울 repo들 선택 (또는 "All repositories"로 두면 신규 repo 자동 포함)
- Permissions → Repository → **Contents: Read-only** 만 켜기
- 생성된 토큰(`github_pat_...`) 복사

> ⚠️ 토큰을 복사할 때 prefix(`github_pat_`)가 **두 번** 들어가지 않도록 주의.
> 과거에 `github_pat_github_pat_...` 사고가 있었고, 그 결과 401이 떨어졌습니다.

### 3. 환경변수 설정

`.env.local.example`을 복사해 `.env.local`을 만들고 값 채우기:

```bash
cp .env.local.example .env.local
```

```text
GITHUB_USERNAME=본인_깃허브_아이디
GITHUB_TOKEN=복사한_토큰
TARGET_REPOS=repo-a,repo-b,repo-c,repo-d
DASH_PASSWORD=                      # 로컬은 비워도 됨. 배포 시 반드시 설정.
```

> `TARGET_REPOS`를 비우면 토큰으로 볼 수 있는 본인 소유 repo(private 포함)를 자동으로 훑습니다.
>
> ⚠️ **`DASH_PASSWORD`**: 이 대시보드는 private repo의 STATUS 내용을 화면에 노출합니다.
> 로컬 개발에선 비워도 되지만, **배포 시에는 반드시 설정**하세요. 설정하면 사이트 접근 시
> `admin` / 이 비밀번호로 Basic Auth가 걸립니다. 비워서 배포하면 URL을 아는 누구나 봅니다.

### 4. 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 → 카드들이 보이면 성공!

---

## 🚀 Phase 3 — Vercel 배포 (어디서든 접속)

1. 이 폴더를 GitHub repo로 push (`project-dashboard`)
2. <https://vercel.com> → "Add New Project" → 그 repo 선택
3. **Environment Variables**에 `.env.local`의 값들을 그대로 등록
   (`GITHUB_USERNAME`, `GITHUB_TOKEN`, `TARGET_REPOS`, `DASH_PASSWORD`)
   - ⚠️ 처음부터 **All Environments** 단일 항목으로 등록할 것. 환경별 분산 등록은 사고가 잘 남.
   - 🔒 **`DASH_PASSWORD`를 반드시 등록**할 것. 누락하면 대시보드가 인증 없이 공개되어
     private repo 내용이 노출됩니다.
4. Deploy 클릭 → `프로젝트이름.vercel.app` 주소 발급
5. 폰·태블릿·다른 PC에서 접속 테스트 → 즐겨찾기 등록

> 1시간마다 자동 새로고침(ISR)됩니다. 즉시 갱신하려면 **헤더 우측 "🔄 새로고침" 버튼**을 누르세요.
> (서버 액션으로 ISR 캐시를 즉시 무효화 → Vercel 재배포 없이도 카드가 갱신됩니다.)

---

## 📲 Phase 4 — PWA 설치 (앱처럼 쓰기)

배포된 사이트를 폰·PC에 앱처럼 설치할 수 있습니다.

- **PC Chrome/Edge**: 주소창 우측의 "설치" 아이콘 클릭
- **Android Chrome**: 메뉴 → "홈 화면에 추가"
- **iOS Safari**: 공유 → "홈 화면에 추가"

설치하면 풀스크린 앱처럼 동작하고, 정적 자산은 캐시되어 빠르게 열립니다.
(단, GitHub API 호출은 캐시 제외 — 항상 최신 데이터를 가져옴.)

---

## 🔁 Phase 5 — Claude Code 세션 연동

각 프로젝트의 `CLAUDE.md`에 아래 블록을 추가하세요.
그러면 Claude Code가 매 세션 STATUS.md를 자동으로 챙깁니다.

```markdown
## 세션 규칙 (STATUS.md 관리)
- 세션을 시작하면 항상 STATUS.md를 먼저 읽고 현재 진행 상황을 파악한다.
- 작업을 마치면 STATUS.md를 갱신한다:
  - Front Matter의 progress(0~100), updated(오늘 날짜), pc(현재 PC) 수정
  - 완료한 체크리스트 항목을 [x]로 변경
  - "다음에 할 일" 목록 갱신
- pc 값은 추측하거나 템플릿 예시값(home-desktop 등)을 그대로 두지 않는다.
  반드시 이 PC의 실제 이름을 명령으로 확인해 채운다:
  Windows는 `hostname`(또는 `$env:COMPUTERNAME`), macOS/Linux는 `hostname`.
  사용자가 정해둔 별칭이 있으면 그 별칭을 우선한다.
- STATUS.md의 Front Matter 형식(--- 블록)은 절대 깨뜨리지 않는다.
- 갱신 후 git add STATUS.md && git commit && git push 명령어를 안내한다.
```

### 매일 쓰는 두 마디

**작업 시작 (먼저 `git pull` 하고):**

```text
STATUS.md 읽고 현재 상황 요약해줘. "다음에 할 일" 1번부터 이어서 하자.
```

**작업 종료:**

```text
오늘 한 작업 기준으로 STATUS.md 업데이트하고 git push 명령어 알려줘.
```

---

## 💡 알아두면 좋은 기능들

### 헤더 우측 두 버튼

- **🔄 새로고침**: 1시간 ISR 캐시를 즉시 무효화하고 GitHub에서 최신 데이터 재수집
- **❓ 도움말**: STATUS.md 작성 안내·신호등 의미 등을 모달로 표시

### 카드별 본문 보기 (`/p/<repo-name>`)

각 카드 하단의 **"📄 본문 보기"** 링크를 누르면, GitHub에 가지 않고도
대시보드 안에서 해당 STATUS.md 본문(체크리스트·다음 할 일·결정 대기 등)을
마크다운으로 바로 볼 수 있습니다.

### 신호등 색 의미

- 🟢 **활발**: 마지막 커밋 3일 이내 / `status: done`
- 🟡 **주의**: 4~7일 / `status: paused` / 커밋 기록 없음
- 🔴 **방치**: 7일 초과 — push 하면 색이 살아납니다

---

## 🧪 테스트 / CI

핵심 파싱 로직(`lib/parse.ts` — progress 산출·신호등·Front Matter/섹션 파싱)은
단위 테스트로 보호됩니다.

```bash
npm test          # vitest 단위 테스트 실행
npx tsc --noEmit  # 타입 검사 (npm run build도 함께 수행)
```

push·PR마다 GitHub Actions([.github/workflows/ci.yml](.github/workflows/ci.yml))가
`npm test`와 타입 검사를 자동 실행합니다. 상단 CI 배지로 상태를 확인할 수 있습니다.

---

## 📁 폴더 구조

```text
project-dashboard/
├─ app/
│  ├─ page.tsx           # 대시보드 메인 (서버 컴포넌트, ISR 1시간)
│  ├─ layout.tsx         # PWA 메타 + service worker 등록
│  ├─ globals.css        # 기본 스타일
│  ├─ HelpDialog.tsx     # 도움말 버튼/모달 (client)
│  ├─ RefreshButton.tsx  # 새로고침 버튼 (client + Server Action)
│  ├─ actions.ts         # Server Action (revalidatePath)
│  └─ p/[repo]/page.tsx  # 카드 본문 보기 (preview)
├─ lib/
│  ├─ github.ts          # GitHub API로 STATUS.md·커밋 수집 (private 자동 스캔)
│  └─ parse.ts           # STATUS.md → 화면용 데이터 가공 + 신호등 계산
├─ public/               # PWA 자산
│  ├─ manifest.json      # 앱 정의 (이름·테마색·standalone)
│  ├─ sw.js              # service worker (network-first, GitHub API는 캐시 제외)
│  ├─ icon-192.png
│  ├─ icon-512.png
│  └─ apple-touch-icon.png
├─ templates/
│  └─ STATUS.template.md # 복사용 표준 템플릿
├─ .env.local.example
├─ package.json
├─ STATUS.md             # 이 repo 자체의 카드 데이터
└─ HANDOFF.md            # 장기 인수인계 문서
```

---

## ❓ 자주 막히는 곳

- **카드가 안 보여요** → 해당 repo에 STATUS.md가 푸시되었는지, 토큰의 Repository access가 그 repo를 포함하는지 확인.
- **GitHub API 오류 401/403** → 가장 흔한 원인은 토큰 prefix 중복(`github_pat_github_pat_...`). `.env.local`의 값을 먼저 의심. 그 다음 권한 부족(Contents: Read-only).
- **진행률이 0%** → Front Matter에 `progress:` 숫자가 있는지 확인. 없으면 체크리스트(`- [x]`) 비율로 자동 계산됨.
- **모두 빨강(방치)로만 떠요** → 마지막 커밋이 7일 넘은 것. push하면 색이 살아납니다.
- **변경이 즉시 안 보여요** → ISR 캐시(최대 1시간). 헤더 우측 "🔄 새로고침"을 누르면 즉시 갱신.
- **Vercel 환경변수가 환경별로 분산** → 모두 지우고 "All Environments" 단일 항목으로 재등록 권장.
- **PowerShell로 Vercel CLI 환경변수 set 시 BOM/CRLF가 끼어듦** → Vercel 웹 UI에 직접 붙여넣기 권장.
