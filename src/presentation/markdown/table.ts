// Custom GFM table processor for readrun-rendered Markdown tables.
// It replaces markdown-it table tokens with stable HTML that the client can
// measure and resize through one content-aware sizing path.

import { buttonVariants } from "../components/ui/Button.tsx";

const DEFAULT_COL_WIDTH = 28; // ch
const MIN_COL_WIDTH = 10;
const MAX_COL_WIDTH = 100;

type InlineRenderer = (token: any) => string;

export interface TableCell {
	text: string;
	html: string;
}

export interface TableData {
	headers: TableCell[];
	rows: TableCell[][];
	align: string[];
}

let tableCounter = 0;

export function resetReadrunTableCounter(): void {
	tableCounter = 0;
}

export function extractTableData(
	tokens: any[],
	tableOpenIdx: number,
	renderInline: InlineRenderer = defaultInlineRenderer,
): { data: TableData; endIdx: number } {
	let tableEnd = -1;
	for (let i = tableOpenIdx + 1; i < tokens.length; i++) {
		if (tokens[i].type === "table_close") {
			tableEnd = i;
			break;
		}
	}
	if (tableEnd < 0) throw new Error("table_close not found");

	const headers: TableCell[] = [];
	const rows: TableCell[][] = [];
	const align: string[] = [];
	let inHead = false;
	let inBody = false;
	let currentRow: TableCell[] = [];

	for (let i = tableOpenIdx + 1; i < tableEnd; i++) {
		const token = tokens[i];
		if (token.type === "thead_open") {
			inHead = true;
			continue;
		}
		if (token.type === "thead_close") {
			inHead = false;
			continue;
		}
		if (token.type === "tbody_open") {
			inBody = true;
			continue;
		}
		if (token.type === "tbody_close") {
			inBody = false;
			continue;
		}
		if (token.type === "tr_open") {
			currentRow = [];
			continue;
		}
		if (token.type === "tr_close") {
			if (inHead) {
				headers.push(...currentRow);
			} else if (inBody) {
				rows.push(currentRow);
			}
			continue;
		}
		if (token.type === "th_open" || token.type === "td_open") {
			const inline = tokens[i + 1];
			currentRow.push(inlineCell(inline, renderInline));

			const styleIdx = token.attrIndex("style");
			if (styleIdx >= 0) {
				const style: string = token.attrs[styleIdx][1] || "";
				if (inHead && align.length < currentRow.length) {
					if (style.includes("text-align:center")) align.push("center");
					else if (style.includes("text-align:right")) align.push("right");
					else align.push("left");
				}
			} else if (inHead && align.length < currentRow.length) {
				align.push("left");
			}
		}
	}

	return { data: { headers, rows, align }, endIdx: tableEnd };
}

export function processTableTokens(
	tokens: any[],
	renderInline: InlineRenderer = defaultInlineRenderer,
): void {
	const replacements: { start: number; end: number; html: string }[] = [];

	for (let i = 0; i < tokens.length; i++) {
		if (tokens[i]?.type !== "table_open") continue;

		try {
			const { data, endIdx } = extractTableData(tokens, i, renderInline);
			replacements.push({ start: i, end: endIdx, html: renderTableHtml(data) });
			i = endIdx;
		} catch {
			// Leave the original table tokens in place if extraction fails.
		}
	}

	for (let i = replacements.length - 1; i >= 0; i--) {
		const replacement = replacements[i]!;
		const htmlToken = new (tokens[replacement.start].constructor as any)(
			"html_block",
			"",
			0,
		);
		htmlToken.content = replacement.html;
		tokens.splice(
			replacement.start,
			replacement.end - replacement.start + 1,
			htmlToken,
		);
	}
}

function inlineCell(token: any, renderInline: InlineRenderer): TableCell {
	return {
		text: inlineText(token),
		html: token ? renderInline(token) : "",
	};
}

function inlineText(token: any): string {
	if (!token) return "";
	if (typeof token.content === "string" && token.content.trim() !== "") {
		return token.content.trim();
	}
	if (!Array.isArray(token.children)) return String(token.content ?? "").trim();
	return token.children
		.map((child: any) => child.content ?? "")
		.join("")
		.trim();
}

function defaultInlineRenderer(token: any): string {
	return escapeAttribute(inlineText(token));
}

function renderTableHtml(data: TableData): string {
	const { headers, rows, align } = data;
	const colCount = headers.length;
	const rowCount = rows.length;
	const charWidth = DEFAULT_COL_WIDTH;
	const tableWidth = colCount * charWidth;
	const uid = `rr-${++tableCounter}`;

	let html = `<div class="rr-table-wrap" data-rr-table="${uid}">`;
	html += `<div class="rr-table-toolbar">`;
	html += `<span class="rr-table-language">table</span>`;
	html += `<div class="rr-table-actions">`;
	html += `<span class="rr-table-info">${colCount} cols · ${rowCount} rows</span>`;
	html += `<label class="rr-table-slider" data-rr-slider="${uid}">`;
	html += `<span class="rr-table-slider-label">col width</span>`;
	html += `<input type="range" class="rr-table-width-slider" data-rr-slider-input="${uid}" min="${MIN_COL_WIDTH}" max="${MAX_COL_WIDTH}" value="${charWidth}" aria-label="Column width">`;
	html += `<output class="rr-table-width-value" data-rr-value="${uid}">${charWidth}ch</output>`;
	html += `</label>`;
	html += `<button type="button" class="${escapeAttribute(buttonVariants({ size: "sm" }))}" data-rr-sticky="${uid}" aria-label="Keep first column visible while scrolling" aria-pressed="true">Sticky on</button>`;
	html += `</div>`;
	html += `</div>`;

	html += `<div class="rr-table-scroll" data-rr-scroll="${uid}" tabindex="0" aria-label="Scrollable table">`;
	html += `<table class="rr-table" data-rr-table="${uid}" style="width: ${tableWidth}ch">`;
	html += "<colgroup>";
	for (let i = 0; i < colCount; i++) {
		html += `<col style="width: ${charWidth}ch">`;
	}
	html += "</colgroup>";

	html += "<thead><tr>";
	headers.forEach((header, index) => {
		html += `<th style="${alignStyle(align[index] ?? "left")}">${header.html}</th>`;
	});
	html += "</tr></thead>";

	html += "<tbody>";
	for (const row of rows) {
		html += "<tr>";
		headers.forEach((header, index) => {
			const cell = row[index] ?? { text: "", html: "" };
			html += `<td style="${alignStyle(align[index] ?? "left")}" data-label="${escapeAttribute(header.text)}">${cell.html}</td>`;
		});
		html += "</tr>";
	}
	html += "</tbody></table>";
	html += "</div>";
	html += "</div>";

	return html;
}

function alignStyle(align: string): string {
	if (align === "center") return "text-align: center";
	if (align === "right") return "text-align: right";
	return "";
}

function escapeAttribute(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
