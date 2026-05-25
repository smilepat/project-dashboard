---
project: project-dashboard
status: active
progress: 95
updated: 2026-05-25
pc: home-desktop
---

# project-dashboard — STATUS

## 🎯 한 줄 상태

대시보드 production 작동 중 + PWA 설치 가능. 남은 일은 다른 repo의 STATUS.md 배포와 각 프로젝트 CLAUDE.md에 자동 갱신 블록 삽입.

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
- [ ] `repo-a`에 STATUS.md 작성·push (사용자에게 진행 상황 확인 후)
- [ ] `repo-c`에 STATUS.md 작성·push (사용자에게 진행 상황 확인 후)
- [ ] (선택) `repo-d`, `repo-b` 등 실제 존재하는 repo에 STATUS.md 추가
- [ ] 각 프로젝트 CLAUDE.md에 "세션 규칙 (STATUS.md 자동 관리)" 블록 삽입
- [ ] README.md를 PWA·도움말·새로고침·preview 페이지 반영해 갱신

## ⏭️ 다음에 할 일 (Next Actions)

1. README.md 갱신 — PWA, RefreshButton, /p/[repo] preview, HelpDialog 반영 + 폴더 구조 트리 업데이트
2. `repo-a`, `repo-c`의 진행 상황을 짧게 듣고 STATUS.md 작성 → push 안내
3. 각 프로젝트 CLAUDE.md에 README의 "Phase 4" 블록 (STATUS.md 자동 관리) 삽입

## 🤔 결정 대기 (Decisions Needed)

- 없음 — sanitize 단순화 결정 끝남 (`.trim()`만 유지).

## 🔗 Claude Code 재개 프롬프트

"HANDOFF.md 읽고 우선순위 1번부터 진행. README.md 갱신 끝나면 repo-a / repo-c STATUS.md 작성 이어서 하자."
