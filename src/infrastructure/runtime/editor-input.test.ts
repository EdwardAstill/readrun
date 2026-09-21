import { expect, test } from "bun:test";
import { PassThrough } from "node:stream";
import { attachEditorInput } from "./editor-input.ts";

test("editor input handles split UTF-8 messages, latest edits, save, and teardown", async () => {
	const input = new PassThrough();
	const updates: Array<string | null> = [];
	let release!: () => void;
	const detach = attachEditorInput(input, async (source) => {
		updates.push(source);
		if (updates.length === 1) await new Promise<void>((resolve) => { release = resolve; });
	});
	const message = Buffer.from(JSON.stringify({ type: "buffer", source: "# Draft 📝\n\n- bullet" }) + "\n");
	const split = message.indexOf(Buffer.from("📝")) + 1;
	input.write(message.subarray(0, split));
	input.write(message.subarray(split));
	input.write('invalid\n{"type":"buffer","source":42}\n');
	input.write(JSON.stringify({ type: "buffer", source: "intermediate" }) + "\n");
	input.write(JSON.stringify({ type: "buffer", source: "latest" }) + "\n");
	release();
	await Bun.sleep(10);
	expect(updates).toEqual(["# Draft 📝\n\n- bullet", "latest"]);
	input.write('{"type":"buffer","source":null}\n');
	await Bun.sleep(10);
	expect(updates.at(-1)).toBeNull();
	detach();
	input.write('{"type":"buffer","source":"after close"}\n');
	await Bun.sleep(10);
	expect(updates).toHaveLength(3);
	input.destroy();
});
