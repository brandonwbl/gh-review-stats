import { formatCSV, renderOutput, OutputOptions } from "./output";
import type { ReviewerStats, TeamStats } from "./stats";

const sampleReviewers: ReviewerStats[] = [
  {
    login: "alice",
    totalReviews: 10,
    approvals: 7,
    changesRequested: 2,
    comments: 1,
    avgTurnaroundHours: 3.5,
  },
  {
    login: "bob",
    totalReviews: 5,
    approvals: 3,
    changesRequested: 1,
    comments: 1,
    avgTurnaroundHours: 6.0,
  },
];

const sampleTeam: TeamStats = {
  totalReviews: 15,
  uniqueReviewers: 2,
  avgTurnaroundHours: 4.5,
  topReviewer: "alice",
};

describe("formatCSV", () => {
  it("includes a header row", () => {
    const csv = formatCSV(sampleReviewers, sampleTeam);
    expect(csv).toMatch(/^login,reviews,approvals/);
  });

  it("includes a row per reviewer", () => {
    const csv = formatCSV(sampleReviewers, sampleTeam);
    expect(csv).toContain("alice,10,7,2,1,3.50");
    expect(csv).toContain("bob,5,3,1,1,6.00");
  });

  it("appends a team summary comment line", () => {
    const csv = formatCSV(sampleReviewers, sampleTeam);
    expect(csv).toContain("total_reviews=15");
    expect(csv).toContain("unique_reviewers=2");
  });
});

describe("renderOutput", () => {
  it("returns JSON when format is json", () => {
    const opts: OutputOptions = { format: "json", color: false };
    const result = renderOutput(sampleReviewers, sampleTeam, opts);
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty("reviewers");
    expect(parsed).toHaveProperty("team");
  });

  it("returns CSV when format is csv", () => {
    const opts: OutputOptions = { format: "csv" };
    const result = renderOutput(sampleReviewers, sampleTeam, opts);
    expect(result).toMatch(/^login,reviews/);
  });

  it("returns table string when format is table", () => {
    const opts: OutputOptions = { format: "table", color: false };
    const result = renderOutput(sampleReviewers, sampleTeam, opts);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
