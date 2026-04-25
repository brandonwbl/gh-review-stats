import { ReviewerStats, TeamStats } from './stats';
import { formatTeamStats, formatJSON, reviewerRow, pad, formatHours } from './formatter';
import { formatCSV, renderOutput } from './output';

export interface ReportOptions {
  format: 'table' | 'json' | 'csv';
  team?: string;
  topN?: number;
  minReviews?: number;
}

export interface ReportData {
  reviewers: ReviewerStats[];
  team?: TeamStats;
  generatedAt: string;
  repo: string;
  since: string;
}

export function filterReviewers(
  reviewers: ReviewerStats[],
  opts: Pick<ReportOptions, 'topN' | 'minReviews'>
): ReviewerStats[] {
  let result = [...reviewers];
  if (opts.minReviews !== undefined) {
    result = result.filter((r) => r.totalReviews >= opts.minReviews!);
  }
  result.sort((a, b) => b.totalReviews - a.totalReviews);
  if (opts.topN !== undefined) {
    result = result.slice(0, opts.topN);
  }
  return result;
}

export function buildReport(data: ReportData, opts: ReportOptions): string {
  const filtered = filterReviewers(data.reviewers, opts);

  if (opts.format === 'json') {
    return formatJSON({
      repo: data.repo,
      since: data.since,
      generatedAt: data.generatedAt,
      reviewers: filtered,
      team: data.team,
    });
  }

  if (opts.format === 'csv') {
    return renderOutput(filtered, 'csv');
  }

  // table format
  const header = `Repository: ${data.repo}  |  Since: ${data.since}  |  Generated: ${data.generatedAt}`;
  const divider = '-'.repeat(72);
  const tableRows = filtered.map((r) => reviewerRow(r)).join('\n');
  const columnHeader =
    pad('Reviewer', 24) +
    pad('Reviews', 10) +
    pad('Approved', 10) +
    pad('Changes', 10) +
    pad('Avg Time', 12);

  let output = [header, divider, columnHeader, divider, tableRows].join('\n');

  if (data.team) {
    output += '\n\n' + formatTeamStats(data.team);
  }

  return output;
}
