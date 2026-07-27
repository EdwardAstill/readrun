import type React from "react";

import { Button, Input } from "../components/ui/index.ts";

export interface CsvViewerProps {
	source?: string;
	rows?: readonly string[][];
	caption?: string;
}

const ROWS_PER_PAGE = 50;

let csvBlockCounter = 0;

export function CsvViewer(props: CsvViewerProps): React.JSX.Element {
	const rows = props.rows ?? parseCsvRows(props.source ?? "");
	const blockId = `csv-${++csvBlockCounter}`;

	if (rows.length === 0) {
		return (
			<figure className="viewer viewer-csv" data-csv-block={blockId}>
				{props.caption ? <figcaption>{props.caption}</figcaption> : null}
				<p className="csv-empty">No data.</p>
			</figure>
		);
	}

	const header = rows[0]!;
	const bodyRows = rows.slice(1);
	const totalPages = Math.max(1, Math.ceil(bodyRows.length / ROWS_PER_PAGE));

	return (
		<figure className="viewer viewer-csv" data-csv-block={blockId}>
			{props.caption ? <figcaption>{props.caption}</figcaption> : null}
			<div className="csv-toolbar">
				<Input
					placeholder="Filter…"
					aria-label="Filter CSV rows"
					data-csv-filter={blockId}
				/>
				<span className="csv-page-info" data-csv-page-info={blockId}>
					{bodyRows.length} rows / {totalPages} page
					{totalPages !== 1 ? "s" : ""}
				</span>
			</div>
			<div className="csv-table-wrap">
				<table className="csv-table">
					<thead>
						<tr>
							{header.map((col, index) => (
								<th
									key={index}
									className="csv-sortable"
									data-column-index={index}
									data-csv-block={blockId}
								>
									{col}
								</th>
							))}
						</tr>
					</thead>
					<tbody data-csv-body={blockId}>
						{bodyRows.slice(0, ROWS_PER_PAGE).map((row, rowIndex) => (
							<tr key={rowIndex}>
								{row.map((cell, cellIndex) => (
									<td key={cellIndex}>{cell}</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{totalPages > 1 ? (
				<div className="csv-pagination" data-csv-pagination={blockId}>
					<Button variant="outline" size="sm" data-csv-prev={blockId} disabled>
						← Prev
					</Button>
					<span data-csv-page-label={blockId}>1 / {totalPages}</span>
					<Button variant="outline" size="sm" data-csv-next={blockId}>
						Next →
					</Button>
				</div>
			) : null}
			<script
				type="application/json"
				data-csv-data={blockId}
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({ header, rows: bodyRows }),
				}}
			/>
		</figure>
	);
}

function parseCsvRows(source: string): string[][] {
	return source
		.split(/\r?\n/)
		.filter((line) => line.trim() !== "")
		.map((line) => line.split(",").map((cell) => cell.trim()));
}
