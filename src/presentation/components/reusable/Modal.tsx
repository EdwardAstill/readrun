import type React from "react";
import type { ReactNode } from "react";

import {
	Dialog,
	DialogContent,
} from "../ui/Dialog.tsx";

export interface ModalProps {
	id: string;
	open: boolean;
	onClose: () => void;
	contentClassName?: string;
	ariaLabel?: string;
	ariaLabelledBy?: string;
	initialFocusRef?: React.RefObject<HTMLElement | null>;
	finalFocusRef?: React.RefObject<HTMLElement | null>;
	children: ReactNode;
}

/** Shared modal using the unmodified shadcn Dialog presentation. */
export function Modal(props: ModalProps): React.JSX.Element {
	return (
		<Dialog
			open={props.open}
			onOpenChange={(open) => {
				if (!open) props.onClose();
			}}
		>
			<DialogContent
				id={props.id}
				className={props.contentClassName}
				aria-modal="true"
				aria-label={props.ariaLabel}
				aria-labelledby={props.ariaLabelledBy}
				initialFocus={props.initialFocusRef}
				finalFocus={props.finalFocusRef}
			>
				{props.children}
			</DialogContent>
		</Dialog>
	);
}
