export function urlsMatch(left?: string, right?: string): boolean {
	return normaliseUrl(left) === normaliseUrl(right);
}

function normaliseUrl(url?: string): string {
	if (!url) return "";
	const pathname = url.split(/[?#]/, 1)[0] ?? "";
	return pathname.replace(/\/index\.html$/, "").replace(/\/$/, "") || "/";
}
