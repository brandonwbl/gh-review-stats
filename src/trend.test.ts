import { bucketByWeek, linearSlope, buildTrendReports, TrendReport } from "./trend";
import { ReviewerStats } from "./stats";

const makeEvent = (submittedAt: string, turnaroundHours: number) => ({
  submittedAt,
  turnaroundHours,
});

describe("bucketByWeek", () => {
  it("groups reviews into weekly buckets starting on Monday", () => {
    const events = [
      makeEvent("2024-03-04T10:00:00Z", 2),  // Monday week
      makeEvent("2024-03-06T10:00:00Z", 4),  // same week
      makeEvent("2024-03-11T10:00:00Z", 6),  // next Monday
    ];
    const buckets = bucketByWeek(events);
    expect(buckets).toHaveLength(2);
    expect(buckets[0].week).toBe("2024-03-04");
    expect(buckets[0].reviewCount).toBe(2);
    expect(buckets[0].avgTurnaroundHours).toBe(3);
    expect(buckets[1].week).toBe("2024-03-11");
    expect(buckets[1].reviewCount).toBe(1);
  });

  it("returns empty array for no events", () => {
    expect(bucketByWeek([])).toEqual([]);
  });

  it("sorts buckets chronologically", () => {
    const events = [
      makeEvent("2024-03-18T00:00:00Z", 1),
      makeEvent("2024-03-04T00:00:00Z", 1),
    ];
    const buckets = bucketByWeek(events);
    expect(buckets[0].week).toBe("2024-03-04");
    expect(buckets[1].week).toBe("2024-03-18");
  });
});

describe("linearSlope", () => {
  it("returns 0 for fewer than 2 buckets", () => {
    expect(linearSlope([])).toBe(0);
    expect(linearSlope([{ week: "2024-01-01", reviewCount: 5, avgTurnaroundHours: 2 }])).toBe(0);
  });

  it("computes positive slope for increasing counts", () => {
    const buckets = [
      { week: "2024-01-01", reviewCount: 1, avgTurnaroundHours: 1 },
      { week: "2024-01-08", reviewCount: 3, avgTurnaroundHours: 1 },
      { week: "2024-01-15", reviewCount: 5, avgTurnaroundHours: 1 },
    ];
    expect(linearSlope(buckets)).toBeGreaterThan(0);
  });

  it("computes negative slope for decreasing counts", () => {
    const buckets = [
      { week: "2024-01-01", reviewCount: 10, avgTurnaroundHours: 1 },
      { week: "2024-01-08", reviewCount: 5, avgTurnaroundHours: 1 },
      { week: "2024-01-15", reviewCount: 1, avgTurnaroundHours: 1 },
    ];
    expect(linearSlope(buckets)).toBeLessThan(0);
  });
});

describe("buildTrendReports", () => {
  it("builds a trend report per reviewer sorted by slope descending", () => {
    const statsMap = new Map<string, ReviewerStats>([
      ["alice", { reviewer: "alice", reviewCount: 5, avgTurnaroundHours: 3, lgtmCount: 2, changesRequestedCount: 1 }],
      ["bob",   { reviewer: "bob",   reviewCount: 3, avgTurnaroundHours: 5, lgtmCount: 1, changesRequestedCount: 2 }],
    ]);
    const reviewEvents = new Map([
      ["alice", [
        makeEvent("2024-03-04T00:00:00Z", 2),
        makeEvent("2024-03-11T00:00:00Z", 2),
        makeEvent("2024-03-11T06:00:00Z", 4),
      ]],
      ["bob", [makeEvent("2024-03-04T00:00:00Z", 5)]],
    ]);
    const reports = buildTrendReports(statsMap, reviewEvents);
    expect(reports).toHaveLength(2);
    expect(reports[0].reviewer).toBe("alice"); // positive slope
    expect(reports[0].buckets).toHaveLength(2);
  });

  it("handles reviewer with no events", () => {
    const statsMap = new Map<string, ReviewerStats>([
      ["ghost", { reviewer: "ghost", reviewCount: 0, avgTurnaroundHours: 0, lgtmCount: 0, changesRequestedCount: 0 }],
    ]);
    const reports = buildTrendReports(statsMap, new Map());
    expect(reports[0].buckets).toEqual([]);
    expect(reports[0].slope).toBe(0);
  });
});
