import { filterReviewers, buildReport, ReportData, ReportOptions } from './report';
import { ReviewerStats } from './stats';

const sampleReviewers: ReviewerStats[] = [
  { login: 'alice', totalReviews: 15, approved: 10, changesRequested: 3, avgTurnaroundHours: 4.2 },
  { login: 'bob', totalReviews: 8, approved: 6, changesRequested: 1, avgTurnaroundHours: 7.1 },
  { login: 'carol', totalReviews: 3, approved: 2, changesRequested: 1, avgTurnaroundHours: 12.0 },
  { login: 'dave', totalReviews: 20, approved: 14, changesRequested: 5, avgTurnaroundHours: 2.8 },
];

const baseData: ReportData = {
  reviewers: sampleReviewers,
  repo: 'org/repo',
  since: '2024-01-01',
  generatedAt: '2024-06-01T00:00:00Z',
};

describe('filterReviewers', () => {
  it('returns all reviewers sorted by totalReviews desc when no filters', () => {
    const result = filterReviewers(sampleReviewers, {});
    expect(result[0].login).toBe('dave');
    expect(result[1].login).toBe('alice');
  });

  it('applies topN filter', () => {
    const result = filterReviewers(sampleReviewers, { topN: 2 });
    expect(result).toHaveLength(2);
    expect(result[0].login).toBe('dave');
  });

  it('applies minReviews filter', () => {
    const result = filterReviewers(sampleReviewers, { minReviews: 8 });
    expect(result.every((r) => r.totalReviews >= 8)).toBe(true);
    expect(result).toHaveLength(3);
  });

  it('applies both topN and minReviews', () => {
    const result = filterReviewers(sampleReviewers, { topN: 2, minReviews: 8 });
    expect(result).toHaveLength(2);
  });
});

describe('buildReport', () => {
  it('returns valid JSON string for json format', () => {
    const opts: ReportOptions = { format: 'json' };
    const result = buildReport(baseData, opts);
    const parsed = JSON.parse(result);
    expect(parsed.repo).toBe('org/repo');
    expect(Array.isArray(parsed.reviewers)).toBe(true);
  });

  it('includes repo and since in table output', () => {
    const opts: ReportOptions = { format: 'table' };
    const result = buildReport(baseData, opts);
    expect(result).toContain('org/repo');
    expect(result).toContain('2024-01-01');
  });

  it('respects topN in table output', () => {
    const opts: ReportOptions = { format: 'table', topN: 1 };
    const result = buildReport(baseData, opts);
    expect(result).toContain('dave');
    expect(result).not.toContain('alice');
  });

  it('returns csv format string', () => {
    const opts: ReportOptions = { format: 'csv' };
    const result = buildReport(baseData, opts);
    expect(typeof result).toBe('string');
  });
});
