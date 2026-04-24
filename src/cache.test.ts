import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  getCacheKey,
  readCache,
  writeCache,
  clearCache,
  cacheStats,
} from "./cache";

const TEST_CACHE_DIR = path.join(os.tmpdir(), ".gh-review-stats-test", "cache");

// Redirect cache to a temp directory for tests
jest.mock("os", () => ({
  ...jest.requireActual("os"),
  homedir: () => path.join(require("os").tmpdir(), ".gh-review-stats-test"),
}));

afterEach(() => {
  clearCache();
  if (fs.existsSync(TEST_CACHE_DIR)) {
    fs.rmdirSync(TEST_CACHE_DIR, { recursive: true } as any);
  }
});

describe("getCacheKey", () => {
  it("returns a stable base64 key for the same inputs", () => {
    const key1 = getCacheKey("owner/repo", "2024-01-01");
    const key2 = getCacheKey("owner/repo", "2024-01-01");
    expect(key1).toBe(key2);
  });

  it("returns different keys for different repos", () => {
    const key1 = getCacheKey("owner/repo-a", "2024-01-01");
    const key2 = getCacheKey("owner/repo-b", "2024-01-01");
    expect(key1).not.toBe(key2);
  });

  it("does not contain '=' padding characters", () => {
    const key = getCacheKey("owner/repo", "2024-01-01");
    expect(key).not.toContain("=");
  });
});

describe("writeCache / readCache", () => {
  it("stores and retrieves data", () => {
    const key = getCacheKey("owner/repo", "2024-03-01");
    const payload = { prs: 42, reviews: 10 };
    writeCache(key, payload);
    const result = readCache<typeof payload>(key);
    expect(result).toEqual(payload);
  });

  it("returns null for a missing key", () => {
    const result = readCache("nonexistent-key-xyz");
    expect(result).toBeNull();
  });

  it("returns null for expired entries", () => {
    const key = getCacheKey("owner/repo", "2024-04-01");
    writeCache(key, { value: "stale" });
    // Manually backdate the file
    const filePath = path.join(TEST_CACHE_DIR, `${key}.json`);
    const entry = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    entry.timestamp = Date.now() - 20 * 60 * 1000; // 20 min ago
    fs.writeFileSync(filePath, JSON.stringify(entry));
    expect(readCache(key)).toBeNull();
  });
});

describe("cacheStats", () => {
  it("reports zero when cache is empty", () => {
    const stats = cacheStats();
    expect(stats.count).toBe(0);
    expect(stats.totalBytes).toBe(0);
  });

  it("counts written entries", () => {
    writeCache(getCacheKey("r1", "d1"), { a: 1 });
    writeCache(getCacheKey("r2", "d2"), { b: 2 });
    const stats = cacheStats();
    expect(stats.count).toBe(2);
    expect(stats.totalBytes).toBeGreaterThan(0);
  });
});
