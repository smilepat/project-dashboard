// lib/github.ts
// ─────────────────────────────────────────────────────────────
// 이 파일이 하는 일:
//   GitHub API에 접속해서, 각 프로젝트(repo)의
//   ① STATUS.md 파일 내용  ② 마지막 커밋 날짜 를 가져온다.
// 가져온 raw 데이터는 lib/parse.ts에서 가공한다.
// ─────────────────────────────────────────────────────────────

const GITHUB_API = "https://api.github.com";

// 환경변수 정리: BOM/zero-width 문자 + 앞뒤 공백/CRLF 제거.
// PowerShell stdin pipe가 값에 BOM(U+FEFF)이나 CRLF를 끼워넣는 사례 방지.
// RegExp 생성자 + 명시적 \\u escape로 작성 → 파일 저장/전송 단계에서
// 보이지 않는 문자가 사라지거나 변형되는 사고를 차단.
const INVISIBLE_RE = new RegExp(
  '[\\uFEFF\\u200B\\u200C\\u200D\\u00A0]',
  'g'
);
const sanitize = (v: string | undefined): string =>
  (v ?? '').replace(INVISIBLE_RE, '').trim();

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
// .env에 TARGET_REPOS가 있으면 그것만, 없으면 내 모든 repo를 가져온다.
async function getTargetRepoNames(): Promise<string[]> {
  const fromEnv = sanitize(process.env.TARGET_REPOS);
  if (fromEnv) {
    return fromEnv
      .split(",")
      .map((s) => sanitize(s)) // 각 항목 개별 정리 (혹시 모를 잔여 BOM)
      .filter(Boolean);
  }
  // 내 repo 전체(최대 100개)를 최근 수정순으로 가져옴
  const repos = await gh(`/users/${USERNAME}/repos?per_page=100&sort=updated`);
  return repos.map((r: any) => r.name);
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

// ── 메인 함수 ──
// 모든 대상 repo의 raw 데이터를 한꺼번에 모아서 돌려준다.
export async function fetchAllProjects(): Promise<RawProject[]> {
  const names = await getTargetRepoNames();

  // 모든 repo를 동시에(병렬) 처리해서 빠르게
  const results = await Promise.all(
    names.map(async (repo) => {
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
    })
  );

  // STATUS.md가 있는 프로젝트만 남긴다
  return results.filter((p) => p.statusRaw !== null);
}
