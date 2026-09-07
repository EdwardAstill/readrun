import { closeOverlay, getActiveOverlay, subscribeOverlays } from "./overlay.ts";

/** Keep server-rendered navigation trees mounted so filtering and page swaps work. */
export function mountNavigationDialogs(root: ParentNode = document): () => void {
	const dialogs = Array.from(root.querySelectorAll<HTMLDialogElement>("[data-navigation-dialog]"));
	let opener: HTMLElement | null = null;
	const sync = (): void => {
		const active = getActiveOverlay();
		for (const dialog of dialogs) {
			if (dialog.id !== active && dialog.open) {
				dialog.close();
				opener?.focus();
			}
		}
		for (const dialog of dialogs) {
			if (dialog.id === active && !dialog.open) {
				opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
				dialog.showModal();
				dialog.querySelector<HTMLInputElement>("input")?.focus();
			}
		}
	};
	const onCancel = (event: Event): void => {
		event.preventDefault();
		closeOverlay((event.currentTarget as HTMLDialogElement).id);
	};
	const onClick = (event: Event): void => {
		const target = event.target;
		if (!(target instanceof Element)) return;
		const dialog = event.currentTarget as HTMLDialogElement;
		if (target.closest("[data-close-navigation-dialog], a[href]")) {
			closeOverlay(dialog.id);
		} else if (target === dialog && event instanceof MouseEvent) {
			const bounds = dialog.getBoundingClientRect();
			if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeOverlay(dialog.id);
		}
	};
	for (const dialog of dialogs) {
		dialog.addEventListener("cancel", onCancel);
		dialog.addEventListener("click", onClick);
	}
	const unsubscribe = subscribeOverlays(sync);
	sync();
	return () => {
		unsubscribe();
		for (const dialog of dialogs) {
			dialog.removeEventListener("cancel", onCancel);
			dialog.removeEventListener("click", onClick);
			if (dialog.open) dialog.close();
		}
	};
}
