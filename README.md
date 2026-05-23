# 프로젝트 대시보드 — 따라하기 가이드

여러 PC에서 진행하는 여러 프로젝트의 진행 상황을, 각 프로젝트의 `STATUS.md`를
모아 웹 대시보드로 보여줍니다.

---

## 🟢 Phase 0 — 각 프로젝트에 STATUS.md 넣기 (먼저!)

대시보드를 만들기 전에, **각 프로젝트 폴더 루트**에 `STATUS.md`를 둡니다.

1. `templates/STATUS.template.md`를 복사 → 각 프로젝트 루트에 `STATUS.md`로 저장
2. 내용 채우기 (사용자님 예시는 `templates/예시_*.md` 참고)
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

### 1. 라이브러리 설치
```bash
npm install
```

### 2. GitHub 토큰 발급
- https://github.com/settings/tokens?type=beta 접속
- "Generate new token" → 이름 아무거나
- Repository access: 대시보드에 띄울 repo들 선택
- Permissions → Repository → **Contents: Read-only** 만 켜기
- 생성된 토큰(`github_pat_...`) 복사

### 3. 환경변수 설정
`.env.local.example`을 복사해 `.env.local`을 만들고 값 채우기:
```bash
cp .env.local.example .env.local
```
```
GITHUB_USERNAME=본인_깃허브_아이디
GITHUB_TOKEN=복사한_토큰
TARGET_REPOS=repo-a,repo-b,repo-c,repo-d
```
> `TARGET_REPOS`를 비우면 내 모든 repo를 자동으로 훑습니다.

### 4. 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000` 접속 → 카드들이 보이면 성공!

---

## 🚀 Phase 3 — Vercel 배포 (어디서든 접속)

1. 이 폴더를 GitHub repo로 push (`project-dashboard`)
2. https://vercel.com → "Add New Project" → 그 repo 선택
3. **Environment Variables**에 `.env.local`의 3개 값 그대로 등록
   (`GITHUB_USERNAME`, `GITHUB_TOKEN`, `TARGET_REPOS`)
4. Deploy 클릭 → `프로젝트이름.vercel.app` 주소 발급
5. 폰·태블릿·다른 PC에서 접속 테스트 → 즐겨찾기 등록

> 1시간마다 자동 새로고침(ISR)됩니다. 즉시 갱신하려면 Vercel에서 재배포.

---

## 🔁 Phase 4 — Claude Code 세션 연동

각 프로젝트의 `CLAUDE.md`에 아래 블록을 추가하세요.
그러면 Claude Code가 매 세션 STATUS.md를 자동으로 챙깁니다.

```markdown
## 세션 규칙 (STATUS.md 관리)
- 세션을 시작하면 항상 STATUS.md를 먼저 읽고 현재 진행 상황을 파악한다.
- 작업을 마치면 STATUS.md를 갱신한다:
  - Front Matter의 progress(0~100), updated(오늘 날짜), pc(현재 PC) 수정
  - 완료한 체크리스트 항목을 [x]로 변경
  - "다음에 할 일" 목록 갱신
- STATUS.md의 Front Matter 형식(--- 블록)은 절대 깨뜨리지 않는다.
- 갱신 후 git add STATUS.md && git commit && git push 명령어를 안내한다.
```

### 매일 쓰는 두 마디

**작업 시작 (먼저 `git pull` 하고):**
```
STATUS.md 읽고 현재 상황 요약해줘. "다음에 할 일" 1번부터 이어서 하자.
```

**작업 종료:**
```
오늘 한 작업 기준으로 STATUS.md 업데이트하고 git push 명령어 알려줘.
```

---

## 📁 폴더 구조
```
project-dashboard/
├─ app/
│  ├─ page.tsx       # 대시보드 화면 (카드 그리드)
│  ├─ layout.tsx     # 페이지 골격
│  └─ globals.css    # 기본 스타일
├─ lib/
│  ├─ github.ts      # GitHub API로 STATUS.md·커밋 수집
│  └─ parse.ts       # STATUS.md → 화면용 데이터 가공
├─ templates/
│  ├─ STATUS.template.md   # 복사용 표준 템플릿
│  └─ 예시_*.md            # 사용자님 프로젝트 예시 4종
├─ .env.local.example
└─ package.json
```

---

## ❓ 자주 막히는 곳

- **카드가 안 보여요** → 해당 repo에 STATUS.md가 있는지, TARGET_REPOS 이름이 정확한지 확인.
- **GitHub API 오류 401/403** → 토큰 만료 또는 권한 부족. Contents: Read-only 확인.
- **진행률이 0%** → Front Matter에 `progress:` 숫자가 있는지 확인. 없으면 체크리스트 비율로 자동 계산됨.
- **방치(빨강)로만 떠요** → 커밋을 안 한 지 7일 넘은 것. push하면 색이 살아납니다.
