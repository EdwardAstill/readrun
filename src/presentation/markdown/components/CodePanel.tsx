import type React from "react";

import { Button } from "../../components/reusable/Button.tsx";
import { ButtonGroup } from "../../components/ui/ButtonGroup.tsx";
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
	highlightedHtml?: string;
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
					<CardAction className="self-center">
						<ButtonGroup>{props.actions}</ButtonGroup>
					</CardAction>
				) : null}
			</CardHeader>
			<CardContent className="p-0" data-code-source>
				<pre
					className={["w-full", props.preClassName]
						.filter(Boolean)
						.join(" ")}
				>
					{props.highlightedHtml ? (
						<code
							className={props.codeClassName}
							dangerouslySetInnerHTML={{ __html: props.highlightedHtml }}
						/>
					) : (
						<code className={props.codeClassName}>{props.source ?? ""}</code>
					)}
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
	canEdit?: boolean;
}

export function CodePanelActions(
	props: CodePanelActionsProps,
): React.JSX.Element {
	return (
		<>
			{props.canRun ? (
				<Button
					size="sm"
					variant="default"
					className="code-action-btn code-action-btn--primary exec-run-btn"
					data-block-id={props.blockId}
				>
					Run
				</Button>
			) : null}
			{props.canEnlarge ? (
				<Button
					size="sm"
					variant="ghost"
					className="code-action-btn exec-enlarge-btn"
					data-block-id={props.blockId}
				>
					Enlarge
				</Button>
			) : null}
			{props.canCopy ? (
				<Button
					size="sm"
					variant="ghost"
					className="code-action-btn code-copy-btn"
					data-block-id={props.blockId}
				>
					Copy
				</Button>
			) : null}
			{props.canEdit ? (
				<Button
					size="sm"
					variant="ghost"
					className="code-action-btn exec-toggle-btn"
				>
					Edit
				</Button>
			) : null}
		</>
	);
}
