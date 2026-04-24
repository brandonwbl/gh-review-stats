import type { OutputFormat } from "./output";

export interface CLIFlags {
  repo?: string;
  since?: string;
  format: OutputFormat;
  outFile?: string;
  noColor: boolean;
  noCache: boolean;
  clearCache: boolean;
  team?: string[];
  limit: number;
}

const VALID_FORMATS: OutputFormat[] = ["table", "json", "csv"];

export function parseFlags(argv: string[]): CLIFlags {
  const flags: CLIFlags = {
    format: "table",
    noColor: false,
    noCache: false,
    clearCache: false,
    limit: 100,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--repo" || arg === "-r") {
      flags.repo = next;
      i++;
    } else if (arg === "--since" || arg === "-s") {
      flags.since = next;
      i++;
    } else if (arg === "--format" || arg === "-f") {
      if (!VALID_FORMATS.includes(next as OutputFormat)) {
        throw new Error(`Invalid format "${next}". Must be one of: ${VALID_FORMATS.join(", ")}`);
      }
      flags.format = next as OutputFormat;
      i++;
    } else if (arg === "--out" || arg === "-o") {
      flags.outFile = next;
      i++;
    } else if (arg === "--no-color") {
      flags.noColor = true;
    } else if (arg === "--no-cache") {
      flags.noCache = true;
    } else if (arg === "--clear-cache") {
      flags.clearCache = true;
    } else if (arg === "--team") {
      flags.team = next.split(",").map((s) => s.trim());
      i++;
    } else if (arg === "--limit" || arg === "-l") {
      const n = parseInt(next, 10);
      if (isNaN(n) || n < 1) throw new Error(`Invalid limit: "${next}"`);
      flags.limit = n;
      i++;
    }
  }

  return flags;
}
