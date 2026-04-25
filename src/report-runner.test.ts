import { runReport } from './report-runner';

jest.mock('./config', () => ({
  loadConfig: jest.fn().mockResolvedValue({ defaultRepo: 'org/mock-repo', defaultDays: 7 }),
}));

jest.mock('./fetcher', () => ({
  sinceDate: jest.fn().mockReturnValue('2024-05-25'),
}));

jest.mock('./cache', () => ({
  getCacheKey: jest.fn().mockReturnValue('org/mock-repo::2024-05-25'),
  readCache: jest.fn().mockResolvedValue(null),
  writeCache: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./github', () => ({
  fetchPullRequests: jest.fn().mockResolvedValue([]),
}));

jest.mock('./stats', () => ({
  computeReviewerStats: jest.fn().mockReturnValue([]),
  aggregateTeamStats: jest.fn().mockReturnValue({ name: 'team', members: [], totalReviews: 0 }),
}));

jest.mock('./output', () => ({
  writeOutput: jest.fn().mockResolvedValue(undefined),
}));

describe('runReport', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('runs without error using default config repo', async () => {
    await expect(runReport({ argv: [] })).resolves.not.toThrow();
  });

  it('throws when no repo is available', async () => {
    const { loadConfig } = require('./config');
    loadConfig.mockResolvedValueOnce({});
    await expect(runReport({ argv: [] })).rejects.toThrow('No repository specified');
  });

  it('uses cached reviewers when cache hit', async () => {
    const { readCache } = require('./cache');
    const { fetchPullRequests } = require('./github');
    readCache.mockResolvedValueOnce([{ login: 'alice', totalReviews: 5 }]);
    await runReport({ argv: [] });
    expect(fetchPullRequests).not.toHaveBeenCalled();
  });

  it('writes to file when --output flag is set', async () => {
    const { writeOutput } = require('./output');
    await runReport({ argv: ['--output', 'report.txt'] });
    expect(writeOutput).toHaveBeenCalledWith('report.txt', expect.any(String));
  });

  it('prints to console when no --output flag', async () => {
    await runReport({ argv: [] });
    expect(consoleSpy).toHaveBeenCalled();
  });
});
