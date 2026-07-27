// Client-side behavior for readrun-rendered Markdown tables.

import { createElement } from "react";
import { createRoot } from "react-dom/client";

import { buttonVariants } from "../components/ui/Button.tsx";
import { Slider } from "../components/ui/Slider.tsx";

const DEFAULT_MIN_COL_WIDTH_CH = 10;
const DEFAULT_MAX_COL_WIDTH_CH = 100;
const TABLE_BORDER_PX = 2;
const CONTENT_WIDTH_BUFFER_PX = 16;

export interface TableSizingInput {
	columnCount: number;
	selectedColWidthCh: number;
	chPx: number;
	availableWidthPx: number;
	contentWidthPx?: number[];
	borderWidthPx?: number;
}

export interface TableSizing {
	colWidthsPx: number[];
	colWidthPx: number;
	tableWidthPx: number;
	wrapWidthPx: number;
	overflows: boolean;
	contentFits: boolean;
}

export function resolveTableSizing(input: TableSizingInput): TableSizing {
	const columnCount = Math.max(0, input.columnCount);
	const chPx = Math.max(0, input.chPx);
	const borderWidthPx = input.borderWidthPx ?? TABLE_BORDER_PX;
	const availableWidthPx = Math.max(0, input.availableWidthPx);
	const availableTableWidthPx = Math.max(0, availableWidthPx - borderWidthPx);

	if (columnCount === 0 || chPx === 0) {
		return {
			colWidthsPx: [],
			colWidthPx: 0,
			tableWidthPx: 0,
			wrapWidthPx: 0,
			overflows: false,
			contentFits: false,
		};
	}

	const selectedWidthPx = input.selectedColWidthCh * chPx;
	const contentWidthsPx = Array.from({ length: columnCount }, (_, index) =>
		Math.max(0, input.contentWidthPx?.[index] ?? selectedWidthPx),
	);
	const baseWidthsPx = contentWidthsPx.map((contentWidthPx) =>
		Math.min(contentWidthPx, selectedWidthPx),
	);
	const baseTableWidthPx = sum(baseWidthsPx);

	let colWidthsPx = baseWidthsPx;
	if (baseTableWidthPx <= availableTableWidthPx) {
		const spareWidthPx = availableTableWidthPx - baseTableWidthPx;
		const unmetWidthsPx = contentWidthsPx.map((contentWidthPx, index) =>
			Math.max(0, contentWidthPx - baseWidthsPx[index]!),
		);
		const totalUnmetWidthPx = sum(unmetWidthsPx);
		const distributableWidthPx = Math.min(spareWidthPx, totalUnmetWidthPx);

		if (distributableWidthPx > 0 && totalUnmetWidthPx > 0) {
			colWidthsPx = baseWidthsPx.map(
				(baseWidthPx, index) =>
					baseWidthPx +
					(distributableWidthPx * unmetWidthsPx[index]!) /
						totalUnmetWidthPx,
			);
		}
	}

	const tableWidthPx = sum(colWidthsPx);
	const overflows = tableWidthPx > availableTableWidthPx + 2;
	const contentFits = contentWidthsPx.every(
		(contentWidthPx, index) => colWidthsPx[index]! >= contentWidthPx - 1,
	);

	return {
		colWidthsPx,
		colWidthPx: tableWidthPx / columnCount,
		tableWidthPx,
		wrapWidthPx: overflows ? availableWidthPx : tableWidthPx + borderWidthPx,
		overflows,
		contentFits,
	};
}

export function initInteractiveTables(root?: ParentNode): () => void {
	const scope = root ?? (typeof document !== "undefined" ? document : null);
	if (!scope) {
		return () => {};
	}

	const teardowns = Array.from(
		scope.querySelectorAll<HTMLElement>(".rr-table-wrap"),
		initTable,
	);

	return () => {
		for (const teardown of teardowns) {
			teardown();
		}
	};
}

function initTable(wrap: HTMLElement): () => void {
	if (wrap.dataset.rrMounted === "true") return () => {};
	wrap.dataset.rrMounted = "true";

	const uid = wrap.dataset.rrTable;
	if (!uid) return () => {};
	const table = wrap.querySelector<HTMLTableElement>(
		`[data-rr-table="${uid}"]`,
	);
	if (!table) return () => {};

	const sliderMount = wrap.querySelector<HTMLElement>(
		`[data-rr-slider-input="${uid}"]`,
	);
	const valueEl = wrap.querySelector<HTMLElement>(
		`[data-rr-value="${uid}"]`,
	);
	const scrollViewport = wrap.querySelector<HTMLElement>(
		`[data-rr-scroll="${uid}"]`,
	);
	const stickyButton = wrap.querySelector<HTMLButtonElement>(
		`[data-rr-sticky="${uid}"]`,
	);
	const toolbar = wrap.querySelector<HTMLElement>(".rr-table-toolbar");
	const sliderControl = wrap.querySelector<HTMLElement>(".rr-table-slider");
	let stickyEnabled = stickyButton?.ariaPressed !== "false";
	let selectedColWidthCh = readPositiveInt(
		sliderMount?.dataset.rrSliderValue,
		DEFAULT_MIN_COL_WIDTH_CH,
	);

	if (!scrollViewport) return () => {};
	const sliderRoot = sliderMount ? createRoot(sliderMount) : null;

	const applyTableSizing = (): void => {
		const cols = table.querySelectorAll("col");
		if (cols.length === 0) return;

		const availableWidthPx = wrap.parentElement?.clientWidth ?? wrap.clientWidth;
		const sizing = resolveTableSizing({
			columnCount: cols.length,
			selectedColWidthCh,
			chPx: measureCh(table),
			availableWidthPx,
			contentWidthPx: measureColumnContentWidths(table, cols.length),
		});

		cols.forEach((col, index) => {
			(col as HTMLElement).style.width = `${sizing.colWidthsPx[index] ?? 0}px`;
		});
		table.style.width = `${sizing.tableWidthPx}px`;

		const isNaturallyNarrow = sizing.wrapWidthPx < availableWidthPx - 4;
		sliderControl?.classList.toggle(
			"rr-table-slider--hidden",
			sizing.contentFits && !sizing.overflows && isNaturallyNarrow,
		);

		const toolbarWidthPx = toolbar?.scrollWidth ?? 0;
		wrap.style.width = `${Math.max(sizing.wrapWidthPx, toolbarWidthPx)}px`;
	};

	const checkOverflow = (): void => {
		const overflows = table.offsetWidth > scrollViewport.clientWidth + 2;
		wrap.classList.toggle("rr-table-wrap--overflow", overflows);
		wrap.classList.toggle(
			"rr-table-wrap--sticky",
			overflows && stickyEnabled,
		);
		scrollViewport.tabIndex = overflows ? 0 : -1;

		if (stickyButton) {
			stickyButton.disabled = !overflows;
			stickyButton.className = buttonVariants({
				variant: stickyEnabled ? "default" : "outline",
				size: "sm",
			});
			stickyButton.ariaPressed = String(stickyEnabled);
			stickyButton.textContent = stickyEnabled ? "Sticky on" : "Sticky off";
		}
	};

	const syncTable = (): void => {
		applyTableSizing();
		checkOverflow();
	};

	const handleSliderValueChange = (
		values: number | readonly number[],
	): void => {
		const value = typeof values === "number" ? values : values[0];
		if (typeof value !== "number") return;
		selectedColWidthCh = value;
		if (valueEl) valueEl.textContent = `${value}ch`;
		syncTable();
	};

	const handleStickyClick = (): void => {
		stickyEnabled = !stickyEnabled;
		checkOverflow();
	};

	sliderRoot?.render(
		createElement(Slider, {
			min: readPositiveInt(
				sliderMount?.dataset.rrSliderMin,
				DEFAULT_MIN_COL_WIDTH_CH,
			),
			max: readPositiveInt(
				sliderMount?.dataset.rrSliderMax,
				DEFAULT_MAX_COL_WIDTH_CH,
			),
			step: 1,
			defaultValue: [selectedColWidthCh],
			onValueChange: handleSliderValueChange,
			"aria-labelledby": `${uid}-slider-label`,
		}),
	);
	stickyButton?.addEventListener("click", handleStickyClick);
	syncTable();
	requestAnimationFrameIfAvailable(syncTable);

	const resizeObserver =
		typeof ResizeObserver !== "undefined"
			? new ResizeObserver(syncTable)
			: null;
	resizeObserver?.observe(wrap.parentElement ?? wrap);

	return () => {
		sliderRoot?.unmount();
		stickyButton?.removeEventListener("click", handleStickyClick);
		resizeObserver?.disconnect();
		delete wrap.dataset.rrMounted;
	};
}

function measureColumnContentWidths(
	table: HTMLTableElement,
	columnCount: number,
): number[] {
	const widths = Array.from({ length: columnCount }, () => 0);
	const measurer = document.createElement("span");
	measurer.style.cssText =
		"position:absolute;visibility:hidden;white-space:nowrap;pointer-events:none;";
	(table.parentElement ?? document.body).append(measurer);

	for (const row of table.rows) {
		Array.from(row.cells).forEach((cell, index) => {
			if (index >= columnCount) return;
			const style = getComputedStyle(cell);
			measurer.style.font = style.font;
			measurer.replaceChildren(
				...Array.from(cell.childNodes).map((node) => node.cloneNode(true)),
			);
			const horizontalPadding =
				parseFloat(style.paddingLeft || "0") +
				parseFloat(style.paddingRight || "0");
			widths[index] = Math.max(
				widths[index]!,
				measurer.getBoundingClientRect().width +
					horizontalPadding +
					CONTENT_WIDTH_BUFFER_PX,
			);
		});
	}

	measurer.remove();
	return widths;
}

function measureCh(element: HTMLElement): number {
	const probe = document.createElement("span");
	probe.textContent = "0";
	probe.style.cssText =
		"position:absolute;visibility:hidden;inline-size:1ch;pointer-events:none;";
	probe.style.font = getComputedStyle(element).font;
	document.body.append(probe);
	const width = probe.getBoundingClientRect().width;
	probe.remove();
	return width > 0 ? width : 8;
}

function readPositiveInt(value: string | undefined, fallback: number): number {
	const parsed = parseInt(value ?? "", 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function requestAnimationFrameIfAvailable(callback: FrameRequestCallback): void {
	if (typeof requestAnimationFrame === "function") {
		requestAnimationFrame(callback);
	}
}

function sum(values: number[]): number {
	return values.reduce((total, value) => total + value, 0);
}
