#!/usr/bin/env python3
"""
STATUS.md 스윕 — 대시보드에 새 앱이 자동으로 뜨게 하는 장치.

이 대시보드는 "루트에 STATUS.md가 있는 repo"만 카드로 그린다.
그래서 v0.dev·Replit import·GitHub 웹에서 새로 만든 repo처럼
로컬 템플릿이나 Claude Code 세션을 거치지 않은 repo는 영영 안 뜬다.

이 스크립트는 그 구멍을 메운다:
  최근 ACTIVE_DAYS 안에 push된 소유 repo 중 루트 STATUS.md가 없는 것에
  최소 양식의 stub STATUS.md를 만들어 커밋한다.

노이즈 방지 장치(중요):
  - 최근 활동이 있는 repo만 대상 (오래된 실험·아카이브는 건드리지 않음)
  - archived / fork 제외
  - DENY_PATTERNS 에 걸리는 습작·테스트 repo 제외
  - 이미 STATUS.md가 있으면 절대 덮어쓰지 않음 (사람이 쓴 내용 보호)

환경변수:
  GITHUB_TOKEN  repo 쓰기 권한 PAT (필수)
  GH_OWNER      대상 계정 (기본 smilepat)
  ACTIVE_DAYS   최근 며칠 이내 push된 repo만 (기본 30)
  DRY_RUN       "1"이면 실제 커밋 없이 대상만 출력
"""
import base64
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

TOKEN = os.environ.get("GITHUB_TOKEN", "")
OWNER = os.environ.get("GH_OWNER", "smilepat")
ACTIVE_DAYS = int(os.environ.get("ACTIVE_DAYS", "30"))
DRY_RUN = os.environ.get("DRY_RUN", "") == "1"

# 습작·연습·데모성 repo는 대시보드에 올리지 않는다.
DENY_PATTERNS = [
    r"^test", r"test\d*$", r"^tictactoe$", r"-lecture$", r"^github-",
    r"^git-adventure$", r"^love-text$", r"^manga-", r"^claude-design$",
    r"^push-diary$",  # 일지 저장소(프로젝트 아님)
    r"^dev-workflow$",  # 멀티 PC 작업 지침 문서(앱 아님)
    r"^lumina-bridge",  # 발표 슬라이드 덱(앱 아님)
]

if not TOKEN:
    sys.exit("GITHUB_TOKEN 이 없습니다.")


def api(method, path, payload=None):
    req = urllib.request.Request(
        f"https://api.github.com{path}",
        method=method,
        data=json.dumps(payload).encode() if payload else None,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, {"err": e.read().decode()[:200]}


def denied(name):
    low = name.lower()
    return any(re.search(p, low) for p in DENY_PATTERNS)


def list_repos():
    """소유 repo 전체 (페이지네이션)."""
    out, page = [], 1
    while True:
        st, data = api(
            "GET", f"/user/repos?per_page=100&sort=pushed&affiliation=owner&page={page}"
        )
        if st != 200 or not data:
            break
        out.extend(data)
        if len(data) < 100:
            break
        page += 1
    return out


def stub(repo, desc, today, pc="github-actions"):
    headline = (desc or "").strip() or "(설명 없음 — 실제 진행 상황을 확인해 채워 넣을 것)"
    return f"""---
project: {repo}
status: active
progress: 0
updated: {today}
pc: {pc}
---

# {repo} — STATUS

## 🎯 한 줄 상태
{headline}

## 📊 진행 체크리스트
- [ ] 현황 파악 후 이 STATUS.md 실제 내용으로 채우기  ← 현재 위치
- [ ] 다음 작업 정의

## ⏭️ 다음에 할 일 (Next Actions)
1. 이 repo의 실제 진행 상황을 확인하고 progress·체크리스트를 갱신

## 🤔 결정 대기 (Decisions Needed)
- 아직 없음

## 🔗 Claude Code 재개 프롬프트
"STATUS.md 읽고 {repo} 이어서 하자"
"""


def main():
    cutoff = datetime.now(timezone.utc) - timedelta(days=ACTIVE_DAYS)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    created, skipped, failed = [], 0, []

    for r in list_repos():
        name = r["name"]
        if r.get("archived") or r.get("fork") or denied(name):
            skipped += 1
            continue
        pushed = datetime.strptime(r["pushed_at"], "%Y-%m-%dT%H:%M:%SZ").replace(
            tzinfo=timezone.utc
        )
        if pushed < cutoff:
            skipped += 1
            continue

        st, _ = api("GET", f"/repos/{OWNER}/{name}/contents/STATUS.md")
        if st == 200:
            skipped += 1  # 이미 있음 — 절대 덮어쓰지 않는다
            continue
        if st != 404:
            failed.append((name, f"조회 오류 {st}"))
            continue

        if DRY_RUN:
            print(f"[dry-run] 생성 예정: {name}")
            created.append(name)
            continue

        content = base64.b64encode(
            stub(name, r.get("description"), today).encode()
        ).decode()
        st_p, res = api(
            "PUT",
            f"/repos/{OWNER}/{name}/contents/STATUS.md",
            {
                "message": "chore: add STATUS.md for project-dashboard tracking",
                "content": content,
                "branch": r.get("default_branch") or "main",
            },
        )
        if st_p in (200, 201):
            print(f"생성: {name}")
            created.append(name)
        else:
            failed.append((name, f"{st_p} {res.get('err', '')[:80]}"))

    print(f"\n=== 생성 {len(created)} / 건너뜀 {skipped} / 실패 {len(failed)} ===")
    for n, e in failed:
        print(f"  실패: {n} — {e}")
    # 실패가 있어도 워크플로우 자체는 실패시키지 않는다(다음 주에 재시도).


if __name__ == "__main__":
    main()
