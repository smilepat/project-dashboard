---
project: project-dashboard
status: active
progress: 99
updated: 2026-08-05
pc: DESKTOP-JDF6C5D
---

# project-dashboard — STATUS

## 🎯 한 줄 상태

대시보드 production 작동 + PWA + 보안 완료. 2026-07-21 에 자동 스캔을 복구해 카드가 9→67장이 됐고(현재 76장), 2026-08-03 에는 반대로 **카드를 19장으로 좁히는 digest 연동**을 붙였다. 코드·테스트(31개) 완료, **`vercel login` 대기로 아직 OFF**.

## 🆕 2026-08-03 digest 연동 (코드 완료 · 기본 OFF)

카드가 76장이면 대부분이 상시 빨강이라 경고가 배경이 된다. `repo-ops-system` 의
`registry/digest.json` 모멘텀 판정(`active` = 7일 내 push)으로 대상을 좁혀 **19장**으로.

- [x] `lib/github.ts` — 우선순위 `TARGET_REPOS` → (`USE_DIGEST_TARGETS=1`) digest → 전체 스캔.
      digest 실패·대상 0건이면 **전체 스캔 폴백**(대시보드가 통째로 비면 안 됨)
- [x] `DIGEST_BUCKETS` 로 구간 확장 가능(기본 `active`). 유효값 0개면 `active` 로 되돌림
- [x] 테스트 8개 추가 → **총 31개 통과**, tsc 통과
- [ ] **`vercel login` → `USE_DIGEST_TARGETS=1` 등록 → 재배포** ← 남은 유일한 단계

**구간별 실측(2026-08-03):** 전체 76장 / `active` **19장** / +cooling 59 / +stale 65.
cooling 43건 중 40건이 STATUS.md 를 갖고 있어 cooling 을 넣으면 축소 효과가 사라진다.

> ⚠️ **하마터면 잘못 켤 뻔한 건**: 처음 계산했을 때 digest 는 "18장"이라 했는데, 그건
> CI 스캔 토큰이 209개 중 48개(public만)만 보던 탓에 나온 착시였다. 그대로 켰다면
> 이틀 전 푸시한 `instant-english`·`EBS-demo` 가 사라졌을 것이다.
> 토큰을 고친 뒤(Contents/Issues/Pull requests = Read-only) 재측정한 값이 위의 19장이다.

## 🆕 2026-07-21 "새 앱 자동 추적" 작업 (완료)

- [x] **원인 규명**: 카드가 9개로 고정된 원인 = Vercel `TARGET_REPOS` 환경변수(Development 22개 고정 목록) + `vercel redeploy`의 낡은 빌드 재사용. 코드·토큰·데이터는 정상이었음
- [x] `TARGET_REPOS` 제거 (Development·Production 양쪽) → 소유 repo 전체 자동 스캔 복구
- [x] 활성 repo에 STATUS.md 일괄 생성 (GitHub Contents API, 초기 31장 + 스윕 백로그 10장)
- [x] **주간 자동 스윕** 구축: `scripts/sweep-status.py`(최근 push·archived/fork 제외·deny 패턴·기존 파일 미덮어쓰기) + `.github/workflows/status-sweep.yml`(매주 월 09:00 KST, workflow_dispatch dry-run)
- [x] Actions용 `REPO_SWEEP_TOKEN`(repo 스코프 PAT) 등록 → 비공개 199개 전부 스캔 검증(생성 10/건너뜀 189)
- [x] 노이즈 정리: `dev-workflow`·`lumina-bridge-english-level1` STATUS.md 삭제 + DENY_PATTERNS에 추가
- [x] **교훈**: 반영은 `vercel redeploy`(낡은 빌드 재사용) 금지 → **master push로 fresh 빌드**. 최종 카드 67장 실측 확인

### 후속 개선 (같은 날, 검증 후 적용)

- [x] **① 스윕 fail-loud**: `verify_auth()`로 시작 시 인증 검증 → PAT 만료·무효면 `::error::` + exit 1(Actions 빨강). 기존엔 만료돼도 "생성 0"으로 조용히 성공하던 문제
- [x] **③ 미작성 stub 시각화**: `Project.isStub`(템플릿 문구 잔존 판별) → 카드 🌱 미작성 배지 + 헤더 "미작성 N개". 커밋일 기준 초록으로 떠 실제 방치를 가리던 신호 희석 완화
- [x] **④ 필터 칩**: 카드 그리드를 클라이언트 컴포넌트 `app/ProjectGrid.tsx`로 분리 + 전체/작성됨/방치/미작성/완료 필터(개수 표시). page.tsx는 서버 페치만 유지(토큰 미노출)
- [x] **PAT 만료 선제 알림**: 스윕이 만료일 헤더를 읽어 D-14 이내면 `project-dashboard`에 알림 이슈 자동 생성(@owner 멘션). 실측: REPO_SWEEP_TOKEN 만료 2027-07-20(D-364) 확인
- [x] 검증: typecheck OK · 23 tests pass · next build 프리렌더 성공 · CI success · Actions dry-run success

## 🔒 2026-06-01 보안·품질 개선 (검증 후 적용)

- [x] preview 페이지 마크다운 XSS 새니타이즈 (`sanitize-html`) — script/onerror/javascript: 차단, 체크박스 유지
- [x] 접근 제어 추가 (`proxy.ts` Basic Auth, `DASH_PASSWORD`) — 배포 시 env 설정 필요
- [x] GitHub API 동시성 6으로 제한 (repo 다수 시 rate limit 방어)
- [x] 카드 React key `name`→`repo` (중복명 충돌 방지)
- [x] 미사용 Tailwind 체인(tailwind/postcss/autoprefixer) 제거 → audit moderate 일부 해소
- [x] 문서/스크립트 불일치 정리 (없는 `npm run lint` 안내 제거)
- [x] **배포 완료**: Vercel에 `DASH_PASSWORD` 등록 → production 인증 게이트 라이브 (2026-06-04 실측: root/`/p/*` 401, `/manifest.json` 200)
- [x] (후속) `lib/parse.ts` 단위 테스트 추가 → vitest 도입 (2026-06-13)

## 📊 진행 체크리스트

- [x] 코드 작성 (app/, lib/, templates/)
- [x] 로컬 npm install
- [x] .env.local 작성
- [x] Vercel 배포
- [x] 토큰 중복 prefix(`github_pat_github_pat_...`) 수정 → 401 해결
- [x] 디버그 console.log 4줄 제거 (lib/github.ts)
- [x] sanitize 함수 단순화 → `.trim()`만 남김
- [x] Vercel 환경변수 GITHUB_TOKEN 정정 + All Environments 단일 항목으로 재구성
- [x] PWA 자산 추가 (manifest + sw + 아이콘 3장)
- [x] 헤더 도움말 버튼 (HelpDialog, client component)
- [x] 헤더 새로고침 버튼 (RefreshButton + Server Action — ISR 즉시 무효화)
- [x] /p/[repo] preview 페이지 (대시보드 안에서 STATUS.md 본문 마크다운 렌더)
- [x] private repo 자동 스캔 폴백을 `/user/repos?affiliation=owner`로 교체
- [x] HANDOFF.md 작성 (장기 인수인계 문서)
- [x] README.md PWA·도움말·새로고침·preview 페이지 반영 (완료 확인 2026-06-04)
- [x] 글로벌 `~/.claude/CLAUDE.md`에 STATUS.md 자동 관리 규칙 삽입 → 전 프로젝트 자동 적용 (2026-06-04)
- [x] 실제 진행 repo STATUS.md 시딩·push: book-collector·csat-mastery·phonics2csat·instant-english (2026-06-04, 총 6장 카드)
- [x] 세션 규칙 강화 (2026-06-13): `pc` 값을 `hostname`으로 실제 PC 이름 채우도록 CLAUDE.md/README/템플릿 수정. efl-reading-trainer에 CLAUDE.md 전파
- [x] `lib/parse.ts` 단위 테스트 추가 (vitest, 2026-06-13)
- [x] `lib/github.ts` 단위 테스트 추가 (fetch mock, 6 케이스) + GitHub Actions CI(`npm test` + `tsc`) + proxy.ts timing-safe 비교 + CI 액션 v5 (2026-06-13)
- [x] 헤더 "📖 앱 안내" 버튼/모달 추가 (GuideDialog) — 앱 개요·작동 방식·사용자 가이드. Playwright로 렌더 검증 (2026-06-13)
- [x] github.ts API 오류 처리 개선 (2026-06-26): 404만 null 처리, 403(rate limit)·5xx는 전파 → 일시 장애 때 프로젝트가 카드에서 조용히 사라지던 버그 수정. 회귀 방지 테스트 2개 추가(총 23개 통과)
- [x] sw.js: 인증된 비공개 화면('/' navigation)을 프리캐시·런타임 캐시에서 제외 (CACHE v1→v2). 공유 PC 캐시본 노출 방지 (2026-06-26)
- [x] preview 페이지(/p/[repo]) 신호등 색을 메인 카드와 동일 기준(getHealth/커밋 최신성)으로 통일 → parse.ts의 getHealth/daysAgo export (2026-06-26)
- [x] page.tsx catch (e: any) → unknown + Error 좁히기 (strict 모드 정합) (2026-06-26)
- [ ] (모니터링) Next.js postcss 취약점(GHSA-qx2v-qp2m-jg93): 안정판 패치(16.3.0+) 미출시 → 출시 시 next 업그레이드. 빌드 도구 한정이라 런타임 위험 낮음

## ⏭️ 다음에 할 일 (Next Actions)

1. **`vercel login`** → Vercel 환경변수 `USE_DIGEST_TARGETS=1` 추가(All Environments) → **master push 로 재배포**.
   카드 76 → 19장. 이상하면 환경변수만 지우면 즉시 원복된다.
2. (선택) 카드가 너무 적다 싶으면 `DIGEST_BUCKETS=active,cooling` 로 59장.
3. **빈 stub 49개 처리** — STATUS.md 보유 77개 중 49개가 progress 0 의 미작성 stub이다.
   카드가 있어도 내용이 없으면 신호가 되지 않는다. 채우거나 걷어낼 것.
4. (주의) 반영은 반드시 **master push**(fresh 빌드). `vercel redeploy` 는 낡은 빌드를 재사용해 변경이 안 보인다.

## ✅ 결정 완료 (2026-06-13)

- **repo 공개** → **public 전환 완료**. 대시보드 URL은 `DASH_PASSWORD` Basic Auth로 계속 보호됨.
- **`DASH_PASSWORD` 환경 스코프** → **All Environments 유지** 결정(로컬도 게이트 적용, 동작엔 무관).

## 🔗 Claude Code 재개 프롬프트

"project-dashboard STATUS.md 읽고, vercel login 후 USE_DIGEST_TARGETS=1 등록해서 카드 19장으로 줄이자"
