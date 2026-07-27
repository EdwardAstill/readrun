import { parse as parseYaml } from "yaml";

export interface Frontmatter {
  title?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface FrontmatterIssue {
  severity: "error" | "warning";
  message: string;
}

export interface FrontmatterParse {
  frontmatter: Frontmatter;
  body: string;
  raw: string | null;
  issues: FrontmatterIssue[];
}

function normaliseFrontmatterTags(input: unknown): string[] | undefined {
  if (input == null) {
    return undefined;
  }

  if (Array.isArray(input)) {
    return input
      .map((value) => String(value).trim())
      .filter((value) => value.length > 0);
  }

  if (typeof input === "string") {
    return input
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }

  return [String(input).trim()].filter((value) => value.length > 0);
}

export function splitFrontmatter(source: string): { block: string | null; body: string } {
  if (!source.startsWith("---")) {
    return { block: null, body: source };
  }

  const lines = source.split(/\r?\n/);

  if (lines[0]?.trim() !== "---") {
    return { block: null, body: source };
  }

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index]?.trim();
    if (line !== "---" && line !== "...") {
      continue;
    }

    const block = lines.slice(1, index).join("\n");
    const body = lines.slice(index + 1).join("\n");
    return { block, body };
  }

  return { block: null, body: source };
}

export function parseFrontmatter(source: string): FrontmatterParse {
  const { block, body } = splitFrontmatter(source);

  if (block == null) {
    return {
      frontmatter: {},
      body,
      raw: null,
      issues: [],
    };
  }

  const issues: FrontmatterIssue[] = [];

  try {
    const parsed = parseYaml(block);

    if (parsed == null) {
      return {
        frontmatter: {},
        body,
        raw: block,
        issues,
      };
    }

    if (typeof parsed !== "object" || Array.isArray(parsed)) {
      issues.push({
        severity: "error",
        message: "Frontmatter must parse to a YAML mapping.",
      });
      return {
        frontmatter: {},
        body,
        raw: block,
        issues,
      };
    }

    const frontmatter: Frontmatter = { ...(parsed as Record<string, unknown>) };

    if ("title" in frontmatter && frontmatter.title != null) {
      frontmatter.title = String(frontmatter.title);
    }

    if ("tags" in frontmatter) {
      frontmatter.tags = normaliseFrontmatterTags(frontmatter.tags);
    }

    return {
      frontmatter,
      body,
      raw: block,
      issues,
    };
  } catch (error) {
    issues.push({
      severity: "error",
      message:
        error instanceof Error ? `Invalid YAML frontmatter: ${error.message}` : "Invalid YAML frontmatter.",
    });

    return {
      frontmatter: {},
      body,
      raw: block,
      issues,
    };
  }
}
