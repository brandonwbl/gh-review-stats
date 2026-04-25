import { ReviewerStats } from "./stats";

export interface LeaderboardEntry {
  rank: number;
  login: string;
  reviewCount: number;
  avgTurnaroundHours: number;
  score: number;
}

/**
 * Compute a composite score for ranking reviewers.
 * Score = reviewCount * 10 - avgTurnaroundHours * 0.5
 * Higher is better: rewards volume, penalises slow turnaround.
 */
export function computeScore(
  reviewCount: number,
  avgTurnaroundHours: number
): number {
  return Math.round(reviewCount * 10 - avgTurnaroundHours * 0.5);
}

/**
 * Build a ranked leaderboard from reviewer stats.
 * Ties in score are broken alphabetically by login.
 */
export function buildLeaderboard(
  stats: ReviewerStats[],
  topN?: number
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = stats.map((s) => ({
    rank: 0,
    login: s.login,
    reviewCount: s.reviewCount,
    avgTurnaroundHours: s.avgTurnaroundHours,
    score: computeScore(s.reviewCount, s.avgTurnaroundHours),
  }));

  entries.sort((a, b) =>
    b.score !== a.score
      ? b.score - a.score
      : a.login.localeCompare(b.login)
  );

  const limited = topN != null ? entries.slice(0, topN) : entries;

  return limited.map((e, i) => ({ ...e, rank: i + 1 }));
}

/**
 * Format the leaderboard as a plain-text table string.
 */
export function formatLeaderboard(entries: LeaderboardEntry[]): string {
  if (entries.length === 0) return "No reviewers found.";

  const header = `${"Rank".padEnd(6)}${"Login".padEnd(22)}${"Reviews".padEnd(10)}${"Avg hrs".padEnd(10)}Score`;
  const divider = "-".repeat(header.length);

  const rows = entries.map(
    (e) =>
      `${String(e.rank).padEnd(6)}${e.login.padEnd(22)}${String(e.reviewCount).padEnd(10)}${e.avgTurnaroundHours.toFixed(1).padEnd(10)}${e.score}`
  );

  return [header, divider, ...rows].join("\n");
}
