export function viewerUrl(raw) {
	if (!raw) {
		throw new Error("Desktop viewer URL is required.");
	}

	let url;
	try {
		url = new URL(raw);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Invalid desktop viewer URL: ${message}`);
	}

	if (url.protocol !== "http:") {
		throw new Error("Desktop viewer URL must use http.");
	}

	const hostname = url.hostname.startsWith("[")
		? url.hostname.slice(1, -1)
		: url.hostname;
	const isLoopback =
		hostname.toLowerCase() === "localhost" ||
		hostname === "::1" ||
		/^127(?:\.\d{1,3}){3}$/.test(hostname);

	if (!isLoopback) {
		throw new Error("Desktop viewer URL must use a loopback host.");
	}

	return url;
}
