import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Modal } from "../../components/reusable/Modal.tsx";

interface LightboxImage {
	src: string;
	alt: string;
}

export function LightboxIsland(): React.JSX.Element {
	const [image, setImage] = useState<LightboxImage | null>(null);
	const returnFocusRef = useRef<HTMLElement | null>(null);
	const close = useCallback(() => setImage(null), []);

	useEffect(() => {
		const handleClick = (event: MouseEvent): void => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			const image = target.closest("img");
			if (!(image instanceof HTMLImageElement) || !isContentImage(image)) return;
			if (
				!image.closest(
					".readrun-main, .readrun-article, .exec-output, .viewer, .markdown-body",
				)
			) {
				return;
			}
			if (image.closest("#lightbox")) return;

			const focusTarget = image.closest<HTMLElement>("a[href], button") ?? image;
			if (focusTarget === image && !image.hasAttribute("tabindex")) {
				image.tabIndex = -1;
			}
			returnFocusRef.current = focusTarget;
			setImage({ src: image.src, alt: image.alt });
		};

		document.addEventListener("click", handleClick);
		return () => document.removeEventListener("click", handleClick);
	}, []);

	return (
		<Modal
			id="lightbox"
			open={image !== null}
			onClose={close}
			className="lightbox"
			contentClassName="lightbox__content"
			ariaLabel={image?.alt ? `Image preview: ${image.alt}` : "Image preview"}
			finalFocusRef={returnFocusRef}
		>
			{image ? <img id="lightbox-img" src={image.src} alt={image.alt} /> : null}
		</Modal>
	);
}

export function isContentImage(image: HTMLImageElement): boolean {
	return image.naturalWidth >= 50 && image.naturalHeight >= 50;
}
