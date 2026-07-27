export interface SiteSearchDocument {
	id?: string;
	url: string;
	relPath?: string;
	title: string;
	tags?: string[];
	text?: string;
	body?: string;
}

export interface SiteSearchResult {
	document: SiteSearchDocument;
	score: number;
	snippet: string;
}

let indexUrl: string | null = null;
let indexPromise: Promise<SiteSearchDocument[]> | null = null;

export function scoreSearchText(
	query: string,
	label: string,
): { score: number; firstHitIndex: number } {
	const phrase = normalize(query);
	if (!phrase) return { score: 0, firstHitIndex: -1 };

	const tokens = tokenize(phrase);
	if (tokens.length === 0) return { score: 0, firstHitIndex: -1 };

	const normalizedLabel = normalize(label);
	const firstHitIndex = normalizedLabel.indexOf(tokens[0]!);
	if (normalizedLabel.startsWith(phrase)) {
		return { score: 3, firstHitIndex: normalizedLabel.indexOf(phrase) };
	}
	if (normalizedLabel.includes(phrase)) {
		return { score: 2, firstHitIndex: normalizedLabel.indexOf(phrase) };
	}
	if (tokens.every((token) => normalizedLabel.includes(token))) {
		return { score: 1, firstHitIndex };
	}
	return { score: 0, firstHitIndex: -1 };
}

export function searchDocuments(
	query: string,
	documents: readonly SiteSearchDocument[],
	limit = 30,
): SiteSearchResult[] {
	const phrase = normalize(query);
	const tokens = tokenize(phrase);
	if (!phrase || tokens.length === 0) return [];

	return documents
		.map((document) => ({
			document,
			score: scoreDocument(phrase, tokens, document),
			snippet: buildSnippet(document.text ?? document.body ?? "", phrase, tokens),
		}))
		.filter((result) => result.score > 0)
		.sort(
			(a, b) =>
				b.score - a.score || a.document.title.localeCompare(b.document.title),
		)
		.slice(0, limit);
}

export function loadSearchIndex(url: string): Promise<SiteSearchDocument[]> {
	if (indexPromise && indexUrl === url) {
		return indexPromise;
	}

	indexUrl = url;
	indexPromise = fetch(url)
		.then((response) => (response.ok ? response.json() : []))
		.then((value) => (Array.isArray(value) ? value.map(normalizeDocument) : []))
		.catch(() => []);
	return indexPromise;
}

function scoreDocument(
	phrase: string,
	tokens: readonly string[],
	document: SiteSearchDocument,
): number {
	const title = normalize(document.title);
	const text = normalize(document.text ?? document.body ?? "");
	const relPath = normalize(document.relPath ?? "");
	const tags = (document.tags ?? []).map(normalize);
	const haystack = `${title} ${text} ${relPath} ${tags.join(" ")}`;

	if (!tokens.every((token) => haystack.includes(token))) {
		return 0;
	}

	let score = scoreSearchText(phrase, document.title).score * 30;
	if (title === phrase) score += 90;
	if (title.startsWith(phrase)) score += 60;
	if (relPath.includes(phrase)) score += 16;
	if (text.includes(phrase)) score += 14;

	for (const token of tokens) {
		if (title.includes(token)) score += 12;
		if (tags.some((tag) => tag.includes(token))) score += 18;
		if (relPath.includes(token)) score += 5;
		if (text.includes(token)) score += 3;
	}

	return score;
}

function buildSnippet(
	text: string,
	phrase: string,
	tokens: readonly string[],
): string {
	const cleanText = text.replace(/\s+/g, " ").trim();
	if (!cleanText) return "";

	const lower = cleanText.toLowerCase();
	const hit =
		lower.indexOf(phrase) >= 0
			? lower.indexOf(phrase)
			: tokens.map((token) => lower.indexOf(token)).find((idx) => idx >= 0) ?? 0;
	const start = Math.max(0, hit - 64);
	const end = Math.min(cleanText.length, hit + 112);
	return `${start > 0 ? "..." : ""}${cleanText.slice(start, end)}${
		end < cleanText.length ? "..." : ""
	}`;
}

function normalizeDocument(value: unknown): SiteSearchDocument {
	const raw = value && typeof value === "object" ? value : {};
	const record = raw as Record<string, unknown>;
	const url = typeof record.url === "string" ? record.url : "#";
	const title = typeof record.title === "string" ? record.title : url;
	const tags = Array.isArray(record.tags)
		? record.tags.filter((tag): tag is string => typeof tag === "string")
		: [];
	return {
		id: typeof record.id === "string" ? record.id : url,
		url,
		relPath: typeof record.relPath === "string" ? record.relPath : undefined,
		title,
		tags,
		text: typeof record.text === "string" ? record.text : undefined,
		body: typeof record.body === "string" ? record.body : undefined,
	};
}

function normalize(value: string): string {
	return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function tokenize(value: string): string[] {
	return normalize(value).split(/\s+/).filter(Boolean);
}
