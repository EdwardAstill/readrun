import { describe, expect, test } from "bun:test";

import { resolveTableSizing } from "./table-interactive.ts";

describe("resolveTableSizing", () => {
	test("shrinks compact columns and distributes spare width by unmet demand", () => {
		const sizing = resolveTableSizing({
			columnCount: 3,
			selectedColWidthCh: 30,
			chPx: 1,
			availableWidthPx: 102,
			borderWidthPx: 2,
			contentWidthPx: [20, 60, 40],
		});

		expect(sizing.colWidthsPx).toEqual([20, 45, 35]);
		expect(sizing.tableWidthPx).toBe(100);
		expect(sizing.wrapWidthPx).toBe(102);
		expect(sizing.overflows).toBe(false);
		expect(sizing.contentFits).toBe(false);
	});

	test("leaves unused width when all content demand is satisfied", () => {
		const sizing = resolveTableSizing({
			columnCount: 3,
			selectedColWidthCh: 30,
			chPx: 1,
			availableWidthPx: 152,
			borderWidthPx: 2,
			contentWidthPx: [20, 35, 40],
		});

		expect(sizing.colWidthsPx).toEqual([20, 35, 40]);
		expect(sizing.tableWidthPx).toBe(95);
		expect(sizing.wrapWidthPx).toBe(97);
		expect(sizing.overflows).toBe(false);
		expect(sizing.contentFits).toBe(true);
	});

	test("allows horizontal overflow when base widths cannot fit", () => {
		const sizing = resolveTableSizing({
			columnCount: 5,
			selectedColWidthCh: 30,
			chPx: 1,
			availableWidthPx: 102,
			borderWidthPx: 2,
			contentWidthPx: [20, 60, 40, 50, 10],
		});

		expect(sizing.colWidthsPx).toEqual([20, 30, 30, 30, 10]);
		expect(sizing.tableWidthPx).toBe(120);
		expect(sizing.wrapWidthPx).toBe(102);
		expect(sizing.overflows).toBe(true);
		expect(sizing.contentFits).toBe(false);
	});

	test("falls back to equal selected widths when measurement is unavailable", () => {
		const sizing = resolveTableSizing({
			columnCount: 2,
			selectedColWidthCh: 10,
			chPx: 8,
			availableWidthPx: 602,
			borderWidthPx: 2,
		});

		expect(sizing.colWidthsPx).toEqual([80, 80]);
		expect(sizing.tableWidthPx).toBe(160);
		expect(sizing.colWidthPx).toBe(80);
		expect(sizing.wrapWidthPx).toBe(162);
		expect(sizing.overflows).toBe(false);
		expect(sizing.contentFits).toBe(true);
	});
});
