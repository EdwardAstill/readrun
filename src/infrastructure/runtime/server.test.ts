import { afterEach, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
	LiveChannel,
	LiveEvent,
} from "../../application/ports/live-channel.ts";
import { httpOptions } from "../../application/commands/cli-helpers.ts";
import { startServer, type StartServerOptions } from "./server.ts";

const CLIENT_ENTRY = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../presentation/client/main.tsx",
);

const tempDirs: string[] = [];
const servers: Array<{ stop(): void }> = [];

async function makeProject(): Promise<string> {
	const root = await mkdtemp(path.join(tmpdir(), "rr-server-test-"));
	tempDirs.push(root);
	await Bun.write(path.join(root, "index.md"), "# Hello\n\nTest page.\n");
	return root;
}

async function makeProjectWithFiles(
	files: Record<string, string>,
): Promise<string> {
	const root = await mkdtemp(path.join(tmpdir(), "rr-server-test-"));
	tempDirs.push(root);
	for (const [relPath, content] of Object.entries(files)) {
		const fullPath = path.join(root, relPath);
		await mkdir(path.dirname(fullPath), { recursive: true });
		await Bun.write(fullPath, content);
	}
	return root;
}

async function makeFakeUv(dir: string): Promise<string> {
	const uv = path.join(dir, "uv");
	await Bun.write(
		uv,
		`#!/usr/bin/env bash
set -euo pipefail
while [ "$#" -gt 0 ]; do
  case "$1" in
    run|--isolated|--no-project)
      shift
      ;;
    --with)
      shift 2
      ;;
    python)
      shift
      exec python3 "$@"
      ;;
    *.py)
      exec python3 "$1"
      ;;
    *)
      shift
      ;;
  esac
done
echo "fake uv did not receive python command" >&2
exit 2
`,
	);
	await chmod(uv, 0o755);
	return uv;
}

async function startTestServer(
	options: Partial<StartServerOptions> = {},
): Promise<{
	baseUrl: string;
	port: number;
	reload(): Promise<void>;
	openFile(filePath: string): Promise<string>;
	stop(): void;
}> {
	const root = options.root ?? (await makeProject());
	const handle = await startServer({
		root,
		port: 0,
		host: "localhost",
		watch: false,
		...options,
	});
	servers.push(handle);
	return {
		baseUrl: `http://${handle.host}:${handle.port}`,
		port: handle.port,
		reload: handle.reload,
		openFile: (filePath) => handle.openFile!(filePath),
		stop: handle.stop,
	};
}

function createRecordingLiveChannel(): {
	channel: LiveChannel;
	events: LiveEvent[];
} {
	const events: LiveEvent[] = [];
	const listeners = new Set<(event: LiveEvent) => void>();
	return {
		events,
		channel: {
			publish(event) {
				events.push(event);
				for (const listener of listeners) listener(event);
			},
			subscribe(listener) {
				listeners.add(listener);
				listener({ type: "connected", at: Date.now() });
				return () => listeners.delete(listener);
			},
		},
	};
}

async function waitFor<T>(
	read: () => Promise<T>,
	accept: (value: T) => boolean,
	timeoutMs = 3_000,
): Promise<T> {
	const deadline = Date.now() + timeoutMs;
	let value = await read();
	while (!accept(value) && Date.now() < deadline) {
		await Bun.sleep(25);
		value = await read();
	}
	return value;
}

async function readUntil(
	reader: ReadableStreamDefaultReader<Uint8Array>,
	match: string,
	timeoutMs = 3_000,
): Promise<string> {
	const decoder = new TextDecoder();
	const deadline = Date.now() + timeoutMs;
	let text = "";
	while (!text.includes(match)) {
		const remaining = deadline - Date.now();
		if (remaining <= 0) throw new Error(`Timed out waiting for ${match}.`);
		let timer: ReturnType<typeof setTimeout> | undefined;
		const result = await Promise.race([
			reader.read(),
			new Promise<never>((_, reject) => {
				timer = setTimeout(
					() => reject(new Error(`Timed out waiting for ${match}.`)),
					remaining,
				);
			}),
		]).finally(() => clearTimeout(timer));
		if (result.done) throw new Error(`Stream ended before ${match}.`);
		text += decoder.decode(result.value, { stream: true });
	}
	return text;
}

function occupyTestPort(): Bun.Server<undefined> {
	for (let port = 43130; port < 43200; port++) {
		try {
			return Bun.serve({
				port,
				hostname: "127.0.0.1",
				fetch() {
					return new Response("occupied");
				},
			});
		} catch (error) {
			if (!isAddressInUseError(error)) {
				throw error;
			}
		}
	}

	throw new Error("Could not occupy a test port.");
}

function isAddressInUseError(error: unknown): boolean {
	return (
		error instanceof Error &&
		"code" in error &&
		(error as { code?: unknown }).code === "EADDRINUSE"
	);
}

afterEach(async () => {
	for (const server of servers.splice(0)) {
		server.stop();
	}
	for (const dir of tempDirs.splice(0)) {
		await rm(dir, { recursive: true, force: true });
	}
});

test("startServer serves the runtime client assets", async () => {
	const server = await startTestServer({
		clientEntry: CLIENT_ENTRY,
	});

	const script = await fetch(`${server.baseUrl}/_readrun/client.js`);
	expect(script.status).toBe(200);
	expect(script.headers.get("content-type")).toContain(
		"application/javascript",
	);
	expect(await script.text()).toContain("readrun:open-page-search");

	const styles = await fetch(`${server.baseUrl}/_readrun/client.css`);
	expect(styles.status).toBe(200);
	expect(styles.headers.get("content-type")).toContain("text/css");
});

test("startServer serves project asset byte ranges through Bun.file", async () => {
	const root = await makeProjectWithFiles({
		"index.md": "# Range\n",
		".readrun/assets/files/range file.txt": "0123456789",
	});
	const server = await startTestServer({ root });

	const response = await fetch(
		`${server.baseUrl}/_readrun/assets/files/range%20file.txt`,
		{ headers: { Range: "bytes=2-5" } },
	);

	expect(response.status).toBe(206);
	expect(response.headers.get("content-range")).toBe("bytes 2-5/10");
	expect(await response.text()).toBe("2345");
});

test("startServer renders and serves PDFs whose paths contain spaces", async () => {
	const pdf = "%PDF-1.4\n% readrun test\n";
	const root = await makeProjectWithFiles({
		"index.md": "# PDFs\n",
		"slides/Week 1.pdf": pdf,
	});
	const server = await startTestServer({ root });

	const page = await fetch(`${server.baseUrl}/slides/Week%201/`);
	expect(page.status).toBe(200);
	const html = await page.text();
	expect(html).toContain('class="viewer viewer-pdf viewer-pdf-page"');
	expect(html).toContain('src="/slides/Week%201.pdf"');

	const source = await fetch(`${server.baseUrl}/slides/Week%201.pdf`);
	expect(source.status).toBe(200);
	expect(source.headers.get("content-type")).toContain("application/pdf");
	expect(await source.text()).toBe(pdf);
});

test("startServer moves to the next available port when the requested port is occupied", async () => {
	const occupied = occupyTestPort();
	servers.push(occupied);
	const requestedPort = occupied.port;
	if (requestedPort == null) {
		throw new Error("Occupied test server did not report a port.");
	}

	const root = await makeProject();
	const handle = await startServer({
		root,
		port: requestedPort,
		host: "127.0.0.1",
		watch: false,
	});
	servers.push(handle);

	expect(handle.port).toBeGreaterThan(requestedPort);
	const page = await fetch(`http://${handle.host}:${handle.port}/`);
	expect(page.status).toBe(200);
	expect(await page.text()).toContain("Test page.");
});

test("the default CLI host is reachable over IPv4", async () => {
	const root = await makeProject();
	const options = httpOptions({ port: 0 });
	const handle = await startServer({
		root,
		port: options.port,
		host: options.host,
		watch: false,
	});
	servers.push(handle);

	let response: Response | undefined;
	try {
		response = await fetch(`http://127.0.0.1:${handle.port}/`);
	} catch {
		// The assertion below reports an IPv4-inaccessible default as a test failure.
	}

	expect(response?.status).toBe(200);
});

test("startServer rejects local Python execution when uv is unavailable", async () => {
	const server = await startTestServer({
		uvCommand: "definitely-not-readrun-uv",
	});

	const page = await fetch(`${server.baseUrl}/`);
	expect(await page.text()).toContain('"enableLocalPython":false');

	const response = await fetch(`${server.baseUrl}/api/exec/python`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ code: "print('hi')" }),
	});

	expect(response.status).toBe(403);
	expect(await response.json()).toEqual({
		error: "Local Python execution requires uv to be installed.",
	});
});

test("startServer runs local Python through uv when uv is available", async () => {
	const root = await makeProjectWithFiles({
		"index.md": "# Local Python\n\n[python]\nprint('ready')\n[/python]\n",
		".readrun/assets/data/input.txt": "6\n",
	});
	const uvCommand = await makeFakeUv(root);
	const server = await startTestServer({ root, uvCommand });

	const page = await fetch(`${server.baseUrl}/`);
	expect(await page.text()).toContain('"enableLocalPython":true');

	const response = await fetch(`${server.baseUrl}/api/exec/python`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			code: `
from pathlib import Path
n = int(Path("data/input.txt").read_text())
print(n * 7)
Path("result.txt").write_text(str(n + 1))
`,
		}),
	});

	expect(response.status).toBe(200);
	const body = (await response.json()) as {
		ok: boolean;
		stdout: string;
		files: { name: string; encoding: string; data: string }[];
	};
	expect(body.ok).toBe(true);
	expect(body.stdout).toContain("42");
	expect(body.files).toHaveLength(1);
	expect(body.files[0]!.name).toBe("result.txt");
	expect(body.files[0]!.encoding).toBe("base64");
	expect(Buffer.from(body.files[0]!.data, "base64").toString()).toBe("7");
});

test("reload atomically swaps added and removed site routes without changing the server", async () => {
	const root = await makeProjectWithFiles({
		"index.md": "# Home\n",
		"old.md": "# Old page\n",
	});
	const server = await startTestServer({ root });
	const initialPort = server.port;
	const eventsResponse = await fetch(`${server.baseUrl}/_readrun/live/events`);
	const reader = eventsResponse.body?.getReader();
	if (!reader) throw new Error("Live event response did not include a body.");
	await readUntil(reader, "event: connected");

	await Bun.write(path.join(root, "new.md"), "# New page\n");
	await rm(path.join(root, "old.md"));
	await server.reload();

	expect(server.port).toBe(initialPort);
	expect((await fetch(`${server.baseUrl}/new/`)).status).toBe(200);
	expect((await fetch(`${server.baseUrl}/old/`)).status).toBe(404);
	const liveEvent = await readUntil(reader, '"reason":"manual-reload"');
	expect(liveEvent).toContain("event: snapshot");
	await reader.cancel();
});

test("data aliases honor the project asset scope", async () => {
	const root = await makeProjectWithFiles({
		"index.md": "# Home\n",
		".readrun/ignore": ".readrun/assets/data/private.txt\n",
		".readrun/assets/data/public.txt": "public\n",
		".readrun/assets/data/private.txt": "private\n",
	});
	const server = await startTestServer({ root });

	const publicFile = await fetch(`${server.baseUrl}/_readrun/files/public.txt`);
	expect(publicFile.status).toBe(200);
	expect(await publicFile.text()).toBe("public\n");
	expect(
		(await fetch(`${server.baseUrl}/_readrun/files/private.txt`)).status,
	).toBe(404);
});

test("watched changes update live status once with the actual change reason", async () => {
	const root = await makeProject();
	const recording = createRecordingLiveChannel();
	const server = await startTestServer({
		root,
		watch: true,
		liveChannel: recording.channel,
	});
	const initialHtml = await (await fetch(server.baseUrl)).text();
	expect(initialHtml).toContain('"enableLiveReload":true');

	await Bun.write(path.join(root, "index.md"), "# Updated\n");
	const status = await waitFor(
		async () =>
			(await (
				await fetch(`${server.baseUrl}/_readrun/live/status`)
			).json()) as {
				root: string;
				version: number;
				lastChange: { at: number; relPath?: string; reason: string } | null;
			},
		(value) => value.version === 1,
	);

	expect(status).toEqual({
		root,
		version: 1,
		lastChange: {
			at: expect.any(Number),
			relPath: "index.md",
			reason: "content-updated",
		},
	});
	expect(recording.events).toEqual([
		{
			type: "snapshot",
			at: expect.any(Number),
			version: 1,
			reason: "content-updated",
			relPath: "index.md",
		},
	]);
	expect(await (await fetch(server.baseUrl)).text()).toContain(">Updated</h1>");
});

test("single-file previews watch atomic saves and assets without reacting to sibling projects", async () => {
	const root = await makeProjectWithFiles({
		"note.md": "# Selected\n\n[python=example.py]\n",
		"other.md": "# Other\n",
		"project/.git/index.lock": "",
		".readrun/assets/scripts/example.py": "print(1)",
	});
	const recording = createRecordingLiveChannel();
	const server = await startTestServer({ root, filePath: path.join(root, "note.md"), watch: true, liveChannel: recording.channel });
	const page = () => fetch(`${server.baseUrl}/note`).then(response => response.text());
	expect(await page()).toContain("print(1)");
	expect((await fetch(`${server.baseUrl}/other`)).status).toBe(404);
	await Bun.write(path.join(root, "other.md"), "# Sibling changed\n");
	await Bun.write(path.join(root, "project/.git/index.lock"), "unrelated change");
	await Bun.sleep(250);
	expect(recording.events).toHaveLength(0);
	await Bun.write(path.join(root, "replacement.tmp"), "# Saved atomically\n\n[python=example.py]\n");
	await rename(path.join(root, "replacement.tmp"), path.join(root, "note.md"));
	expect(await waitFor(page, html => html.includes(">Saved atomically</h1>"))).toContain(">Saved atomically</h1>");
	await Bun.write(path.join(root, ".readrun/assets/scripts/example.py"), "print(2)");
	expect(await waitFor(page, html => html.includes("print(2)"))).toContain("print(2)");
});

test("single-file PDF previews keep the selected PDF asset available", async () => {
	const pdf = "%PDF-1.4\n% selected\n";
	const root = await makeProjectWithFiles({ "Week 1.pdf": pdf, "other.md": "# Other\n" });
	const server = await startTestServer({ root, filePath: path.join(root, "Week 1.pdf") });
	expect(await (await fetch(`${server.baseUrl}/Week%201/`)).text()).toContain('class="viewer viewer-pdf viewer-pdf-page"');
	expect(await (await fetch(`${server.baseUrl}/Week%201.pdf`)).text()).toBe(pdf);
	expect((await fetch(`${server.baseUrl}/other`)).status).toBe(404);
});

test("desktop file opening requires its token and is unavailable in browser mode", async () => {
	const root = await makeProjectWithFiles({ "notes #1.md": "# Selected\n" });
	const server = await startTestServer({ root, desktopToken: "desktop-token" });
	const endpoint = `${server.baseUrl}/_readrun/desktop/open-file`;
	const request = { method: "POST", headers: { Authorization: "Bearer desktop-token", "Content-Type": "application/json" },
		body: JSON.stringify({ filePath: path.join(root, "notes #1.md") }) };
	expect((await fetch(endpoint, { ...request, headers: {} })).status).toBe(403);
	expect((await fetch(endpoint, { ...request, headers: { ...request.headers, Origin: "https://example.org" } })).status).toBe(403);
	expect((await fetch(endpoint, { headers: request.headers })).status).toBe(405);
	const response = await fetch(endpoint, request);
	expect(response.status).toBe(200);
	const opened = await response.json();
	expect(opened.url).toBe("/notes%20%231");
	expect(await (await fetch(`${server.baseUrl}${opened.url}`)).text()).toContain(">Selected</h1>");
	const browser = await startTestServer({ root });
	expect((await fetch(`${browser.baseUrl}/_readrun/desktop/open-file`, request)).status).toBe(404);
});

test("selected files outside a single-file preview open with isolated assets and stable URLs", async () => {
	const root = await makeProjectWithFiles({ "index.md": "# Original\n", "sibling.md": "# Sibling\n" });
	const outside = await makeProjectWithFiles({
		"notes #1.md": "# Outside\n\n![Diagram](/_readrun/assets/images/diagram.svg)\n",
		"unrelated.md": "# Do not scan\n",
		".readrun/assets/images/diagram.svg": "<svg>outside</svg>",
		"notes #1.pdf": "%PDF-1.7\nselected PDF\n",
	});
	const server = await startTestServer({ root, filePath: path.join(root, "index.md") });
	const [first, again] = await Promise.all([server.openFile(path.join(outside, "notes #1.md")), server.openFile(path.join(outside, "notes #1.md"))]);
	expect(again).toBe(first);
	expect(first).toEndWith("/notes%20%231");
	const base = first.slice(0, first.lastIndexOf("/notes"));
	const html = await (await fetch(`${server.baseUrl}${first}`)).text();
	expect(html).toContain(">Outside</h1>");
	expect(html).not.toContain("Do not scan");
	expect(html).toContain(`${base}/_readrun/assets/images/diagram.svg`);
	expect(html).toContain(`${base}/api/exec/python`);
	expect(html).toContain(`${base}/_readrun/selection-commands`);
	expect(await (await fetch(`${server.baseUrl}${base}/_readrun/assets/images/diagram.svg`)).text()).toBe("<svg>outside</svg>");
	expect((await fetch(`${server.baseUrl}${base}/unrelated/`)).status).toBe(404);
	expect((await fetch(`${server.baseUrl}/sibling/`)).status).toBe(404);
	const sibling = await server.openFile(path.join(root, "sibling.md"));
	expect(await (await fetch(`${server.baseUrl}${sibling}`)).text()).toContain(">Sibling</h1>");
	const pdfUrl = await server.openFile(path.join(outside, "notes #1.pdf"));
	expect(pdfUrl).not.toBe(first);
	const pdfHtml = await (await fetch(`${server.baseUrl}${pdfUrl}`)).text();
	expect(pdfHtml).toContain('class="viewer viewer-pdf viewer-pdf-page"');
	const source = pdfHtml.match(/src="([^"]+\.pdf)"/);
	expect(source).not.toBeNull();
	expect(await (await fetch(`${server.baseUrl}${source![1]}`)).text()).toBe("%PDF-1.7\nselected PDF\n");
	expect(await (await fetch(server.baseUrl)).text()).toContain(">Original</h1>");
	await expect(server.openFile(path.join(outside, "missing.md"))).rejects.toThrow();
	await expect(server.openFile(path.join(outside, ".readrun/assets/images/diagram.svg"))).rejects.toThrow("Choose a Markdown or PDF file");
});

test("selected outside files watch atomic saves and stop with the main server", async () => {
	const outside = await makeProjectWithFiles({ "note.md": "# Before\n", "sibling.md": "# Unrelated\n" });
	const recording = createRecordingLiveChannel();
	const server = await startTestServer({ watch: true, liveChannel: recording.channel });
	const url = await server.openFile(path.join(outside, "note.md"));
	await Bun.write(path.join(outside, "replacement.tmp"), "# After\n");
	await rename(path.join(outside, "replacement.tmp"), path.join(outside, "note.md"));
	await waitFor(() => fetch(`${server.baseUrl}${url}`).then((response) => response.text()), (html) => html.includes(">After</h1>"));
	expect(recording.events.some((event) => event.type === "snapshot")).toBe(true);
	server.stop();
	const count = recording.events.length;
	await Bun.write(path.join(outside, "note.md"), "# Closed\n");
	await Bun.sleep(200);
	expect(recording.events).toHaveLength(count);
});

test("selected outside files run local Python with their own data assets", async () => {
	const root = await makeProject();
	const outside = await makeProjectWithFiles({ "note.md": "# Outside\n", ".readrun/assets/data/input.txt": "Outside data\n" });
	const server = await startTestServer({ root, uvCommand: await makeFakeUv(root) });
	const url = await server.openFile(path.join(outside, "note.md"));
	const base = url.slice(0, url.lastIndexOf("/note"));
	const response = await fetch(`${server.baseUrl}${base}/api/exec/python`, {
		method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: "from pathlib import Path; print(Path('data/input.txt').read_text())" }),
	});
	expect(response.status).toBe(200);
	expect((await response.json()).stdout.trim()).toBe("Outside data");
});

test("unsaved editor previews stay in memory and release back to watched files on save", async () => {
	const root = await makeProject();
	const file = path.join(root, "index.md");
	const handle = await startServer({ root, port: 0, host: "localhost", watch: true });
	servers.push(handle);
	const url = `http://${handle.host}:${handle.port}/`;
	await handle.setPreviewSource!(file, "# Unsaved draft\n\n- New bullet\n");
	expect(await (await fetch(url)).text()).toContain(">Unsaved draft</h1>");
	expect(await Bun.file(file).text()).toBe("# Hello\n\nTest page.\n");
	await Bun.write(file, "# Saved version\n");
	await handle.reload();
	expect(await (await fetch(url)).text()).toContain(">Unsaved draft</h1>");
	await handle.setPreviewSource!(file, null);
	expect(await (await fetch(url)).text()).toContain(">Saved version</h1>");
	await Bun.write(file, "# External change\n");
	await waitFor(async () => (await fetch(url)).text(), (html) => html.includes(">External change</h1>"));
	await expect(handle.setPreviewSource!(path.join(root, "../outside.md"), "invalid")).rejects.toThrow("in this project");
});

test("concurrent reload requests are queued and each publishes one completed snapshot", async () => {
	const recording = createRecordingLiveChannel();
	const server = await startTestServer({ liveChannel: recording.channel });

	await Promise.all([server.reload(), server.reload(), server.reload()]);
	const status = (await (
		await fetch(`${server.baseUrl}/_readrun/live/status`)
	).json()) as { version: number; lastChange: { reason: string } };

	expect(status.version).toBe(3);
	expect(status.lastChange.reason).toBe("manual-reload");
	expect(recording.events).toHaveLength(3);
	expect(recording.events.map((event) => event.version)).toEqual([1, 2, 3]);
});

test("client bundles are cached per server instance", async () => {
	const root = await makeProject();
	const firstEntry = path.join(root, "first-client.ts");
	const secondEntry = path.join(root, "second-client.ts");
	await Bun.write(firstEntry, 'console.log("first-client-entry");\n');
	await Bun.write(secondEntry, 'console.log("second-client-entry");\n');

	const first = await startTestServer({ root, clientEntry: firstEntry });
	const second = await startTestServer({ root, clientEntry: secondEntry });
	const firstScript = await (
		await fetch(`${first.baseUrl}/_readrun/client.js`)
	).text();
	const secondScript = await (
		await fetch(`${second.baseUrl}/_readrun/client.js`)
	).text();

	expect(firstScript).toContain("first-client-entry");
	expect(secondScript).toContain("second-client-entry");
});
