// lib/parse.test.ts
// ─────────────────────────────────────────────────────────────
// parseProject / parseAll 단위 테스트.
// 핵심 로직(progress 산출·신호등 계산·Front Matter/섹션 파싱·정렬)이
// 회귀하지 않는지 검증한다.
//
// 신호등 계산은 Date.now()에 의존하므로, 가짜 타이머로 "현재 시각"을
// 2026-06-13T12:00:00Z로 고정해 결과를 결정적으로 만든다.
// ─────────────────────────────────────────────────────────────

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { parseProject, parseAll } from "./parse";
import type { RawProject } from "./github";

const NOW = new Date("2026-06-13T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterAll(() => {
  vi.useRealTimers();
});

// 며칠 전 커밋의 ISO 문자열을 만든다.
function daysAgoIso(days: number): string {
  return new Date(NOW.getTime() - days * DAY).toISOString();
}

// 테스트용 RawProject 빌더.
function raw(
  statusRaw: string | null,
  lastCommit: string | null = daysAgoIso(0),
  repo = "demo"
): RawProject {
  return { repo, statusRaw, lastCommit, url: `https://github.com/u/${repo}` };
}

// Front Matter + 본문을 조립하는 헬퍼.
function md(frontMatter: Record<string, string | number>, body = ""): string {
  const fm = Object.entries(frontMatter)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return `---\n${fm}\n---\n\n${body}`;
}

describe("parseProject — progress", () => {
  it("Front Matter의 progress를 그대로 쓴다", () => {
    const p = parseProject(raw(md({ project: "A", progress: 70 })));
    expect(p.progress).toBe(70);
  });

  it("progress가 없으면 체크리스트 완료 비율로 자동 계산한다", () => {
    const body = [
      "## 체크리스트",
      "- [x] 하나",
      "- [x] 둘",
      "- [ ] 셋",
      "- [ ] 넷",
    ].join("\n");
    const p = parseProject(raw(md({ project: "A" }, body)));
    expect(p.progress).toBe(50); // 2/4
  });

  it("progress도 체크리스트도 없으면 0", () => {
    const p = parseProject(raw(md({ project: "A" })));
    expect(p.progress).toBe(0);
  });
});

describe("parseProject — 신호등(health)", () => {
  it("3일 이내 커밋 + active → green", () => {
    const p = parseProject(raw(md({ project: "A", status: "active" }), daysAgoIso(1)));
    expect(p.health).toBe("green");
    expect(p.daysSinceCommit).toBe(1);
  });

  it("4~7일 커밋 → yellow", () => {
    const p = parseProject(raw(md({ project: "A", status: "active" }), daysAgoIso(5)));
    expect(p.health).toBe("yellow");
  });

  it("7일 초과 커밋 → red", () => {
    const p = parseProject(raw(md({ project: "A", status: "active" }), daysAgoIso(10)));
    expect(p.health).toBe("red");
  });

  it("status: done이면 오래된 커밋이어도 green", () => {
    const p = parseProject(raw(md({ project: "A", status: "done" }), daysAgoIso(30)));
    expect(p.health).toBe("green");
  });

  it("status: paused이면 최근 커밋이어도 yellow", () => {
    const p = parseProject(raw(md({ project: "A", status: "paused" }), daysAgoIso(0)));
    expect(p.health).toBe("yellow");
  });

  it("커밋 날짜가 없으면(null) yellow + daysSinceCommit null", () => {
    const p = parseProject(raw(md({ project: "A", status: "active" }), null));
    expect(p.health).toBe("yellow");
    expect(p.daysSinceCommit).toBeNull();
  });
});

describe("parseProject — 섹션 파싱", () => {
  it("'한 줄 상태' 섹션에서 headline을 뽑는다", () => {
    const body = ["## 🎯 한 줄 상태", "지금은 테스트 작성 중."].join("\n");
    const p = parseProject(raw(md({ project: "A" }, body)));
    expect(p.headline).toBe("지금은 테스트 작성 중.");
  });

  it("'다음에 할 일' 섹션에서 머리표를 떼고 목록을 뽑는다", () => {
    const body = [
      "## ⏭️ 다음에 할 일 (Next Actions)",
      "1. 첫 번째 일",
      "2. 두 번째 일",
    ].join("\n");
    const p = parseProject(raw(md({ project: "A" }, body)));
    expect(p.nextActions).toEqual(["첫 번째 일", "두 번째 일"]);
  });

  it("체크리스트의 완료/미완료 상태를 정확히 파싱한다", () => {
    const body = ["## 체크리스트", "- [x] 완료한 것", "- [ ] 안 한 것"].join("\n");
    const p = parseProject(raw(md({ project: "A" }, body)));
    expect(p.checklist).toEqual([
      { text: "완료한 것", done: true },
      { text: "안 한 것", done: false },
    ]);
  });
});

describe("parseProject — Front Matter 폴백", () => {
  it("project가 없으면 repo 이름을 표시명으로 쓴다", () => {
    const p = parseProject(raw(md({ status: "active" }), daysAgoIso(0), "my-repo"));
    expect(p.name).toBe("my-repo");
  });

  it("pc/updated가 없으면 '?'로 폴백한다", () => {
    const p = parseProject(raw(md({ project: "A" })));
    expect(p.pc).toBe("?");
    expect(p.updated).toBe("?");
  });
});

describe("parseAll — 정렬", () => {
  it("방치된 순(커밋이 오래된 순)으로 정렬한다", () => {
    const list = parseAll([
      raw(md({ project: "Recent" }), daysAgoIso(1), "recent"),
      raw(md({ project: "Old" }), daysAgoIso(20), "old"),
      raw(md({ project: "Mid" }), daysAgoIso(8), "mid"),
    ]);
    expect(list.map((p) => p.name)).toEqual(["Old", "Mid", "Recent"]);
  });
});
