import { normaliseRelPath } from "../../shared/paths.ts";
import type { ContentSource } from "../ports/content-source.ts";

const EXECUTABLE_REF_NAMES = new Set([
	"python",
	"py",
	"jsx",
	"plot-jsx",
	"run",
	"exec",
]);
const EXECUTABLE_REF_PATTERN =
	/^[ \t]*\[([A-Za-z][\w-]*)=([^\s\]"]+)([^\]]*)\][ \t]*$/gm;

export async function resolveExecutableSourceRefs(
	source: string,
	contentSource: ContentSource,
): Promise<ExecutableSourceResolution> {
	const replacements: Array<{ start: number; end: number; text: string }> = [];
	const missing: ExecutableSourceResolution["missing"] = [];
	const fencedRanges = collectFencedCodeRanges(source);

	for (const match of source.matchAll(EXECUTABLE_REF_PATTERN)) {
		const start = match.index!;
		if (isOffsetInRanges(start, fencedRanges)) {
			continue;
		}

		const name = match[1]!.toLowerCase();
		if (!EXECUTABLE_REF_NAMES.has(name)) {
			continue;
		}

		const filename = match[2]!;
		const flagStr = match[3] ?? "";
		const end = start + match[0].length;
		const rendered = await renderExecutableFileRef({
			contentSource,
			filename,
			lang: name,
			flagStr,
		});
		replacements.push({
			start,
			end,
			text: rendered.text,
		});
		if (!rendered.found) {
			missing.push({
				filename,
				line: source.slice(0, start).split("\n").length,
			});
		}
	}

	if (replacements.length === 0) {
		return { source, missing };
	}

	replacements.sort((left, right) => right.start - left.start);
	let resolved = source;
	for (const replacement of replacements) {
		resolved =
			resolved.slice(0, replacement.start) +
			replacement.text +
			resolved.slice(replacement.end);
	}
	return { source: resolved, missing };
}

export interface ExecutableSourceResolution {
	source: string;
	missing: Array<{ filename: string; line: number }>;
}

interface SourceRange {
	start: number;
	end: number;
}

function collectFencedCodeRanges(source: string): SourceRange[] {
	const ranges: SourceRange[] = [];
	const linePattern = /.*(?:\r?\n|$)/g;
	let inFence = false;
	let fenceChar: "`" | "~" | null = null;
	let fenceStart = 0;

	for (const match of source.matchAll(linePattern)) {
		const line = match[0];
		if (line === "") {
			continue;
		}

		const start = match.index!;
		const end = start + line.length;
		const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
		if (!fenceMatch) {
			continue;
		}

		const marker = fenceMatch[1]!;
		if (!inFence) {
			inFence = true;
			fenceChar = marker[0] as "`" | "~";
			fenceStart = start;
			continue;
		}

		if (marker.startsWith(fenceChar ?? "`")) {
			ranges.push({ start: fenceStart, end });
			inFence = false;
			fenceChar = null;
		}
	}

	if (inFence) {
		ranges.push({ start: fenceStart, end: source.length });
	}

	return ranges;
}

function isOffsetInRanges(offset: number, ranges: SourceRange[]): boolean {
	return ranges.some((range) => offset >= range.start && offset < range.end);
}

interface RenderExecutableFileRefInput {
	contentSource: ContentSource;
	filename: string;
	lang: string;
	flagStr: string;
}

async function renderExecutableFileRef(
	input: RenderExecutableFileRefInput,
): Promise<{ text: string; found: boolean }> {
	const flagAttrs = input.flagStr.trim() ? ` ${input.flagStr.trim()}` : "";
	const candidate = await readFirstCandidate(
		input.contentSource,
		executableSourceCandidates(input.filename),
	);

	if (candidate != null) {
		return {
			text: `[${input.lang}${flagAttrs}]\n${candidate}\n[/${input.lang}]`,
			found: true,
		};
	}

	return {
		text: `[${input.lang}${flagAttrs}]\n# Error: file not found: .readrun/assets/scripts/, .readrun/scripts/, or .readrun/.widgets-out/${input.filename}\n[/${input.lang}]`,
		found: false,
	};
}

function executableSourceCandidates(filename: string): string[] {
	if (!isSafeContentRef(filename)) {
		return [];
	}

	const assetCandidate = filename.includes("/")
		? `.readrun/assets/${normaliseRelPath(filename)}`
		: `.readrun/assets/scripts/${normaliseRelPath(filename)}`;

	return [
		assetCandidate,
		`.readrun/scripts/${normaliseRelPath(filename)}`,
		`.readrun/.widgets-out/${normaliseRelPath(filename)}`,
	];
}

function isSafeContentRef(filename: string): boolean {
	const normalised = normaliseRelPath(filename);
	return (
		normalised.length > 0 &&
		!normalised.startsWith("/") &&
		normalised !== ".." &&
		!normalised.startsWith("../") &&
		!normalised.includes("/../")
	);
}

async function readFirstCandidate(
	contentSource: ContentSource,
	candidates: string[],
): Promise<string | null> {
	for (const relPath of candidates) {
		try {
			return await contentSource.readText(relPath);
		} catch {
			// Try the next historical location.
		}
	}
	return null;
}
