// Ported from edcn registry/tree/components/tree.tsx: non-sortable keyDown/select.
// https://github.com/EdwardAstill/edcn/tree/main/registry/tree
// Native details retain SSR links, folder-page links, search, and saved expansion.
export function bindTreeKeyboard(root: HTMLElement): () => void {
	const visibleRows = (): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>("[data-tree-item]")).filter((row) => {
		for (let element: HTMLElement | null = row; element && element !== root; element = element.parentElement) {
			if (element.hidden || element.style.display === "none" || element.matches(".rr-hidden, .rr-page-nav-hidden, .rr-resource-hidden")) return false;
			if (element.matches(".rr-focus-self > details > summary")) return false;
			if (element.tagName === "DETAILS" && !(element as HTMLDetailsElement).open && row !== element.querySelector(":scope > summary")) return false;
		}
		return true;
	});
	const sync = (): void => {
		const visible = visibleRows();
		const focused = document.activeElement instanceof Element ? document.activeElement.closest<HTMLElement>("[data-tree-item]") : null;
		const current = root.querySelector<HTMLElement>("a[aria-current='page']")?.closest<HTMLElement>("[data-tree-item]");
		const selected = (focused && visible.includes(focused) ? focused : null) ?? (current && visible.includes(current) ? current : visible[0]);
		for (const row of root.querySelectorAll<HTMLElement>("[data-tree-item]")) {
			const active = row.matches("[aria-current='page']") || Boolean(row.querySelector("a[aria-current='page']"));
			row.toggleAttribute("data-active", active);
			row.toggleAttribute("data-selected", row === selected);
			row.setAttribute("aria-selected", String(row === selected));
			row.tabIndex = row === selected ? 0 : -1;
			if (row.tagName === "SUMMARY") {
				const branch = row.parentElement as HTMLDetailsElement;
				row.setAttribute("aria-expanded", String(branch.open));
				const group = branch.querySelector<HTMLElement>(":scope > [role='group']");
				if (branch.open && group?.id) row.setAttribute("aria-owns", group.id);
				else row.removeAttribute("aria-owns");
			}
		}
	};
	const select = (row: HTMLElement | undefined): void => {
		row?.focus();
		sync();
	};
	const keyDown = (event: KeyboardEvent): void => {
		if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
		const target = event.target;
		if (!(target instanceof Element)) return;
		const row = target.closest<HTMLElement>("[data-tree-item]");
		if (!row || !root.contains(row)) return;
		const branch = row.tagName === "SUMMARY" ? row.parentElement as HTMLDetailsElement : null;
		if (event.key === " " || event.key === "Enter") {
			// Authored folder pages remain real links, separate from folder expansion.
			if (target.closest("a[href]") && event.key === "Enter") return;
			if (branch && !target.closest("a[href]")) {
				event.preventDefault();
				branch.open = !branch.open;
				sync();
			} else if (event.key === " ") {
				event.preventDefault();
				(target.closest<HTMLAnchorElement>("a[href]") ?? row).click();
			}
			return;
		}
		if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
		event.preventDefault();
		if (branch && ((event.key === "ArrowLeft" && branch.open) || (event.key === "ArrowRight" && !branch.open))) {
			branch.open = event.key === "ArrowRight";
			sync();
			return;
		}
		if (event.key === "ArrowLeft" || event.key === "ArrowRight") return;
		const visible = visibleRows();
		const index = visible.indexOf(row);
		const next = event.key === "Home" ? visible[0] : event.key === "End" ? visible.at(-1) : event.key === "ArrowUp" ? visible[index - 1] : visible[index + 1];
		select(next);
	};
	const observer = new MutationObserver((records) => {
		for (const record of records) {
			if (record.attributeName !== "aria-current" || !(record.target instanceof HTMLElement) || record.target.getAttribute("aria-current") !== "page") continue;
			for (let ancestor = record.target.parentElement; ancestor && ancestor !== root; ancestor = ancestor.parentElement) {
				if (ancestor.tagName === "DETAILS") (ancestor as HTMLDetailsElement).open = true;
			}
		}
		sync();
	});
	observer.observe(root, { subtree: true, attributes: true, attributeFilter: ["open", "aria-current", "class", "hidden", "style"] });
	root.addEventListener("keydown", keyDown);
	root.addEventListener("focusin", sync);
	root.addEventListener("toggle", sync, true);
	sync();
	return () => {
		observer.disconnect();
		root.removeEventListener("keydown", keyDown);
		root.removeEventListener("focusin", sync);
		root.removeEventListener("toggle", sync, true);
	};
}
