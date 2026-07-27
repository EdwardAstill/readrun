import { afterEach, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
	LiveChannel,
	LiveEvent,
} from "../../application/ports/live-channel.ts";
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
