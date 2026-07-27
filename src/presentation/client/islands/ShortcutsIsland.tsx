import type React from "react";

import {
	DialogHeader,
	DialogTitle,
} from "../../components/ui/Dialog.tsx";
import { Kbd, KbdGroup } from "../../components/ui/Kbd.tsx";
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
			ariaLabelledBy="shortcuts-dialog-title"
		>
			<DialogHeader>
				<DialogTitle id="shortcuts-dialog-title">
					Keyboard Shortcuts
				</DialogTitle>
			</DialogHeader>
			<div className="grid gap-4">
				{SHORTCUT_GROUPS.map((group) => (
					<section
						className="grid gap-2"
						key={group.label}
						aria-labelledby={`shortcuts-${group.label}`}
					>
						<h3
							className="text-sm font-medium"
							id={`shortcuts-${group.label}`}
						>
							{group.label}
						</h3>
						{group.items.map(([label, action]) => (
							<div className="flex items-center justify-between gap-4" key={action}>
								<span>{label}</span>
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
	return (
		<KbdGroup>
			{binding.split(/\s+/).map((key, index) => (
				<Kbd key={`${key}-${index}`}>{key}</Kbd>
			))}
		</KbdGroup>
	);
}
