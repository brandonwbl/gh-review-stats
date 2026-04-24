import { GitHubClient, PullRequest, Review } from "./github";

export interface PRWithReviews {
  pr: PullRequest;
  reviews: Review[];
}

export interface FetchOptions {
  client: GitHubClient;
  since: Date;
  concurrency?: number;
}

async function runConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function fetchPRsWithReviews(
  options: FetchOptions
): Promise<PRWithReviews[]> {
  const { client, since, concurrency = 5 } = options;

  const prs = await client.fetchMergedPullRequests(since);

  if (prs.length === 0) {
    return [];
  }

  const results = await runConcurrent(prs, concurrency, async (pr) => {
    const reviews = await client.fetchReviewsForPR(pr.number);
    return { pr, reviews };
  });

  return results;
}

export function sinceDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}
