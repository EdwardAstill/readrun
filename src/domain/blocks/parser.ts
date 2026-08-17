import type { Block, BlockAttr, BlockNode, TextRun } from "./model.ts";
import type { ValidationIssue } from "../validation/model.ts";
import { isOpaqueBlock, isVoidBlock } from "./registry.ts";

export interface BlockParseResult {
  blocks: Block[];
  issues: ValidationIssue[];
}

export interface BlockTreeParseResult {
  tree: BlockNode[];
  issues: ValidationIssue[];
}

type BlockToken =
  | {
      kind: "open" | "void";
      name: string;
      attrs: BlockAttr[];
      src: string | null;
      line: number;
    }
  | { kind: "close"; name: string; line: number }
  | { kind: "text"; content: string; line: number };

const BLOCK_LINE_PATTERN =
  /^\s*\[(?<close>\/)?(?<name>[A-Za-z][A-Za-z0-9-]*)(?:=(?<src>[^\s\]"]+))?(?<attrs>[^\]]*)\]\s*$/;

export function parseBlocks(source: string): BlockParseResult {
  const parsed = parseBlockTree(source);
  return {
    blocks: flattenBlocks(parsed.tree),
    issues: parsed.issues,
  };
}

export function parseBlockTree(source: string): BlockTreeParseResult {
  const tokenised = tokenise(source);
  const built = buildTree(tokenised.tokens);
  return {
    tree: built.tree,
    issues: [...tokenised.issues, ...built.issues],
  };
}

export function parseBlockAttrs(source: string): BlockAttr[] {
  const attrs: BlockAttr[] = [];
  const text = source.trim();
  let index = 0;

  while (index < text.length) {
    while (index < text.length && /\s/.test(text[index]!)) {
      index += 1;
    }
    if (index >= text.length) {
      break;
    }

    const keyStart = index;
    while (index < text.length && text[index] !== "=" && !/\s/.test(text[index]!)) {
      index += 1;
    }
    const name = text.slice(keyStart, index);
    if (!name) {
      index += 1;
      continue;
    }

    if (text[index] !== "=") {
      attrs.push({ name, value: true, raw: name });
      continue;
    }

    index += 1;
    let value = "";
    if (text[index] === '"' || text[index] === "'") {
      const quote = text[index]!;
      index += 1;
      const valueStart = index;
      while (index < text.length && text[index] !== quote) {
        index += 1;
      }
      value = text.slice(valueStart, index);
      if (text[index] === quote) {
        index += 1;
      }
    } else {
      const valueStart = index;
      while (index < text.length && !/\s/.test(text[index]!)) {
        index += 1;
      }
      value = text.slice(valueStart, index);
    }

    attrs.push({ name, value, raw: `${name}=${value}` });
  }

  return attrs;
}

export function walkBlocks(
  nodes: readonly Block[],
  visitor: (block: Block) => void,
): void {
  for (const node of nodes) {
    visitor(node);
    if (node.children) {
      walkBlocks(
        node.children.filter((child): child is Block => child.type === "block"),
        visitor,
      );
    }
  }
}

function tokenise(source: string): { tokens: BlockToken[]; issues: ValidationIssue[] } {
  const tokens: BlockToken[] = [];
  const issues: ValidationIssue[] = [];
  const lines = source.split(/\r?\n/);
  let inFrontmatter = false;
  let frontmatterDone = false;
  let inFence = false;
  let fenceMarker: string | null = null;
  let opaqueBlockName: string | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = lines[index] ?? "";
    const trimmed = line.trim();

    if (!frontmatterDone && lineNumber === 1 && trimmed === "---") {
      inFrontmatter = true;
      tokens.push({ kind: "text", content: line, line: lineNumber });
      continue;
    }

    if (inFrontmatter) {
      tokens.push({ kind: "text", content: line, line: lineNumber });
      if (trimmed === "---") {
        inFrontmatter = false;
        frontmatterDone = true;
      }
      continue;
    }

    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (!opaqueBlockName && fenceMatch) {
      const marker = fenceMatch[1]!;
      if (!inFence) {
        inFence = true;
        fenceMarker = marker[0]!;
      } else if (marker.startsWith(fenceMarker ?? "`")) {
        inFence = false;
        fenceMarker = null;
      }
      tokens.push({ kind: "text", content: line, line: lineNumber });
      continue;
    }

    if (inFence) {
      tokens.push({ kind: "text", content: line, line: lineNumber });
      continue;
    }

    if (opaqueBlockName) {
      const opaqueClose = BLOCK_LINE_PATTERN.exec(line);
      if (
        opaqueClose?.groups?.close &&
        opaqueClose.groups.name === opaqueBlockName
      ) {
        tokens.push({
          kind: "close",
          name: opaqueBlockName,
          line: lineNumber,
        });
        opaqueBlockName = null;
      } else {
        tokens.push({ kind: "text", content: line, line: lineNumber });
      }
      continue;
    }

    if (/^\s*\\\[/.test(line)) {
      const unescapedBlockLine = line.replace(/\\(\[)/, "$1");
      if (
        !line.includes("\\]") &&
        BLOCK_LINE_PATTERN.test(unescapedBlockLine)
      ) {
        tokens.push({
          kind: "text",
          content: unescapedBlockLine,
          line: lineNumber,
        });
        continue;
      }
    }

    const blockMatch = BLOCK_LINE_PATTERN.exec(line);
    if (!blockMatch?.groups) {
      tokens.push({ kind: "text", content: line, line: lineNumber });
      continue;
    }

    const name = blockMatch.groups.name!;
    const src = blockMatch.groups.src ?? null;
    const attrs = parseBlockAttrs(blockMatch.groups.attrs ?? "");

    if (src) {
      attrs.unshift({ name: "src", value: src, raw: `src=${src}` });
    }

    if (blockMatch.groups.close) {
      tokens.push({ kind: "close", name, line: lineNumber });
      continue;
    }

    if (src || isVoidBlock(name)) {
      tokens.push({ kind: "void", name, attrs, src, line: lineNumber });
      continue;
    }

    tokens.push({ kind: "open", name, attrs, src, line: lineNumber });
    if (isOpaqueBlock(name)) {
      opaqueBlockName = name;
    }
  }

  return { tokens, issues };
}

function buildTree(tokens: readonly BlockToken[]): BlockTreeParseResult {
  const tree: BlockNode[] = [];
  const stack: Block[] = [];
  const issues: ValidationIssue[] = [];

  const currentChildren = (): BlockNode[] => {
    const current = stack.at(-1);
    if (!current) {
      return tree;
    }

    current.children ??= [];
    return current.children;
  };

  for (const token of tokens) {
    if (token.kind === "text") {
      appendText(currentChildren(), token.content, token.line);
      continue;
    }

    if (token.kind === "void") {
      currentChildren().push({
        type: "block",
        name: token.name,
        attrs: token.attrs,
        src: token.src,
        body: "",
        children: [],
        source: {
          startLine: token.line,
          endLine: token.line,
        },
      });
      continue;
    }

    if (token.kind === "open") {
      const block: Block = {
        type: "block",
        name: token.name,
        attrs: token.attrs,
        src: token.src,
        body: "",
        children: [],
        source: {
          startLine: token.line,
          endLine: token.line,
        },
      };
      currentChildren().push(block);
      stack.push(block);
      continue;
    }

    const block = stack.pop();
    if (!block) {
      issues.push({
        severity: "error",
        code: "block.parse",
        message: `Unexpected closing block [/${token.name}].`,
        position: { relPath: "", line: token.line },
      });
      continue;
    }

    if (block.name !== token.name) {
      issues.push({
        severity: "error",
        code: "block.parse",
        message: `Closing block [/${token.name}] does not match [${block.name}].`,
        position: { relPath: "", line: token.line },
      });
    }

    block.source.endLine = token.line;
    block.body = bodyFromChildren(block.children ?? []);
  }

  for (const block of stack) {
    issues.push({
      severity: "error",
      code: "block.parse",
      message: `Unclosed block [${block.name}].`,
      position: { relPath: "", line: block.source.startLine },
    });
    block.body = bodyFromChildren(block.children ?? []);
  }

  return { tree, issues };
}

function appendText(children: BlockNode[], content: string, line: number): void {
  const previous = children.at(-1);
  if (previous && previous.type !== "block") {
    previous.text += `\n${content}`;
    return;
  }

  children.push({
    text: content,
    position: { relPath: "", line },
  } satisfies TextRun);
}

function bodyFromChildren(children: readonly BlockNode[]): string {
  return children
    .map((child) => {
      if (child.type === "block") {
        return blockSource(child);
      }
      return child.text;
    })
    .join("\n");
}

function blockSource(block: Block): string {
  const attrs = block.attrs
    .filter((attr) => attr.name !== "src")
    .map((attr) => attr.raw)
    .join(" ");
  const attrSource = attrs ? ` ${attrs}` : "";
  const srcSource = block.src ? `=${block.src}` : "";
  if (block.source.startLine === block.source.endLine) {
    return `[${block.name}${srcSource}${attrSource}]`;
  }

  return `[${block.name}${srcSource}${attrSource}]\n${block.body}\n[/${block.name}]`;
}

function flattenBlocks(nodes: readonly BlockNode[]): Block[] {
  const blocks: Block[] = [];
  for (const node of nodes) {
    if (node.type !== "block") {
      continue;
    }
    blocks.push(node);
    blocks.push(...flattenBlocks(node.children ?? []));
  }
  return blocks;
}
