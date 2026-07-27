import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Modal } from "../../components/reusable/Modal.tsx";

export interface LightboxImage {
	src: string;
	alt: string;
	width: number;
	height: number;
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
			setImage(readLightboxImage(image));
		};

		document.addEventListener("click", handleClick);
		return () => document.removeEventListener("click", handleClick);
	}, []);

	return (
		<Modal
			id="lightbox"
			open={image !== null}
			onClose={close}
			ariaLabel={image?.alt ? `Image preview: ${image.alt}` : "Image preview"}
			finalFocusRef={returnFocusRef}
		>
			{image ? <LightboxPreview image={image} onClose={close} /> : null}
		</Modal>
	);
}

export function LightboxPreview(props: {
	image: LightboxImage;
	onClose: () => void;
}): React.JSX.Element {
	return (
		<img
			id="lightbox-img"
			className="cursor-zoom-out"
			src={props.image.src}
			alt={props.image.alt}
			width={props.image.width}
			height={props.image.height}
			style={{
				width: `min(${props.image.width}px, 92vw, ${
					(92 * props.image.width) / props.image.height
				}vh)`,
			}}
			role="button"
			tabIndex={0}
			onClick={props.onClose}
			onKeyDown={(event) => {
				if (event.key !== "Enter" && event.key !== " ") return;
				event.preventDefault();
				props.onClose();
			}}
			aria-label="Close image preview"
		/>
	);
}

export function readLightboxImage(image: HTMLImageElement): LightboxImage {
	return {
		src: image.currentSrc || image.src,
		alt: image.alt,
		width: image.naturalWidth,
		height: image.naturalHeight,
	};
}

export function isContentImage(image: HTMLImageElement): boolean {
	return image.naturalWidth >= 50 && image.naturalHeight >= 50;
}
