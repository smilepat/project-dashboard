// lib/github.ts
// ─────────────────────────────────────────────────────────────
// 이 파일이 하는 일:
//   GitHub API에 접속해서, 각 프로젝트(repo)의
//   ① STATUS.md 파일 내용  ② 마지막 커밋 날짜 를 가져온다.
// 가져온 raw 데이터는 lib/parse.ts에서 가공한다.
// ─────────────────────────────────────────────────────────────

const GITHUB_API = "https://api.github.com";

// repo가 많을 때 GitHub API에 동시 요청이 폭주(secondary rate limit/abuse 차단)
// 하지 않도록 동시 처리 개수를 제한하는 작업 풀. 외부 의존성 없이 구현.
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

// 환경변수에 붙는 앞뒤 공백/줄바꿈만 제거.
const sanitize = (v: string | undefined): string => (v ?? '').trim();

const USERNAME = sanitize(process.env.GITHUB_USERNAME);
const TOKEN = sanitize(process.env.GITHUB_TOKEN);

// GitHub API 호출 공통 함수 (인증 헤더를 자동으로 붙여줌)
async function gh(path: string) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    // Next.js가 1시간(3600초)마다 한 번만 실제로 호출하도록 캐싱
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`GitHub API 오류 ${res.status}: ${path}`);
  }
  return res.json();
}

// 대상 repo 이름 목록을 정한다.
// .env에 TARGET_REPOS가 있으면 그것만, 없으면 토큰으로 볼 수 있는 본인 소유 repo 전체.
async function getTargetRepoNames(): Promise<string[]> {
  const fromEnv = sanitize(process.env.TARGET_REPOS);
  if (fromEnv) {
    return fromEnv
      .split(",")
      .map((s) => sanitize(s))
      .filter(Boolean);
  }
  // 인증된 본인 컨텍스트로 호출 → private repo까지 자동 포함.
  // affiliation=owner: 본인 소유만 (collaborator로 참여한 타 owner repo는 제외)
  // 페이지네이션: per_page=100 한 페이지로는 100개 초과 owner는 누락 → 모든 페이지 순회.
  const names: string[] = [];
  let page = 1;
  while (true) {
    const repos = await gh(
      `/user/repos?per_page=100&sort=updated&affiliation=owner&page=${page}`
    );
    if (!Array.isArray(repos) || repos.length === 0) break;
    names.push(...repos.map((r: any) => r.name));
    if (repos.length < 100) break; // 마지막 페이지면 종료
    page++;
  }
  return names;
}

// repo 하나의 STATUS.md 내용을 가져온다. 없으면 null.
async function getStatusFile(repo: string): Promise<string | null> {
  try {
    const data = await gh(`/repos/${USERNAME}/${repo}/contents/STATUS.md`);
    // GitHub은 파일 내용을 base64로 인코딩해서 준다 → 원래 글자로 디코딩
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch {
    return null; // STATUS.md가 없는 repo는 건너뜀
  }
}

// repo 하나의 가장 최근 커밋 날짜(ISO 문자열)를 가져온다.
async function getLastCommitDate(repo: string): Promise<string | null> {
  try {
    const commits = await gh(`/repos/${USERNAME}/${repo}/commits?per_page=1`);
    return commits[0]?.commit?.committer?.date ?? null;
  } catch {
    return null;
  }
}

// repo 하나에 대한 raw 수집 결과 타입
export type RawProject = {
  repo: string;
  statusRaw: string | null;   // STATUS.md 원문 (없으면 null)
  lastCommit: string | null;  // 마지막 커밋 ISO 날짜
  url: string;                // GitHub repo 주소
};

// preview 페이지(/p/[repo])에서 쓰는 단일 repo 조회 함수.
// repo 하나의 STATUS.md + 마지막 커밋 + GitHub URL을 한 번에 돌려준다.
export async function fetchProjectStatus(repo: string): Promise<RawProject> {
  const cleanRepo = sanitize(repo);
  const [statusRaw, lastCommit] = await Promise.all([
    getStatusFile(cleanRepo),
    getLastCommitDate(cleanRepo),
  ]);
  return {
    repo: cleanRepo,
    statusRaw,
    lastCommit,
    url: `https://github.com/${USERNAME}/${cleanRepo}`,
  };
}

// ── 메인 함수 ──
// 모든 대상 repo의 raw 데이터를 한꺼번에 모아서 돌려준다.
export async function fetchAllProjects(): Promise<RawProject[]> {
  const names = await getTargetRepoNames();

  // 동시성 6으로 제한해 처리(repo당 2호출 → 최대 12 동시). repo 수가 많아도
  // GitHub의 secondary rate limit에 걸리지 않게 한다.
  const results = await mapLimit(names, 6, async (repo) => {
    const [statusRaw, lastCommit] = await Promise.all([
      getStatusFile(repo),
      getLastCommitDate(repo),
    ]);
    return {
      repo,
      statusRaw,
      lastCommit,
      url: `https://github.com/${USERNAME}/${repo}`,
    };
  });

  // STATUS.md가 있는 프로젝트만 남긴다
  return results.filter((p) => p.statusRaw !== null);
}
