import { parseFlags, CLIFlags } from "./cli-flags";

describe("parseFlags", () => {
  it("returns defaults when no args provided", () => {
    const flags = parseFlags([]);
    expect(flags.format).toBe("table");
    expect(flags.noColor).toBe(false);
    expect(flags.noCache).toBe(false);
    expect(flags.clearCache).toBe(false);
    expect(flags.limit).toBe(100);
  });

  it("parses --repo flag", () => {
    const flags = parseFlags(["--repo", "owner/repo"]);
    expect(flags.repo).toBe("owner/repo");
  });

  it("parses -r shorthand", () => {
    const flags = parseFlags(["-r", "owner/repo"]);
    expect(flags.repo).toBe("owner/repo");
  });

  it("parses --format json", () => {
    const flags = parseFlags(["--format", "json"]);
    expect(flags.format).toBe("json");
  });

  it("parses --format csv", () => {
    const flags = parseFlags(["--format", "csv"]);
    expect(flags.format).toBe("csv");
  });

  it("throws on invalid format", () => {
    expect(() => parseFlags(["--format", "xml"])).toThrow(/Invalid format/);
  });

  it("parses --no-color flag", () => {
    const flags = parseFlags(["--no-color"]);
    expect(flags.noColor).toBe(true);
  });

  it("parses --no-cache flag", () => {
    const flags = parseFlags(["--no-cache"]);
    expect(flags.noCache).toBe(true);
  });

  it("parses --clear-cache flag", () => {
    const flags = parseFlags(["--clear-cache"]);
    expect(flags.clearCache).toBe(true);
  });

  it("parses --team with comma-separated logins", () => {
    const flags = parseFlags(["--team", "alice,bob, carol"]);
    expect(flags.team).toEqual(["alice", "bob", "carol"]);
  });

  it("parses --limit", () => {
    const flags = parseFlags(["--limit", "50"]);
    expect(flags.limit).toBe(50);
  });

  it("throws on invalid limit", () => {
    expect(() => parseFlags(["--limit", "abc"])).toThrow(/Invalid limit/);
  });

  it("parses --out flag", () => {
    const flags = parseFlags(["--out", "report.json"]);
    expect(flags.outFile).toBe("report.json");
  });

  it("parses --since flag", () => {
    const flags = parseFlags(["--since", "2024-01-01"]);
    expect(flags.since).toBe("2024-01-01");
  });
});
