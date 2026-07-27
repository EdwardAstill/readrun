import {
  normaliseRelPath,
  normalisePathSlashes,
  relPathSegments,
} from "../../shared/paths.ts";

export interface IgnorePattern {
  pattern: string;
  line: number;
}

export interface CompiledIgnorePattern extends IgnorePattern {
  regex: RegExp;
}

export const DEFAULT_IGNORED_DIRS = [
  ".git",
  ".hg",
  ".svn",
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  "__pycache__",
  "venv",
  ".venv",
] as const;

export function parseIgnore(text: string): IgnorePattern[] {
  const patterns: IgnorePattern[] = [];

  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.trim();

    if (line === "" || line.startsWith("#")) {
      continue;
    }

    patterns.push({
      pattern: line,
      line: index + 1,
    });
  }

  return patterns;
}

export function compileIgnorePatterns(
  patterns: IgnorePattern[],
): CompiledIgnorePattern[] {
  return patterns.map((pattern) => ({
    ...pattern,
    regex: globToRegExp(pattern.pattern),
  }));
}

export function shouldIgnoreRelPath(
  relPath: string,
  patterns: CompiledIgnorePattern[],
): boolean {
  const normalised = normaliseRelPath(relPath);

  if (normalised === "") {
    return false;
  }

  if (relPathSegments(normalised).some((segment) => isDefaultIgnoredDir(segment))) {
    return true;
  }

  return patterns.some((pattern) => pattern.regex.test(normalised));
}

export function isDefaultIgnoredDir(name: string): boolean {
  return (DEFAULT_IGNORED_DIRS as readonly string[]).includes(name);
}

function globToRegExp(pattern: string): RegExp {
  const normalised = normaliseRelPath(normalisePathSlashes(pattern));

  if (normalised === "" || normalised === "**") {
    return /^.*$/;
  }

  if (normalised.endsWith("/**")) {
    const base = normalised.slice(0, -3);
    return new RegExp(`^${escapeForRegex(base)}(?:/.*)?$`);
  }

  let source = "^";

  for (let index = 0; index < normalised.length; index += 1) {
    const char = normalised[index]!;
    const next = normalised[index + 1];
    const afterNext = normalised[index + 2];

    if (char === "*" && next === "*" && afterNext === "/") {
      source += "(?:[^/]+/)*";
      index += 2;
      continue;
    }

    if (char === "*" && next === "*") {
      source += ".*";
      index += 1;
      continue;
    }

    if (char === "*") {
      source += "[^/]*";
      continue;
    }

    if (char === "?") {
      source += "[^/]";
      continue;
    }

    source += escapeForRegex(char);
  }

  source += "$";
  return new RegExp(source);
}

function escapeForRegex(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}
