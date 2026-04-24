import { TeamStats, ReviewerStats } from "./stats";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";

function pad(str: string, len: number): string {
  return str.length >= len ? str : str + " ".repeat(len - str.length);
}

function formatHours(hours: number | null): string {
  if (hours === null) return DIM + "N/A" + RESET;
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}

function reviewerRow(r: ReviewerStats): string {
  const name = pad(r.login, 20);
  const total = pad(String(r.totalReviews), 8);
  const approved = pad(GREEN + r.approved + RESET, 16);
  const changes = pad(YELLOW + r.changesRequested + RESET, 24);
  const commented = pad(String(r.commented), 10);
  const avgTime = formatHours(r.avgTimeToReviewHours);
  return `  ${name}${total}${approved}${changes}${commented}${avgTime}`;
}

export function formatTeamStats(stats: TeamStats, repo: string): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(`${BOLD}${CYAN}PR Review Stats — ${repo}${RESET}`);
  lines.push(DIM + "─".repeat(60) + RESET);
  lines.push(`  Total PRs analyzed : ${BOLD}${stats.totalPRs}${RESET}`);
  lines.push(`  Total reviews      : ${BOLD}${stats.totalReviews}${RESET}`);
  lines.push(`  Avg reviews/PR     : ${BOLD}${stats.avgReviewsPerPR.toFixed(2)}${RESET}`);
  if (stats.mostActiveReviewer) {
    lines.push(`  Most active        : ${BOLD}${GREEN}${stats.mostActiveReviewer}${RESET}`);
  }
  lines.push("");

  if (stats.reviewers.length === 0) {
    lines.push(DIM + "  No reviewer data found." + RESET);
  } else {
    const header =
      `  ${pad("Reviewer", 20)}${pad("Reviews", 8)}` +
      `${pad("Approved", 16)}${pad("Changes Req.", 24)}` +
      `${pad("Commented", 10)}Avg Time`;
    lines.push(BOLD + header + RESET);
    lines.push(DIM + "  " + "─".repeat(56) + RESET);
    for (const r of stats.reviewers) {
      lines.push(reviewerRow(r));
    }
  }

  lines.push("");
  return lines.join("\n");
}

export function formatJSON(stats: TeamStats): string {
  return JSON.stringify(stats, null, 2);
}
