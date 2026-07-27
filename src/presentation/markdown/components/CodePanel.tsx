import type React from "react";

import { Button } from "../../components/reusable/Button.tsx";

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
		<section
			className={className}
			data-block-id={props.blockId}
			data-language={language}
		>
			<div className="code-panel__header">
				<span className="code-panel__language">{language}</span>
				<div className="code-panel__actions">{props.actions}</div>
			</div>
			<pre className={props.preClassName}>
				{props.highlightedHtml ? (
					<code
						className={props.codeClassName}
						dangerouslySetInnerHTML={{ __html: props.highlightedHtml }}
					/>
				) : (
					<code className={props.codeClassName}>{props.source ?? ""}</code>
				)}
			</pre>
			{props.children}
		</section>
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
					variant="primary"
					className="code-action-btn code-action-btn--primary exec-run-btn"
					data-block-id={props.blockId}
				>
					Run
				</Button>
			) : null}
			{props.canEnlarge ? (
				<Button
					className="code-action-btn exec-enlarge-btn"
					data-block-id={props.blockId}
				>
					Enlarge
				</Button>
			) : null}
			{props.canCopy ? (
				<Button
					className="code-action-btn code-copy-btn"
					data-block-id={props.blockId}
				>
					Copy
				</Button>
			) : null}
			{props.canEdit ? (
				<Button className="code-action-btn exec-toggle-btn">
					Edit
				</Button>
			) : null}
		</>
	);
}
