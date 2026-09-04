import type React from "react";
import { Copy, Maximize2, Play } from "lucide-react";

import { Button } from "../../components/ui/Button.tsx";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../components/ui/Card.tsx";

export interface CodePanelProps {
	blockId?: string;
	className?: string;
	language?: string;
	preClassName?: string;
	codeClassName?: string;
	source?: string;
	children?: React.ReactNode;
	actions?: React.ReactNode;
}

export function CodePanel(props: CodePanelProps): React.JSX.Element {
	const language = props.language ?? "code";
	const className = ["code-panel", props.className].filter(Boolean).join(" ");

	return (
		<Card
			className={`${className} gap-0 overflow-hidden bg-muted py-0`}
			data-block-id={props.blockId}
			data-language={language}
		>
			<CardHeader className="gap-2 px-3 py-2">
				<CardTitle className="self-center text-sm">{language}</CardTitle>
				{props.actions ? (
					<CardAction className="flex items-center gap-1 self-center">
						{props.actions}
					</CardAction>
				) : null}
			</CardHeader>
			<CardContent className="p-0" data-code-source>
				<pre
					className={["w-full", props.preClassName]
						.filter(Boolean)
						.join(" ")}
				>
					<code className={props.codeClassName}>{props.source ?? ""}</code>
				</pre>
			</CardContent>
			{props.children ? (
				<CardContent className="p-0">{props.children}</CardContent>
			) : null}
		</Card>
	);
}

export interface CodePanelActionsProps {
	blockId?: string;
	canRun?: boolean;
	canEnlarge?: boolean;
	canCopy?: boolean;
}

export function CodePanelActions(
	props: CodePanelActionsProps,
): React.JSX.Element {
	return (
		<>
			{props.canRun ? (
				<Button
					size="icon-sm"
					variant="ghost"
					className="code-action-btn exec-run-btn"
					data-block-id={props.blockId}
					aria-label="Run"
					title="Run"
				>
					<Play aria-hidden="true" />
				</Button>
			) : null}
			{props.canEnlarge ? (
				<Button
					size="icon-sm"
					variant="ghost"
					className="code-action-btn exec-enlarge-btn"
					data-block-id={props.blockId}
					aria-label="Enlarge"
					title="Enlarge"
				>
					<Maximize2 aria-hidden="true" />
				</Button>
			) : null}
			{props.canCopy ? (
				<Button
					size="icon-sm"
					variant="ghost"
					className="code-action-btn code-copy-btn"
					data-block-id={props.blockId}
					aria-label="Copy"
					title="Copy"
				>
					<Copy aria-hidden="true" />
				</Button>
			) : null}
		</>
	);
}
