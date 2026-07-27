import { Dialog } from "@base-ui/react/dialog";
import type React from "react";
import type { ReactNode } from "react";

export interface ModalProps {
	id: string;
	open: boolean;
	onClose: () => void;
	className: string;
	openClassName?: string;
	contentClassName: string;
	scrimClassName?: string;
	ariaLabel?: string;
	ariaLabelledBy?: string;
	initialFocusRef?: React.RefObject<HTMLElement | null>;
	finalFocusRef?: React.RefObject<HTMLElement | null>;
	children: ReactNode;
}

/** Shared dialog shell backed by Base UI's focus and dismissal behavior. */
export function Modal(props: ModalProps): React.JSX.Element {
	const openClassName = props.openClassName ?? "open";

	return (
		<Dialog.Root
			open={props.open}
			onOpenChange={(open) => {
				if (!open) props.onClose();
			}}
		>
			<Dialog.Portal
				id={props.id}
				className={`${props.className} ${openClassName}`}
			>
				{props.scrimClassName ? (
					<Dialog.Backdrop className={props.scrimClassName} />
				) : null}
				<Dialog.Popup
					className={`${props.contentClassName} rr-modal-popup`}
					aria-modal="true"
					aria-label={props.ariaLabel}
					aria-labelledby={props.ariaLabelledBy}
					initialFocus={props.initialFocusRef}
					finalFocus={props.finalFocusRef}
				>
					{props.children}
					<Dialog.Close className="rr-visually-hidden" tabIndex={-1}>
						Close dialog
					</Dialog.Close>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
