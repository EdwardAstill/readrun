import * as React from "react";

import { renderPageMath } from "../client/math.ts";
import type { RenderedRichText } from "./model.ts";

export function ReadRunRichText(props: {
	value: RenderedRichText;
}): React.JSX.Element {
	const root = React.useRef<HTMLDivElement>(null);
	React.useEffect(() => {
		if (root.current) renderPageMath(root.current);
	});

	return <div ref={root} dangerouslySetInnerHTML={{ __html: props.value.html }} />;
}
