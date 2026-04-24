import { computeReviewerStats, aggregateTeamStats } from "./stats";
import { PullRequest, Review } from "./github";

const makePR = (number: number, created_at: string): PullRequest => ({
  number,
  title: `PR #${number}`,
  user: { login: "author" },
  created_at,
  merged_at: null,
  state: "closed",
});

const makeReview = (
  login: string,
  state: string,
  submitted_at: string
): Review => ({
  id: Math.random(),
  user: { login },
  state,
  submitted_at,
  body: "",
});

describe("computeReviewerStats", () => {
  it("returns empty map for no reviews", () => {
    const result = computeReviewerStats([], "2024-01-01T00:00:00Z");
    expect(result.size).toBe(0);
  });

  it("counts review states correctly", () => {
    const reviews = [
      makeReview("alice", "APPROVED", "2024-01-01T02:00:00Z"),
      makeReview("alice", "COMMENTED", "2024-01-01T03:00:00Z"),
      makeReview("bob", "CHANGES_REQUESTED", "2024-01-01T01:00:00Z"),
    ];
    const result = computeReviewerStats(reviews, "2024-01-01T00:00:00Z");
    expect(result.get("alice")?.totalReviews).toBe(2);
    expect(result.get("alice")?.approved).toBe(1);
    expect(result.get("alice")?.commented).toBe(1);
    expect(result.get("bob")?.changesRequested).toBe(1);
  });

  it("calculates avgTimeToReviewHours", () => {
    const reviews = [
      makeReview("alice", "APPROVED", "2024-01-01T04:00:00Z"),
    ];
    const result = computeReviewerStats(reviews, "2024-01-01T00:00:00Z");
    expect(result.get("alice")?.avgTimeToReviewHours).toBeCloseTo(4);
  });
});

describe("aggregateTeamStats", () => {
  it("returns zero stats for empty input", () => {
    const stats = aggregateTeamStats([], new Map());
    expect(stats.totalPRs).toBe(0);
    expect(stats.totalReviews).toBe(0);
    expect(stats.mostActiveReviewer).toBeNull();
    expect(stats.avgReviewsPerPR).toBe(0);
  });

  it("aggregates reviewers across multiple PRs", () => {
    const prs = [
      makePR(1, "2024-01-01T00:00:00Z"),
      makePR(2, "2024-01-02T00:00:00Z"),
    ];
    const allReviews = new Map([
      [1, [makeReview("alice", "APPROVED", "2024-01-01T02:00:00Z")]],
      [2, [
        makeReview("alice", "COMMENTED", "2024-01-02T01:00:00Z"),
        makeReview("bob", "APPROVED", "2024-01-02T03:00:00Z"),
      ]],
    ]);
    const stats = aggregateTeamStats(prs, allReviews);
    expect(stats.totalPRs).toBe(2);
    expect(stats.totalReviews).toBe(3);
    expect(stats.mostActiveReviewer).toBe("alice");
    expect(stats.avgReviewsPerPR).toBeCloseTo(1.5);
    expect(stats.reviewers).toHaveLength(2);
  });
});
