import { expect, test } from "bun:test";
import { activeView, createReadingWorkspace, documentUrl } from "./controller.ts";

test("opening files keeps earlier tabs and selects an existing file without duplicating it", () => {
	const workspace = createReadingWorkspace("/docs/one.html", "One");
	const first = activeView(workspace.store.getState())!;
	workspace.open("/docs/two.html", "Two");
	expect(Object.keys(workspace.store.getState().views)).toHaveLength(2);
	expect(activeView(workspace.store.getState())?.title).toBe("Two");
	expect(workspace.open("/docs/one.html#example", "One")).toBe(first.id);
	expect(Object.keys(workspace.store.getState().views)).toHaveLength(2);
	expect(activeView(workspace.store.getState())?.id).toBe(first.id);
});

test("splits create independent instances and subsequent file opens target the focused pane", () => {
	const workspace = createReadingWorkspace("/one", "One");
	const original = activeView(workspace.store.getState())!;
	workspace.split("horizontal");
	let state = workspace.store.getState();
	expect(state.tiled.type).toBe("split");
	expect(Object.keys(state.stacks)).toHaveLength(2);
	expect(activeView(state)?.id).not.toBe(original.id);
	const secondStack = state.activeStackId!;
	const secondInstance = activeView(state)!;
	workspace.open("/two", "Two", secondStack);
	state = workspace.store.getState();
	expect(state.stacks[secondStack]?.viewIds).toHaveLength(2);
	expect(workspace.open("/one", "One", secondStack)).toBe(secondInstance.id);
	expect(Object.values(state.stacks).find((stack) => stack.id !== secondStack)?.viewIds).toEqual([original.id]);
});

test("dragging a tab to an edge moves its stable id and closing it prunes the empty pane", () => {
	const workspace = createReadingWorkspace("/one", "One");
	const second = workspace.open("/two", "Two");
	const stackId = workspace.store.getState().activeStackId!;
	workspace.store.dispatch({ type: "view/move", viewId: second, targetStackId: stackId, edge: "right" });
	expect(workspace.store.getState().tiled.type).toBe("split");
	expect(activeView(workspace.store.getState())?.id).toBe(second);
	expect(Object.keys(workspace.store.getState().views)).toHaveLength(2);
	workspace.store.dispatch({ type: "view/close", viewId: second });
	expect(workspace.store.getState().tiled.type).toBe("stack");
	expect(Object.keys(workspace.store.getState().stacks)).toHaveLength(1);
	expect(activeView(workspace.store.getState())?.type).toBe("/one");
});

test("floating and docking keep the document identity", () => {
	const workspace = createReadingWorkspace("/one", "One");
	const id = activeView(workspace.store.getState())!.id;
	workspace.store.applyCommand("view/float");
	expect(Object.keys(workspace.store.getState().floating)).toHaveLength(1);
	expect(activeView(workspace.store.getState())?.id).toBe(id);
	workspace.store.applyCommand("view/dock");
	expect(Object.keys(workspace.store.getState().floating)).toHaveLength(0);
	expect(activeView(workspace.store.getState())?.id).toBe(id);
});

test("closing the last tab leaves a usable empty workspace", () => {
	const workspace = createReadingWorkspace("/one", "One");
	workspace.store.applyCommand("view/close");
	expect(Object.keys(workspace.store.getState().views)).toHaveLength(0);
	workspace.open("/two", "Two");
	expect(activeView(workspace.store.getState())?.type).toBe("/two");
});

test("workspace URLs retain deployment prefixes, queries, and fragments and reject foreign origins", () => {
	const base = "https://example.com/notes/start.html";
	expect(documentUrl("chapter.html?q=test#heading", base)).toBe("/notes/chapter.html?q=test#heading");
	expect(documentUrl("https://outside.test/notes/", base)).toBeNull();
	expect(documentUrl("javascript:alert(1)", base)).toBeNull();
	expect(documentUrl("//outside.test/", base)).toBeNull();
});
