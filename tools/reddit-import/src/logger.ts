import { appendFileSync, mkdirSync } from "fs";
import path from "path";

/**
 * Prints to console and optionally appends the same lines to a timestamped log file.
 */
export class RunLogger {
  private readonly logFilePath: string | null;

  constructor(logDir: string | null) {
    if (!logDir) {
      this.logFilePath = null;
      return;
    }
    mkdirSync(logDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    this.logFilePath = path.join(logDir, `import-${stamp}.log`);
  }

  info(message: string) {
    const line = `[INFO] ${message}`;
    console.log(line);
    this.flushLine(line);
  }

  error(message: string) {
    const line = `[ERROR] ${message}`;
    console.error(line);
    this.flushLine(line);
  }

  private flushLine(line: string) {
    if (!this.logFilePath) return;
    try {
      appendFileSync(this.logFilePath, `${line}\n`, "utf8");
    } catch {
      // avoid crashing import if log dir becomes unwritable
    }
  }

  getLogFilePath(): string | null {
    return this.logFilePath;
  }
}
