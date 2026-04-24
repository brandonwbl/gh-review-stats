import * as fs from "fs";
import * as path from "path";
import { formatTeamStats, formatJSON } from "./formatter";
import type { ReviewerStats, TeamStats } from "./stats";

export type OutputFormat = "table" | "json" | "csv";

export interface OutputOptions {
  format: OutputFormat;
  outFile?: string;
  color?: boolean;
}

export function formatCSV(
  reviewers: ReviewerStats[],
  team: TeamStats
): string {
  const header = "login,reviews,approvals,changes_requested,comments,avg_turnaround_hours";
  const rows = reviewers.map((r) =>
    [
      r.login,
      r.totalReviews,
      r.approvals,
      r.changesRequested,
      r.comments,
      r.avgTurnaroundHours.toFixed(2),
    ].join(",")
  );
  const summary = `\n# Team summary: total_reviews=${team.totalReviews}, unique_reviewers=${team.uniqueReviewers}, avg_turnaround_hours=${team.avgTurnaroundHours.toFixed(2)}`;
  return [header, ...rows, summary].join("\n");
}

export function renderOutput(
  reviewers: ReviewerStats[],
  team: TeamStats,
  opts: OutputOptions
): string {
  switch (opts.format) {
    case "json":
      return formatJSON(reviewers, team);
    case "csv":
      return formatCSV(reviewers, team);
    case "table":
    default:
      return formatTeamStats(reviewers, team, opts.color ?? true);
  }
}

export function writeOutput(
  content: string,
  outFile?: string
): void {
  if (outFile) {
    const dir = path.dirname(outFile);
    if (dir && dir !== ".") {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outFile, content, "utf-8");
    console.error(`Output written to ${outFile}`);
  } else {
    process.stdout.write(content + "\n");
  }
}
