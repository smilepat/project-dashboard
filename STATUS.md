---
project: project-dashboard
status: active
progress: 99
updated: 2026-06-04
pc: home-desktop
---

# project-dashboard — STATUS

## 🎯 한 줄 상태

대시보드 production 작동 + PWA + 보안(인증 게이트·XSS·동시성) 완료. 글로벌 CLAUDE.md 규칙으로 전 프로젝트 STATUS.md 자동 관리 + 실제 repo 6장 시딩 완료. 사실상 유지보수 단계 — 남은 건 선택적 단위 테스트와 공개 여부 결정.

## 🔒 2026-06-01 보안·품질 개선 (검증 후 적용)

- [x] preview 페이지 마크다운 XSS 새니타이즈 (`sanitize-html`) — script/onerror/javascript: 차단, 체크박스 유지
- [x] 접근 제어 추가 (`proxy.ts` Basic Auth, `DASH_PASSWORD`) — 배포 시 env 설정 필요
- [x] GitHub API 동시성 6으로 제한 (repo 다수 시 rate limit 방어)
- [x] 카드 React key `name`→`repo` (중복명 충돌 방지)
- [x] 미사용 Tailwind 체인(tailwind/postcss/autoprefixer) 제거 → audit moderate 일부 해소
- [x] 문서/스크립트 불일치 정리 (없는 `npm run lint` 안내 제거)
- [x] **배포 완료**: Vercel에 `DASH_PASSWORD` 등록 → production 인증 게이트 라이브 (2026-06-04 실측: root/`/p/*` 401, `/manifest.json` 200)
- [ ] (후속) `lib/parse.ts` 단위 테스트 추가

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
- [ ] (선택) `lib/parse.ts` 단위 테스트 추가

## ⏭️ 다음에 할 일 (Next Actions)

- 시스템은 사실상 완성. 신규 프로젝트는 글로벌 규칙이 STATUS.md를 자동 생성·갱신하므로 별도 작업 불필요.
1. (선택) `lib/parse.ts` 단위 테스트 추가 — Front Matter/신호등 파싱 검증
2. 카드 표시 확인 — 헤더 "🔄 새로고침" 또는 ISR(≤1h) 후 6장 카드 노출 확인

## 🤔 결정 대기 (Decisions Needed)

- **repo 공개 전환 여부** — 민감정보 스크럽으로 공개 안전 확인됨(파일+히스토리). 다만 아직 private 유지 중. 공개 여부 미정.
- **`DASH_PASSWORD` 환경 스코프** — 현재 All Environments. 로컬 dev 편의를 원하면 Production/Preview만으로 제한 가능(동작엔 무관).

## 🔗 Claude Code 재개 프롬프트

"STATUS.md 읽고 (선택) lib/parse.ts 단위 테스트부터. 신규 프로젝트는 글로벌 규칙이 STATUS.md를 자동 관리하므로 대시보드는 유지보수 단계."
