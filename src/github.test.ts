import { GitHubClient, PullRequest, Review } from "./github";

const mockListPulls = jest.fn();
const mockListReviews = jest.fn();

jest.mock("@octokit/rest", () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    pulls: {
      list: mockListPulls,
      listReviews: mockListReviews,
    },
  })),
}));

const clientOptions = {
  token: "test-token",
  owner: "acme",
  repo: "my-repo",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GitHubClient.fetchMergedPullRequests", () => {
  it("returns merged PRs on or after the given date", async () => {
    const since = new Date("2024-01-01T00:00:00Z");

    mockListPulls.mockResolvedValueOnce({
      data: [
        {
          number: 42,
          title: "feat: add thing",
          user: { login: "alice" },
          created_at: "2024-01-05T10:00:00Z",
          merged_at: "2024-01-06T12:00:00Z",
          updated_at: "2024-01-06T12:00:00Z",
          state: "closed",
        },
        {
          number: 41,
          title: "fix: old bug",
          user: { login: "bob" },
          created_at: "2023-12-01T10:00:00Z",
          merged_at: "2023-12-02T12:00:00Z",
          updated_at: "2023-12-02T12:00:00Z",
          state: "closed",
        },
      ],
    });

    const client = new GitHubClient(clientOptions);
    const prs = await client.fetchMergedPullRequests(since);

    expect(prs).toHaveLength(1);
    expect(prs[0].number).toBe(42);
    expect(prs[0].author).toBe("alice");
  });

  it("returns empty array when no PRs match", async () => {
    mockListPulls.mockResolvedValueOnce({ data: [] });
    const client = new GitHubClient(clientOptions);
    const prs = await client.fetchMergedPullRequests(new Date());
    expect(prs).toEqual([]);
  });
});

describe("GitHubClient.fetchReviewsForPR", () => {
  it("maps review data correctly", async () => {
    mockListReviews.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          user: { login: "carol" },
          state: "APPROVED",
          submitted_at: "2024-01-06T11:00:00Z",
        },
      ],
    });

    const client = new GitHubClient(clientOptions);
    const reviews = await client.fetchReviewsForPR(42);

    expect(reviews).toHaveLength(1);
    expect(reviews[0]).toMatchObject<Review>({
      id: 1,
      pullNumber: 42,
      reviewer: "carol",
      state: "APPROVED",
      submittedAt: "2024-01-06T11:00:00Z",
    });
  });
});
