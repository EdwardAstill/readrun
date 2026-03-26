#!/usr/bin/env bun

import { resolve } from "path";
import { startServer } from "./server";
import { build } from "./build";

const args = process.argv.slice(2);
const command = args[0] ?? "dev";

const contentDir = resolve(process.cwd());

switch (command) {
  case "dev": {
    const port = Number(args[1]) || 3001;
    startServer(contentDir, port);
    break;
  }
  case "build": {
    const outDir = args[1] ? resolve(args[1]) : resolve(contentDir, "dist");
    await build(contentDir, outDir);
    break;
  }
  default:
    console.log(`explainr — turn Markdown into interactive websites

Usage:
  explainr              Start dev server (serves current directory)
  explainr dev [port]   Start dev server on specified port (default: 3001)
  explainr build [out]  Build static site to directory (default: ./dist)`);
}
