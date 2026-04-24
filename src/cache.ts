import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const CACHE_DIR = path.join(os.homedir(), ".gh-review-stats", "cache");
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

export function getCacheKey(repo: string, since: string): string {
  return Buffer.from(`${repo}::${since}`).toString("base64").replace(/=/g, "");
}

export function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function readCache<T>(key: string): T | null {
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const entry: CacheEntry<T> = JSON.parse(raw);
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL_MS) {
      fs.unlinkSync(filePath);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void {
  ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  const entry: CacheEntry<T> = { timestamp: Date.now(), data };
  fs.writeFileSync(filePath, JSON.stringify(entry), "utf-8");
}

export function clearCache(): void {
  if (!fs.existsSync(CACHE_DIR)) return;
  const files = fs.readdirSync(CACHE_DIR);
  for (const file of files) {
    fs.unlinkSync(path.join(CACHE_DIR, file));
  }
}

export function cacheStats(): { count: number; totalBytes: number } {
  if (!fs.existsSync(CACHE_DIR)) return { count: 0, totalBytes: 0 };
  const files = fs.readdirSync(CACHE_DIR);
  let totalBytes = 0;
  for (const file of files) {
    const stat = fs.statSync(path.join(CACHE_DIR, file));
    totalBytes += stat.size;
  }
  return { count: files.length, totalBytes };
}
