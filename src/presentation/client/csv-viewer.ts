// Client-side CSV viewer: sort, filter, paginate.
// Uses event delegation to handle remounts cleanly.

const ROWS_PER_PAGE = 50;

interface CsvData {
	header: string[];
	rows: string[][];
}

export function initCsvViewers(root?: ParentNode): () => void {
	const scope = root ?? (typeof document !== "undefined" ? document : null);
	if (!scope) {
		return () => {};
	}

	const handler = createDelegatedHandler();
	scope.addEventListener("click", handler);
	scope.addEventListener("input", handler as EventListener);

	return () => {
		scope.removeEventListener("click", handler);
		scope.removeEventListener("input", handler as EventListener);
	};
}

function createDelegatedHandler(): (event: Event) => void {
	return (event: Event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;

		// Sort on column header click
		const th = target.closest<HTMLElement>("th.csv-sortable");
		if (th) {
			handleSortClick(th);
			return;
		}

		// Filter input
		const filterInput = target.closest<HTMLInputElement>("input.csv-filter");
		if (filterInput && event.type === "input") {
			handleFilterInput(filterInput);
			return;
		}

		// Pagination
		const prevBtn = target.closest<HTMLButtonElement>("button[data-csv-prev]");
		if (prevBtn) {
			handlePageChange(prevBtn, -1);
			return;
		}

		const nextBtn = target.closest<HTMLButtonElement>("button[data-csv-next]");
		if (nextBtn) {
			handlePageChange(nextBtn, 1);
			return;
		}
	};
}

/* ── Sort ── */

function handleSortClick(th: HTMLElement): void {
	const blockId = th.dataset.csvBlock;
	if (!blockId) return;
	const columnIndex = Number.parseInt(th.dataset.columnIndex ?? "", 10);
	if (Number.isNaN(columnIndex)) return;

	const data = readCsvData(blockId);
	if (!data) return;

	const currentDir = th.dataset.sortDir;
	let nextDir: "asc" | "desc";

	if (currentDir === "asc") {
		nextDir = "desc";
	} else {
		nextDir = "asc";
	}

	// Reset sort indicators on all headers in this block
	const viewer = th.closest<HTMLElement>(
		`[data-csv-block="${CSS.escape(blockId)}"]`,
	);
	if (viewer) {
		for (const otherTh of viewer.querySelectorAll<HTMLElement>(
			"th.csv-sortable",
		)) {
			delete otherTh.dataset.sortDir;
		}
	}

	th.dataset.sortDir = nextDir;

	const sorted = [...data.rows];
	const multiplier = nextDir === "asc" ? 1 : -1;
	sorted.sort((a, b) => {
		const aVal = a[columnIndex] ?? "";
		const bVal = b[columnIndex] ?? "";
		const aNum = Number.parseFloat(aVal);
		const bNum = Number.parseFloat(bVal);

		if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
			return (aNum - bNum) * multiplier;
		}

		return aVal.localeCompare(bVal) * multiplier;
	});

	renderPage(blockId, sorted, 0);
}

/* ── Filter ── */

function handleFilterInput(input: HTMLInputElement): void {
	const blockId = input.dataset.csvFilter;
	if (!blockId) return;

	const data = readCsvData(blockId);
	if (!data) return;

	const query = input.value.trim().toLowerCase();
	let filtered: string[][];

	if (query === "") {
		filtered = data.rows;
	} else {
		filtered = data.rows.filter((row) =>
			row.some((cell) => cell.toLowerCase().includes(query)),
		);
	}

	renderPage(blockId, filtered, 0);
}

/* ── Pagination ── */

function handlePageChange(button: HTMLElement, delta: number): void {
	const blockId = button.dataset.csvPrev ?? button.dataset.csvNext;
	if (!blockId) return;

	const data = readCsvData(blockId);
	if (!data) return;

	const viewer = button.closest<HTMLElement>(
		`[data-csv-block="${CSS.escape(blockId)}"]`,
	);
	if (!viewer) return;

	const labelEl = viewer.querySelector<HTMLElement>(
		`[data-csv-page-label="${CSS.escape(blockId)}"]`,
	);
	if (!labelEl) return;

	// Parse current page from label "N / total"
	const match = labelEl.textContent?.match(/^(\d+)\s*\/\s*(\d+)$/);
	if (!match) return;

	const currentPage = Number.parseInt(match[1]!, 10) - 1; // 0-based
	const newPage = currentPage + delta;

	const filterInput = viewer.querySelector<HTMLInputElement>(
		`[data-csv-filter="${CSS.escape(blockId)}"]`,
	);
	const query = filterInput?.value.trim().toLowerCase() ?? "";

	let filtered: string[][];
	if (query === "") {
		filtered = data.rows;
	} else {
		filtered = data.rows.filter((row) =>
			row.some((cell) => cell.toLowerCase().includes(query)),
		);
	}

	renderPage(blockId, filtered, newPage);
}

/* ── Render ── */

function renderPage(blockId: string, rows: string[][], page: number): void {
	const viewer = document.querySelector<HTMLElement>(
		`[data-csv-block="${CSS.escape(blockId)}"]`,
	);
	if (!viewer) return;

	const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
	const clampedPage = Math.max(0, Math.min(page, totalPages - 1));
	const start = clampedPage * ROWS_PER_PAGE;
	const pageRows = rows.slice(start, start + ROWS_PER_PAGE);

	// Update table body
	const tbody = viewer.querySelector<HTMLElement>(
		`[data-csv-body="${CSS.escape(blockId)}"]`,
	);
	if (tbody) {
		tbody.textContent = "";
		for (const row of pageRows) {
			const tr = document.createElement("tr");
			for (const cell of row) {
				const td = document.createElement("td");
				td.textContent = cell;
				tr.appendChild(td);
			}
			tbody.appendChild(tr);
		}
	}

	// Update page info
	const pageInfo = viewer.querySelector<HTMLElement>(
		`[data-csv-page-info="${CSS.escape(blockId)}"]`,
	);
	if (pageInfo) {
		pageInfo.textContent = `${rows.length} rows / ${totalPages} page${totalPages !== 1 ? "s" : ""}`;
	}

	// Update page label
	const pageLabel = viewer.querySelector<HTMLElement>(
		`[data-csv-page-label="${CSS.escape(blockId)}"]`,
	);
	if (pageLabel) {
		pageLabel.textContent = `${clampedPage + 1} / ${totalPages}`;
	}

	// Update prev/next button states
	const prevBtn = viewer.querySelector<HTMLButtonElement>(
		`[data-csv-prev="${CSS.escape(blockId)}"]`,
	);
	if (prevBtn) {
		prevBtn.disabled = clampedPage <= 0;
	}

	const nextBtn = viewer.querySelector<HTMLButtonElement>(
		`[data-csv-next="${CSS.escape(blockId)}"]`,
	);
	if (nextBtn) {
		nextBtn.disabled = clampedPage >= totalPages - 1;
	}
}

/* ── Data access ── */

function readCsvData(blockId: string): CsvData | null {
	const script = document.querySelector<HTMLScriptElement>(
		`script[data-csv-data="${CSS.escape(blockId)}"]`,
	);
	if (!script?.textContent) return null;

	try {
		return JSON.parse(script.textContent) as CsvData;
	} catch {
		return null;
	}
}
