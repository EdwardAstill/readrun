import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { installHappyDom } from "../../test/happy-dom.ts";
import { Tree, type TreeViewNode } from "../components/reusable/Tree.tsx";
import { SidebarProvider } from "../components/ui/Sidebar.tsx";
import { bindTreeKeyboard } from "./tree-keyboard.ts";

let restoreDom: () => void;
let teardown: (() => void) | undefined;
beforeAll(() => { restoreDom = installHappyDom(); });
afterEach(() => { teardown?.(); document.body.replaceChildren(); });
afterAll(() => restoreDom());

function mount(nodes: TreeViewNode[]): HTMLElement {
	document.body.innerHTML = renderToStaticMarkup(<SidebarProvider><Tree ariaLabel="Files" nodes={nodes} /></SidebarProvider>);
	const root = document.querySelector<HTMLElement>("[data-edcn-tree]")!;
	teardown = bindTreeKeyboard(root);
	return root;
}

function key(row: HTMLElement, key: string): void {
	row.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

test("edcn keyboard traversal skips collapsed descendants and preserves nested collapse state", () => {
	const root = mount([
		{ id: "folder", label: "Folder", children: [
			{ id: "nested", label: "Nested", open: false, children: [{ id: "hidden", label: "Hidden", href: "/hidden" }] },
			{ id: "file", label: "File", href: "/file" },
		] },
		{ id: "last", label: "Last", href: "/last" },
	]);
	const folder = root.querySelector<HTMLElement>('[data-tree-item="folder"]')!;
	const nested = root.querySelector<HTMLElement>('[data-tree-item="nested"]')!;
	const file = root.querySelector<HTMLElement>('[data-tree-item="file"]')!;
	const last = root.querySelector<HTMLElement>('[data-tree-item="last"]')!;
	folder.focus();
	key(folder, "ArrowDown");
	expect(document.activeElement).toBe(last);
	key(last, "Home");
	key(folder, "ArrowRight");
	expect(folder.getAttribute("aria-expanded")).toBe("true");
	key(folder, "ArrowDown");
	expect(document.activeElement).toBe(nested);
	key(nested, "ArrowDown");
	expect(document.activeElement).toBe(file);
	key(file, "Home");
	key(folder, "ArrowLeft");
	key(folder, "ArrowRight");
	expect(nested.getAttribute("aria-expanded")).toBe("false");
	key(folder, "End");
	expect(document.activeElement).toBe(last);
	expect(root.querySelectorAll('[data-tree-item][tabindex="0"]')).toHaveLength(1);
});

test("Space activates a file while Enter toggles an empty folder", () => {
	const root = mount([
		{ id: "empty", label: "Empty", isBranch: true, children: [] },
		{ id: "file", label: "File", href: "/file" },
	]);
	const folder = root.querySelector<HTMLElement>("summary")!;
	folder.focus();
	key(folder, "Enter");
	expect(folder.getAttribute("aria-expanded")).toBe("true");
	const file = root.querySelector<HTMLAnchorElement>("a")!;
	let activated = false;
	file.addEventListener("click", (event) => { activated = true; event.preventDefault(); });
	file.focus();
	key(file, " ");
	expect(activated).toBe(true);
});

test("switching tabs updates active styling and reveals the new file without preventing folder collapse", async () => {
	const root = mount([
		{ id: "old", label: "Old", href: "/old", ariaCurrent: "page" },
		{ id: "folder", label: "Folder", children: [{ id: "new", label: "New", href: "/new" }] },
	]);
	const old = root.querySelector<HTMLElement>('[data-tree-item="old"]')!;
	const next = root.querySelector<HTMLElement>('[data-tree-item="new"]')!;
	old.removeAttribute("aria-current");
	next.setAttribute("aria-current", "page");
	await Bun.sleep(0);
	expect(old.hasAttribute("data-active")).toBe(false);
	expect(next.hasAttribute("data-active")).toBe(true);
	expect(next.tabIndex).toBe(0);
	const folder = root.querySelector<HTMLElement>("summary")!;
	expect(folder.getAttribute("aria-expanded")).toBe("true");
	folder.focus();
	key(folder, "ArrowLeft");
	await Bun.sleep(0);
	expect(folder.getAttribute("aria-expanded")).toBe("false");
});

test("tree arrows skip navigation-focus and search-hidden rows", () => {
	const root = mount([
		{ id: "first", label: "First", href: "/first" },
		{ id: "hidden", label: "Hidden", href: "/hidden", itemClassName: "rr-resource-hidden" },
		{ id: "last", label: "Last", href: "/last" },
	]);
	const first = root.querySelector<HTMLElement>('[data-tree-item="first"]')!;
	first.focus();
	key(first, "ArrowDown");
	expect(document.activeElement?.getAttribute("data-tree-item")).toBe("last");
});
