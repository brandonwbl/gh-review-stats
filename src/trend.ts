import { ReviewerStats } from "./stats";

export interface WeeklyBucket {
  week: string; // ISO date of Monday
  reviewCount: number;
  avgTurnaroundHours: number;
}

export interface TrendReport {
  reviewer: string;
  buckets: WeeklyBucket[];
  slope: number; // linear regression slope of reviewCount over weeks
}

function getMondayISO(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function bucketByWeek(
  reviews: Array<{ submittedAt: string; turnaroundHours: number }>
): WeeklyBucket[] {
  const map = new Map<string, { count: number; totalHours: number }>();

  for (const r of reviews) {
    const week = getMondayISO(new Date(r.submittedAt));
    const entry = map.get(week) ?? { count: 0, totalHours: 0 };
    entry.count += 1;
    entry.totalHours += r.turnaroundHours;
    map.set(week, entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, { count, totalHours }]) => ({
      week,
      reviewCount: count,
      avgTurnaroundHours: count > 0 ? Math.round((totalHours / count) * 10) / 10 : 0,
    }));
}

export function linearSlope(buckets: WeeklyBucket[]): number {
  const n = buckets.length;
  if (n < 2) return 0;
  const xs = buckets.map((_, i) => i);
  const ys = buckets.map((b) => b.reviewCount);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0);
  const den = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
  return den === 0 ? 0 : Math.round((num / den) * 100) / 100;
}

export function buildTrendReports(
  statsMap: Map<string, ReviewerStats>,
  reviewEvents: Map<string, Array<{ submittedAt: string; turnaroundHours: number }>>
): TrendReport[] {
  const reports: TrendReport[] = [];
  for (const [reviewer] of statsMap) {
    const events = reviewEvents.get(reviewer) ?? [];
    const buckets = bucketByWeek(events);
    reports.push({ reviewer, buckets, slope: linearSlope(buckets) });
  }
  return reports.sort((a, b) => b.slope - a.slope);
}
