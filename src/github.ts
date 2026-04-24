import { Octokit } from "@octokit/rest";

export interface PullRequest {
  number: number;
  title: string;
  author: string;
  createdAt: string;
  mergedAt: string | null;
  state: string;
}

export interface Review {
  id: number;
  pullNumber: number;
  reviewer: string;
  state: string;
  submittedAt: string;
}

export interface GitHubClientOptions {
  token: string;
  owner: string;
  repo: string;
}

export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(options: GitHubClientOptions) {
    this.octokit = new Octokit({ auth: options.token });
    this.owner = options.owner;
    this.repo = options.repo;
  }

  async fetchMergedPullRequests(since: Date): Promise<PullRequest[]> {
    const pulls: PullRequest[] = [];
    let page = 1;

    while (true) {
      const { data } = await this.octokit.pulls.list({
        owner: this.owner,
        repo: this.repo,
        state: "closed",
        sort: "updated",
        direction: "desc",
        per_page: 100,
        page,
      });

      if (data.length === 0) break;

      const filtered = data.filter(
        (pr) => pr.merged_at && new Date(pr.merged_at) >= since
      );

      for (const pr of filtered) {
        pulls.push({
          number: pr.number,
          title: pr.title,
          author: pr.user?.login ?? "unknown",
          createdAt: pr.created_at,
          mergedAt: pr.merged_at ?? null,
          state: pr.state,
        });
      }

      const oldest = data[data.length - 1];
      if (!oldest.updated_at || new Date(oldest.updated_at) < since) break;

      page++;
    }

    return pulls;
  }

  async fetchReviewsForPR(pullNumber: number): Promise<Review[]> {
    const { data } = await this.octokit.pulls.listReviews({
      owner: this.owner,
      repo: this.repo,
      pull_number: pullNumber,
    });

    return data.map((review) => ({
      id: review.id,
      pullNumber,
      reviewer: review.user?.login ?? "unknown",
      state: review.state,
      submittedAt: review.submitted_at ?? "",
    }));
  }
}
