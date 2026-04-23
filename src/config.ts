import { execSync } from "child_process";

export interface Config {
  owner: string;
  repo: string;
  token: string;
  baseUrl: string;
}

function getGitHubToken(): string {
  try {
    const token = execSync("gh auth token", { encoding: "utf-8" }).trim();
    if (!token) {
      throw new Error("Empty token returned from gh auth");
    }
    return token;
  } catch {
    throw new Error(
      "Failed to retrieve GitHub token. Make sure you are authenticated with `gh auth login`."
    );
  }
}

function parseRepoArg(repoArg?: string): { owner: string; repo: string } {
  if (repoArg) {
    const parts = repoArg.split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error(`Invalid repository format: "${repoArg}". Expected "owner/repo".`);
    }
    return { owner: parts[0], repo: parts[1] };
  }

  try {
    const remoteUrl = execSync("git remote get-url origin", { encoding: "utf-8" }).trim();
    const match = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (!match) {
      throw new Error("Could not parse GitHub owner/repo from remote URL.");
    }
    return { owner: match[1], repo: match[2] };
  } catch {
    throw new Error(
      "Could not determine repository. Pass --repo owner/repo or run inside a git repository."
    );
  }
}

export function loadConfig(repoArg?: string): Config {
  const { owner, repo } = parseRepoArg(repoArg);
  const token = getGitHubToken();
  const baseUrl = process.env.GH_HOST
    ? `https://${process.env.GH_HOST}/api/v3`
    : "https://api.github.com";

  return { owner, repo, token, baseUrl };
}
