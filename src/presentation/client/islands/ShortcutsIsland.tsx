import type React from "react";

import { Modal } from "../../components/reusable/Modal.tsx";
import { closeOverlay } from "../overlay.ts";
import { SHORTCUT_BINDINGS, SHORTCUT_GROUPS } from "../shortcuts.ts";

export interface ShortcutsIslandProps {
	open: boolean;
}

export function ShortcutsIsland(
	props: ShortcutsIslandProps,
): React.JSX.Element {
	return (
		<Modal
			id="shortcuts-overlay"
			open={props.open}
			onClose={() => closeOverlay("shortcuts-overlay")}
			className="overlay"
			contentClassName="overlay__card"
			ariaLabelledBy="shortcuts-dialog-title"
		>
			<div className="overlay__header">
				<h2 className="overlay__title" id="shortcuts-dialog-title">
					Keyboard Shortcuts
				</h2>
				<button
					type="button"
					className="overlay__close-hint"
					data-overlay-close="shortcuts-overlay"
					aria-label="Close keyboard shortcuts"
					onClick={() => closeOverlay("shortcuts-overlay")}
				>
					<span aria-hidden="true">×</span>
				</button>
			</div>
			<div className="shortcuts-grid settings-panel">
				{SHORTCUT_GROUPS.map((group) => (
					<section key={group.label} aria-labelledby={`shortcuts-${group.label}`}>
						<h3
							className="shortcuts-grid__category"
							id={`shortcuts-${group.label}`}
						>
							{group.label}
						</h3>
						{group.items.map(([label, action]) => (
							<div className="shortcuts-grid__row" key={action}>
								<span className="shortcuts-grid__label">{label}</span>
								<span>{formatBinding(SHORTCUT_BINDINGS[action])}</span>
							</div>
						))}
					</section>
				))}
			</div>
		</Modal>
	);
}

function formatBinding(binding: string): React.ReactNode {
	return binding.split(/\s+/).map((key, index) => (
		<kbd key={`${key}-${index}`}>{key}</kbd>
	));
}
