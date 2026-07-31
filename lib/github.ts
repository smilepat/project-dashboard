// lib/github.ts
// ─────────────────────────────────────────────────────────────
// 이 파일이 하는 일:
//   GitHub API에 접속해서, 각 프로젝트(repo)의
//   ① STATUS.md 파일 내용  ② 마지막 커밋 날짜 를 가져온다.
// 가져온 raw 데이터는 lib/parse.ts에서 가공한다.
// ─────────────────────────────────────────────────────────────

const GITHUB_API = "https://api.github.com";

// GitHub API 오류에 HTTP 상태 코드를 함께 실어 나르는 에러 타입.
// 호출부에서 "404(파일이 정말 없음)"과 "그 외 오류(403 rate limit·5xx 등)"를
// 구분하기 위해 사용한다. 이게 없으면 모든 오류가 똑같이 취급돼,
// 일시적 장애가 "STATUS.md 없음"으로 둔갑해 프로젝트가 화면에서 조용히 사라진다.
class GitHubError extends Error {
  status: number;
  constructor(status: number, path: string) {
    super(`GitHub API 오류 ${status}: ${path}`);
    this.name = "GitHubError";
    this.status = status;
  }
}

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
    throw new GitHubError(res.status, path);
  }
  return res.json();
}

// 소유한 repo 전체를 훑는다(폴백 경로).
// 인증된 본인 컨텍스트로 호출 → private repo까지 자동 포함.
// affiliation=owner: 본인 소유만 (collaborator로 참여한 타 owner repo는 제외)
// 페이지네이션: per_page=100 한 페이지로는 100개 초과 owner는 누락 → 모든 페이지 순회.
async function scanAllOwnedRepoNames(): Promise<string[]> {
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

// digest 가 이미 내린 모멘텀 판정을 대상 목록으로 쓴다.
// 소유한 repo 전체를 카드로 띄우면 "STATUS.md가 있다"는 이유만으로 76장이 상시 표시되고,
// 그중 대부분이 방치 상태라 신호등이 항상 빨강 → 경고가 배경이 된다.
// digest 는 매일 갱신되므로 카드 수가 사람이 정한 숫자가 아니라 자동 산출값이 된다.
//
// 기본은 `active`(7일 내 push)만 — 대시보드가 답해야 할 질문은 "지금 뭘 하고 있는가"다.
// 실측(2026-07-31): active 19장 / +cooling 59장 / +stale_with_intent 65장.
// cooling 43건 중 40건이 STATUS.md를 갖고 있어, cooling 을 넣는 순간 축소 효과가 사라진다.
// 범위를 넓히려면 DIGEST_BUCKETS 환경변수로. 특정 repo 고정은 TARGET_REPOS.
const DIGEST_BUCKET_KEYS = ["active", "cooling", "stale_with_intent"] as const;
type DigestBucketKey = (typeof DIGEST_BUCKET_KEYS)[number];

function getDigestBuckets(): DigestBucketKey[] {
  const raw = sanitize(process.env.DIGEST_BUCKETS);
  if (!raw) return ["active"];
  const picked = raw
    .split(",")
    .map((s) => sanitize(s))
    .filter((s): s is DigestBucketKey =>
      (DIGEST_BUCKET_KEYS as readonly string[]).includes(s)
    );
  // 오타로 전부 걸러지면 기본값으로 — 빈 목록이면 폴백이 돌아 전체 스캔이 된다.
  return picked.length ? picked : ["active"];
}

async function getDigestRepoNames(): Promise<string[] | null> {
  try {
    const d = await fetchDigest();
    const picked = getDigestBuckets().flatMap((k) => d[k] ?? []);
    const names = picked
      .map((r) => String(r.full_name ?? ""))
      .filter((fn) => fn.startsWith(`${USERNAME}/`)) // 타 owner(Reasonofmoon 등)는 URL이 안 맞으므로 제외
      .map((fn) => fn.slice(USERNAME.length + 1))
      .filter(Boolean);
    // digest 는 있는데 대상이 0건이면 잘못 연동된 것 → 빈 대시보드 대신 폴백.
    return names.length ? Array.from(new Set(names)) : null;
  } catch {
    // digest 를 못 읽는 상황(파일 없음·rate limit·워크플로 미실행)에서
    // 대시보드가 통째로 비면 안 되므로 전체 스캔으로 되돌아간다.
    return null;
  }
}

// 대상 repo 이름 목록을 정한다. 우선순위:
//   1) TARGET_REPOS 환경변수 (명시적 수동 지정)
//   2) digest 판정 — USE_DIGEST_TARGETS=1 일 때만
//   3) 소유 repo 전체 스캔 (기본값 / digest 실패 시 폴백)
//
// ⚠ digest 연동이 기본 비활성인 이유 (2026-07-30 확인):
//   digest 의 모멘텀 분류는 registry/repos.csv 의 pushed_at 에 의존하는데,
//   CI 스캔 토큰(SCAN_TOKEN_SMILEPAT)이 소유 repo 209개 중 48개만 열거한다.
//   나머지 151행은 scan-repos.mjs 가 "보존"하면서 과거 pushed_at 이 그대로 얼어붙어,
//   실제로는 어제 푸시한 repo가 몇 달 전 값으로 남아 parked 로 오분류된다.
//   (예: instant-english 실제 2026-07-29 → csv 2026-06-04)
//   이 상태에서 켜면 카드가 76 → 10장으로 줄면서 "작업 중인 repo"가 사라진다.
//   토큰을 All repositories 로 재발급해 데이터가 맞는지 확인한 뒤 켤 것.
async function getTargetRepoNames(): Promise<string[]> {
  const fromEnv = sanitize(process.env.TARGET_REPOS);
  if (fromEnv) {
    return fromEnv
      .split(",")
      .map((s) => sanitize(s))
      .filter(Boolean);
  }
  if (sanitize(process.env.USE_DIGEST_TARGETS) === "1") {
    return (await getDigestRepoNames()) ?? (await scanAllOwnedRepoNames());
  }
  return await scanAllOwnedRepoNames();
}

// repo 하나의 STATUS.md 내용을 가져온다. 파일이 없으면(404) null.
// ⚠️ 403(rate limit)·5xx 같은 일시적 오류는 null로 삼키지 않고 위로 던진다.
//    삼키면 "STATUS.md 없음"과 구분되지 않아 프로젝트가 화면에서 조용히 사라진다.
async function getStatusFile(repo: string): Promise<string | null> {
  try {
    const data = await gh(`/repos/${USERNAME}/${repo}/contents/STATUS.md`);
    // GitHub은 파일 내용을 base64로 인코딩해서 준다 → 원래 글자로 디코딩
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch (e) {
    // 404 = STATUS.md가 정말 없는 repo → 정상적으로 건너뜀
    if (e instanceof GitHubError && e.status === 404) return null;
    // 그 외 오류(rate limit·서버 장애 등)는 page.tsx 에러 배너에 드러나도록 전파
    throw e;
  }
}

// repo 하나의 가장 최근 커밋 날짜(ISO 문자열)를 가져온다.
// 커밋 날짜는 보조 정보(신호등 색·"N일 전")일 뿐이라, 못 가져와도
// 프로젝트를 숨기지 않는다. 어떤 오류든 null → 카드는 "기록 없음"으로 표시.
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

// ── repo-ops-system 다이제스트 ──
// smilepat/repo-ops-system 이 매일 커밋하는 registry/digest.json 을 읽어온다.
// (전체 레포 모멘텀 분류 + 적신호 + PC별 미저장 작업의 단일 산출물)
// 같은 owner(smilepat) 소유 private repo → 기존 토큰으로 접근. 1시간 ISR.
export type Digest = {
  generatedAt?: string;
  enriched?: boolean;
  enrichedCount?: number;
  counts?: Record<string, number>;
  active?: DigestRepo[];
  cooling?: DigestRepo[];
  stale_with_intent?: DigestRepo[];
  redFlags?: { type: string; repo: string; url?: string; host?: string; detail: string }[];
  machines?: {
    hostname: string; scannedAt?: string; ageHours?: number; stale?: boolean;
    dirtyRepoCount?: number;
    repos?: { name: string; full_name?: string; branch?: string; dirty?: number; ahead?: number; behind?: number; subject?: string }[];
  }[];
};
export type DigestRepo = {
  full_name: string; url?: string; domain?: string; age?: number;
  action?: string; openPRs?: number; openIssues?: number; handoffDone?: boolean; next?: string;
};

export async function fetchDigest(): Promise<Digest> {
  const data = await gh(`/repos/${USERNAME}/repo-ops-system/contents/registry/digest.json?ref=main`);
  const json = Buffer.from(data.content, "base64").toString("utf-8");
  return JSON.parse(json) as Digest;
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
