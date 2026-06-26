// lib/github.test.ts
// ─────────────────────────────────────────────────────────────
// GitHub 수집 로직(fetchProjectStatus / fetchAllProjects) 단위 테스트.
//
// 실제 네트워크 호출 없이 global.fetch를 mock으로 대체하고,
// 모듈 로드 시점에 읽는 환경변수(GITHUB_USERNAME/TOKEN/TARGET_REPOS)는
// vi.stubEnv + vi.resetModules + 동적 import로 주입한다.
// ─────────────────────────────────────────────────────────────

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── 가짜 fetch 응답 빌더 ──
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => data });
const notFound = () => ({ ok: false, status: 404, json: async () => ({}) });
// 403(rate limit)·5xx 같은 일시적 오류 응답
const errorResp = (status: number) => ({ ok: false, status, json: async () => ({}) });
// GitHub contents API는 파일을 base64로 준다.
const contentResp = (text: string) =>
  ok({ content: Buffer.from(text, "utf-8").toString("base64") });
const commitsResp = (iso: string) => ok([{ commit: { committer: { date: iso } } }]);

const STATUS_ALPHA = "---\nproject: Alpha\nprogress: 40\n---\n\n## 🎯 한 줄 상태\n진행 중.";

// 기본 라우팅 fetch: alpha는 STATUS.md 있음, beta는 없음(404).
function installDefaultFetch() {
  const fetchMock = vi.fn(async (url: string, _opts?: unknown) => {
    if (url.includes("/user/repos")) return ok([{ name: "alpha" }, { name: "beta" }]);
    if (url.includes("/alpha/contents/STATUS.md")) return contentResp(STATUS_ALPHA);
    if (url.includes("/beta/contents/STATUS.md")) return notFound();
    if (url.includes("/alpha/commits")) return commitsResp("2026-06-10T00:00:00Z");
    if (url.includes("/beta/commits")) return commitsResp("2026-06-01T00:00:00Z");
    return notFound();
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function loadGithub() {
  vi.resetModules();
  return await import("./github");
}

beforeEach(() => {
  vi.stubEnv("GITHUB_USERNAME", "tester");
  vi.stubEnv("GITHUB_TOKEN", "tok");
  vi.stubEnv("TARGET_REPOS", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchProjectStatus", () => {
  it("STATUS.md를 base64에서 디코딩하고 커밋 날짜·URL을 함께 돌려준다", async () => {
    installDefaultFetch();
    const { fetchProjectStatus } = await loadGithub();
    const r = await fetchProjectStatus("alpha");
    expect(r.statusRaw).toBe(STATUS_ALPHA);
    expect(r.lastCommit).toBe("2026-06-10T00:00:00Z");
    expect(r.url).toBe("https://github.com/tester/alpha");
    expect(r.repo).toBe("alpha");
  });

  it("STATUS.md가 없으면 statusRaw는 null", async () => {
    installDefaultFetch();
    const { fetchProjectStatus } = await loadGithub();
    const r = await fetchProjectStatus("beta");
    expect(r.statusRaw).toBeNull();
  });

  it("Authorization 헤더에 Bearer 토큰을 싣는다", async () => {
    const fetchMock = installDefaultFetch();
    const { fetchProjectStatus } = await loadGithub();
    await fetchProjectStatus("alpha");
    const [, opts] = fetchMock.mock.calls[0];
    expect((opts as any).headers.Authorization).toBe("Bearer tok");
  });
});

describe("fetchAllProjects", () => {
  it("TARGET_REPOS가 있으면 그 목록만 쓰고 /user/repos는 호출하지 않는다", async () => {
    vi.stubEnv("TARGET_REPOS", "alpha, beta"); // 공백 포함 → trim 검증
    const fetchMock = installDefaultFetch();
    const { fetchAllProjects } = await loadGithub();
    const projects = await fetchAllProjects();

    // STATUS.md 있는 alpha만 남는다(beta는 404로 제외)
    expect(projects.map((p) => p.repo)).toEqual(["alpha"]);
    // /user/repos 자동 스캔은 호출되지 않아야 한다
    const calledUserRepos = fetchMock.mock.calls.some(([u]) =>
      String(u).includes("/user/repos")
    );
    expect(calledUserRepos).toBe(false);
  });

  it("TARGET_REPOS가 비면 /user/repos로 본인 소유 repo를 스캔하고 STATUS.md 없는 repo는 제외한다", async () => {
    const fetchMock = installDefaultFetch();
    const { fetchAllProjects } = await loadGithub();
    const projects = await fetchAllProjects();

    expect(projects.map((p) => p.repo)).toEqual(["alpha"]); // beta 제외
    const calledUserRepos = fetchMock.mock.calls.some(([u]) =>
      String(u).includes("/user/repos")
    );
    expect(calledUserRepos).toBe(true);
  });

  it("STATUS.md 조회가 404가 아닌 오류(403 rate limit)면 삼키지 않고 던진다", async () => {
    // 일시적 장애가 "STATUS.md 없음"으로 둔갑해 프로젝트가 조용히 사라지면 안 된다.
    vi.stubEnv("TARGET_REPOS", "alpha");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/alpha/contents/STATUS.md")) return errorResp(403);
        if (url.includes("/alpha/commits")) return commitsResp("2026-06-10T00:00:00Z");
        return notFound();
      })
    );
    const { fetchAllProjects } = await loadGithub();
    await expect(fetchAllProjects()).rejects.toThrow(/403/);
  });

  it("STATUS.md가 404면(진짜 없음) 던지지 않고 그 repo만 제외한다", async () => {
    // 404는 정상 케이스 — beta(404)는 빠지고 alpha는 남아야 한다.
    vi.stubEnv("TARGET_REPOS", "alpha, beta");
    installDefaultFetch();
    const { fetchAllProjects } = await loadGithub();
    const projects = await fetchAllProjects();
    expect(projects.map((p) => p.repo)).toEqual(["alpha"]);
  });

  it("repo 목록이 비면 빈 배열을 돌려준다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/user/repos")) return ok([]);
        return notFound();
      })
    );
    const { fetchAllProjects } = await loadGithub();
    const projects = await fetchAllProjects();
    expect(projects).toEqual([]);
  });
});
