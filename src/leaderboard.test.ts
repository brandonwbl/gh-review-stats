import { describe, it, expect } from "vitest";
import {
  computeScore,
  buildLeaderboard,
  formatLeaderboard,
} from "./leaderboard";
import { ReviewerStats } from "./stats";

const makeStats = (
  login: string,
  reviewCount: number,
  avgTurnaroundHours: number
): ReviewerStats => ({ login, reviewCount, avgTurnaroundHours, totalPRs: reviewCount });

describe("computeScore", () => {
  it("rewards high review count", () => {
    expect(computeScore(10, 0)).toBe(100);
  });

  it("penalises slow turnaround", () => {
    expect(computeScore(10, 20)).toBe(90); // 100 - 10
  });

  it("returns 0 for no reviews", () => {
    expect(computeScore(0, 0)).toBe(0);
  });
});

describe("buildLeaderboard", () => {
  const stats: ReviewerStats[] = [
    makeStats("alice", 5, 4),
    makeStats("bob", 10, 8),
    makeStats("carol", 10, 8),
  ];

  it("ranks by score descending", () => {
    const board = buildLeaderboard(stats);
    expect(board[0].login).toBe("bob");
    expect(board[0].rank).toBe(1);
  });

  it("breaks ties alphabetically", () => {
    const board = buildLeaderboard(stats);
    expect(board[0].login).toBe("bob");
    expect(board[1].login).toBe("carol");
  });

  it("respects topN limit", () => {
    const board = buildLeaderboard(stats, 2);
    expect(board).toHaveLength(2);
  });

  it("assigns sequential ranks", () => {
    const board = buildLeaderboard(stats);
    board.forEach((e, i) => expect(e.rank).toBe(i + 1));
  });

  it("returns empty array for empty input", () => {
    expect(buildLeaderboard([])).toEqual([]);
  });
});

describe("formatLeaderboard", () => {
  it("returns fallback message for empty list", () => {
    expect(formatLeaderboard([])).toBe("No reviewers found.");
  });

  it("includes header and all logins", () => {
    const board = buildLeaderboard([
      makeStats("alice", 5, 4),
      makeStats("bob", 10, 8),
    ]);
    const output = formatLeaderboard(board);
    expect(output).toContain("Rank");
    expect(output).toContain("alice");
    expect(output).toContain("bob");
  });

  it("contains a divider line", () => {
    const board = buildLeaderboard([makeStats("alice", 3, 2)]);
    const lines = formatLeaderboard(board).split("\n");
    expect(lines.some((l) => /^-+$/.test(l))).toBe(true);
  });
});
