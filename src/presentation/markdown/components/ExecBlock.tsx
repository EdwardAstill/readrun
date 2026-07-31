import type React from "react";

import { Textarea } from "../../components/ui/Textarea.tsx";
import { CodePanel, CodePanelActions } from "./CodePanel.tsx";

export interface ExecBlockProps {
	language?: string;
	source: string;
	/** Unique identifier for this block, used by code modal and execution client. */
	blockId?: string;
	/** Whether the block initially shows only the header (collapsed). */
	collapsed?: boolean;
	/** Whether the source is editable in-browser. */
	editable?: boolean;
	/** Whether to show the enlarge button (opens code modal). */
	canEnlarge?: boolean;
	/** Whether to show the run button (triggers client-side execution). */
	canRun?: boolean;
}

function encodeSource(source: string): string {
	return Buffer.from(source, "utf8").toString("base64");
}

export function ExecBlock(props: ExecBlockProps): React.JSX.Element {
	const lang = props.language ?? "text";
	const blockId =
		props.blockId ?? `exec-${Math.random().toString(36).slice(2, 9)}`;
	const collapsedClass = props.collapsed ? " exec-block--collapsed" : "";
	const canEnlarge = props.canEnlarge !== false;
	const canRun = props.canRun !== false;
	const editable = props.editable === true;

	return (
		<CodePanel
			blockId={blockId}
			className={`block-exec exec-block${collapsedClass}`}
			language={lang}
			source={props.source}
			actions={
				<CodePanelActions
					blockId={blockId}
					canRun={canRun}
					canEnlarge={canEnlarge}
					canCopy
					canEdit={editable}
				/>
			}
		>
			{editable ? (
				<Textarea
					className="exec-editable"
					data-editable-source={blockId}
					defaultValue={props.source}
					spellCheck={false}
				/>
			) : null}
			<script
				type="text/plain"
				data-source={blockId}
				dangerouslySetInnerHTML={{ __html: encodeSource(props.source) }}
			/>
			<output className="exec-output" data-output={blockId} />
		</CodePanel>
	);
}
