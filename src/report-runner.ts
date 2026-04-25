import { loadConfig } from './config';
import { parseFlags } from './cli-flags';
import { sinceDate } from './fetcher';
import { computeReviewerStats, aggregateTeamStats } from './stats';
import { getCacheKey, readCache, writeCache } from './cache';
import { writeOutput } from './output';
import { buildReport, ReportData } from './report';

export interface RunOptions {
  argv: string[];
  cwd?: string;
}

export async function runReport(opts: RunOptions): Promise<void> {
  const flags = parseFlags(opts.argv);
  const config = await loadConfig(opts.cwd);

  const repo = flags.repo ?? config.defaultRepo;
  if (!repo) {
    throw new Error('No repository specified. Use --repo owner/name or set defaultRepo in config.');
  }

  const since = sinceDate(flags.days ?? config.defaultDays ?? 30);
  const format = flags.format ?? config.defaultFormat ?? 'table';
  const topN = flags.topN ?? config.topN;
  const minReviews = flags.minReviews;

  const cacheKey = getCacheKey(repo, since);
  let reviewers = await readCache<ReturnType<typeof computeReviewerStats>>(cacheKey);

  if (!reviewers) {
    const { fetchPullRequests } = await import('./github');
    const prs = await fetchPullRequests(repo, since);
    reviewers = computeReviewerStats(prs);
    await writeCache(cacheKey, reviewers);
  }

  const team = flags.team ? aggregateTeamStats(reviewers, flags.team) : undefined;

  const data: ReportData = {
    reviewers,
    team,
    repo,
    since,
    generatedAt: new Date().toISOString(),
  };

  const output = buildReport(data, { format: format as any, topN, minReviews });

  if (flags.output) {
    await writeOutput(flags.output, output);
    console.log(`Report written to ${flags.output}`);
  } else {
    console.log(output);
  }
}
