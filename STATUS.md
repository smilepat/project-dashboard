---
project: project-dashboard
status: active
progress: 80
updated: 2026-05-23
pc: home-desktop
---

# project-dashboard — STATUS

## 🎯 한 줄 상태
대시보드 코드·배포 완료. GitHub 토큰 중복 prefix 문제 해결 후 첫 카드 띄우기 직전.

## 📊 진행 체크리스트
- [x] 코드 작성 (app/, lib/, templates/)
- [x] 로컬 npm install
- [x] .env.local 작성
- [x] Vercel 배포
- [x] 토큰 중복 prefix(`github_pat_github_pat_...`) 수정 → 401 해결
- [ ] 디버그 console.log 4줄 제거 (lib/github.ts)  ← 다음
- [ ] sanitize 함수 단순화 (BOM 의심이 오해였음)
- [ ] 4개 repo(repo-a, repo-b, repo-c, repo-d)에 STATUS.md 배포
- [ ] Vercel 환경변수의 GITHUB_TOKEN도 동일하게 수정 확인
- [ ] HANDOFF.md를 현 상태로 갱신

## ⏭️ 다음에 할 일 (Next Actions)
1. lib/github.ts에서 [debug] console.log 4곳 제거하고 sanitize 정리
2. 4개 본 repo에 STATUS.md 차례로 push
3. Vercel 환경변수도 동일 토큰 값으로 갱신 후 재배포

## 🤔 결정 대기 (Decisions Needed)
- sanitize 함수: 완전히 제거 vs. PowerShell BOM 방어용으로 가볍게 남겨두기.

## 🔗 Claude Code 재개 프롬프트
"STATUS.md 읽고 디버그 console.log 제거부터 이어서 하자"
