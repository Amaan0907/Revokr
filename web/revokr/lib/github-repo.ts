// A repository's own details and latest commits, read from GitHub with the signed-in user's token.
// Anything that goes wrong returns null: these are extra facts on the page, not something it depends
// on. The token is the user's, so this can only ever read what that user can read on GitHub.
export interface GitHubRepoDetails {
  description: string | null;
  isPrivate: boolean;
  defaultBranch: string;
  language: string | null;
  pushedAt: string | null;
  htmlUrl: string;
  commits: { sha: string; message: string; author: string; date: string | null; url: string }[];
}

interface GitHubRepoResponse {
  description: string | null;
  private: boolean;
  default_branch: string;
  language: string | null;
  pushed_at: string | null;
  html_url: string;
}

interface GitHubCommitResponse {
  sha: string;
  html_url: string;
  commit: { message: string; author: { name: string; date: string } | null };
  author: { login: string } | null;
}

const HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

async function github<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { ...HEADERS, Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
  return (await response.json()) as T;
}

export async function getGitHubRepoDetails(
  owner: string,
  name: string,
  token: string,
): Promise<GitHubRepoDetails | null> {
  const repo = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  try {
    const [details, commits] = await Promise.all([
      github<GitHubRepoResponse>(repo, token),
      github<GitHubCommitResponse[]>(`${repo}/commits?per_page=5`, token).catch(() => []),
    ]);
    return {
      description: details.description,
      isPrivate: details.private,
      defaultBranch: details.default_branch,
      language: details.language,
      pushedAt: details.pushed_at,
      htmlUrl: details.html_url,
      commits: commits.map((entry) => ({
        sha: entry.sha,
        message: entry.commit.message.split("\n")[0],
        author: entry.author?.login ?? entry.commit.author?.name ?? "unknown",
        date: entry.commit.author?.date ?? null,
        url: entry.html_url,
      })),
    };
  } catch {
    return null;
  }
}
