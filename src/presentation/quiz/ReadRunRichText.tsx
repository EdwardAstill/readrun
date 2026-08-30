import * as React from "react";

import { renderPageMath } from "../client/math.ts";
import type { RenderedRichText } from "./model.ts";

export function ReadRunRichText(props: {
	value: RenderedRichText;
}): React.JSX.Element {
	const root = React.useRef<HTMLElement>(null);
	const setRoot = React.useCallback((element: HTMLElement | null) => {
		root.current = element;
	}, []);
	React.useEffect(() => {
		if (root.current) renderPageMath(root.current);
	});

	return (
		<div
			ref={setRoot}
			dangerouslySetInnerHTML={{ __html: props.value.html }}
		/>
	);
}
