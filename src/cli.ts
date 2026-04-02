#!/usr/bin/env bun

import { resolve } from "path";
import { statSync } from "fs";
import { runTui, type TuiResult } from "./tui";

function openBrowser(url: string) {
  const cmd = process.platform === "darwin" ? "open"
    : process.platform === "win32" ? "start"
    : "xdg-open";
  Bun.spawn([cmd, url], { stdout: "ignore", stderr: "ignore" });
}

function waitForEnter(): Promise<void> {
  return new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    const handler = (data: string) => {
      if (data.includes("\n") || data.includes("\r")) {
        process.stdin.removeListener("data", handler);
        process.stdin.pause();
        resolve();
      }
    };
    process.stdin.on("data", handler);
  });
}

function parseArg(arg: string): TuiResult | null {
  const abs = resolve(process.cwd(), arg);
  let stat;
  try { stat = statSync(abs); } catch { return null; }

  if (stat.isDirectory()) {
    return { command: "dev", contentDir: abs, port: 3001 };
  }
  if (stat.isFile() && abs.endsWith(".md")) {
    return { command: "dev", contentDir: resolve(abs, ".."), filePath: abs, port: 3001 };
  }
  return null;
}

const arg = process.argv[2];
const directResult = arg && !arg.startsWith("-") ? parseArg(arg) : null;

let result = directResult ?? await runTui();

while (true) {
  if (result.command === "quit") {
    process.exit(0);
  }

  if (result.command === "update") {
    const readrunRoot = resolve(import.meta.dirname, "..");
    console.log("Installing dependencies...\n");
    const proc = Bun.spawn(["bun", "install"], {
      cwd: readrunRoot,
      stdout: "inherit",
      stderr: "inherit",
    });
    await proc.exited;
    if (proc.exitCode === 0) {
      console.log("\nDependencies updated. Restart readrun to use the latest version.");
    } else {
      console.error("\nFailed to install dependencies.");
      process.exit(1);
    }
    process.exit(0);
  }

  const docsDir = resolve(import.meta.dirname, "..", "readrun-docs");
  const contentDir = result.testMode ? docsDir : result.contentDir;

  switch (result.command) {
    case "dev": {
      const { startServer } = await import("./server");
      const handle = await startServer({ contentDir, port: result.port || 3001 });
      let openPath = "/";
      if (result.filePath) {
        const rel = result.filePath.slice(contentDir.length).replace(/\.md$/, "");
        openPath = rel.startsWith("/") ? rel : "/" + rel;
      }
      openBrowser(`http://localhost:${handle.port}${openPath}`);

      console.log(`\nPress Enter to stop the server and go back to readrun.`);
      await waitForEnter();
      handle.stop();
      console.log("Server stopped.\n");
      break;
    }
    case "build": {
      const { build } = await import("./build");
      await build({
        contentDir,
        outDir: result.outDir || resolve(contentDir, "dist"),
        platform: result.platform || null,
        basePath: result.basePath,
      });
      process.exit(0);
    }
  }

  result = await runTui();
}
