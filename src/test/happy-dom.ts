import { Window } from "happy-dom";

export function installHappyDom(
	url = "https://readrun.test/",
): () => void {
	const window = new Window({ url });
	const values: Record<string, unknown> = {
		window,
		self: window,
		document: window.document,
		navigator: window.navigator,
		location: window.location,
		CSS: window.CSS,
		Node: window.Node,
		Element: window.Element,
		HTMLElement: window.HTMLElement,
		HTMLInputElement: window.HTMLInputElement,
		HTMLButtonElement: window.HTMLButtonElement,
		HTMLFormElement: window.HTMLFormElement,
		HTMLFieldSetElement: window.HTMLFieldSetElement,
		HTMLTextAreaElement: window.HTMLTextAreaElement,
		HTMLSelectElement: window.HTMLSelectElement,
		MutationObserver: window.MutationObserver,
		Event: window.Event,
		MouseEvent: window.MouseEvent,
		PointerEvent: window.PointerEvent,
		KeyboardEvent: window.KeyboardEvent,
		FocusEvent: window.FocusEvent,
		FormData: window.FormData,
		getComputedStyle: window.getComputedStyle.bind(window),
		requestAnimationFrame: window.requestAnimationFrame.bind(window),
		cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
		IS_REACT_ACT_ENVIRONMENT: true,
	};
	const previous = new Map<
		string,
		{ existed: boolean; descriptor?: PropertyDescriptor }
	>();
	for (const [key, value] of Object.entries(values)) {
		previous.set(key, {
			existed: Object.prototype.hasOwnProperty.call(globalThis, key),
			descriptor: Object.getOwnPropertyDescriptor(globalThis, key),
		});
		Object.defineProperty(globalThis, key, {
			configurable: true,
			writable: true,
			value,
		});
	}

	return () => {
		window.close();
		for (const [key, original] of previous) {
			if (original.existed && original.descriptor) {
				Object.defineProperty(globalThis, key, original.descriptor);
			} else {
				Reflect.deleteProperty(globalThis, key);
			}
		}
	};
}
