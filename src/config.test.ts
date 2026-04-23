import { loadConfig } from "./config";
import { execSync } from "child_process";

jest.mock("child_process", () => ({
  execSync: jest.fn(),
}));

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe("loadConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GH_HOST;
  });

  it("parses an explicit owner/repo argument", () => {
    mockExecSync.mockReturnValue("ghp_testtoken123\n" as any);
    const config = loadConfig("myorg/myrepo");
    expect(config.owner).toBe("myorg");
    expect(config.repo).toBe("myrepo");
  });

  it("resolves token from gh auth token", () => {
    mockExecSync.mockReturnValue("ghp_abc456\n" as any);
    const config = loadConfig("owner/repo");
    expect(config.token).toBe("ghp_abc456");
  });

  it("uses default GitHub API base URL", () => {
    mockExecSync.mockReturnValue("ghp_token\n" as any);
    const config = loadConfig("owner/repo");
    expect(config.baseUrl).toBe("https://api.github.com");
  });

  it("uses GH_HOST env variable for enterprise base URL", () => {
    process.env.GH_HOST = "github.mycompany.com";
    mockExecSync.mockReturnValue("ghp_token\n" as any);
    const config = loadConfig("owner/repo");
    expect(config.baseUrl).toBe("https://github.mycompany.com/api/v3");
  });

  it("throws on invalid repo format", () => {
    mockExecSync.mockReturnValue("ghp_token\n" as any);
    expect(() => loadConfig("invalid-repo")).toThrow(
      'Invalid repository format: "invalid-repo"'
    );
  });

  it("falls back to git remote when no repo arg is given", () => {
    mockExecSync
      .mockReturnValueOnce("ghp_token\n" as any)
      .mockReturnValueOnce("https://github.com/fallbackorg/fallbackrepo.git\n" as any);

    // Re-order: first call is token, second is remote — swap mock order
    mockExecSync
      .mockReset()
      .mockReturnValueOnce("https://github.com/fallbackorg/fallbackrepo.git\n" as any)
      .mockReturnValueOnce("ghp_token\n" as any);

    const config = loadConfig();
    expect(config.owner).toBe("fallbackorg");
    expect(config.repo).toBe("fallbackrepo");
  });
});
