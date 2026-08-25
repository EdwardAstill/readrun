import renderMathInElement from "katex/contrib/auto-render";
import "katex/dist/katex.min.css";

export function renderPageMath(root: HTMLElement = document.body): void {
	renderMathInElement(root, {
		delimiters: [
			{ left: "$$", right: "$$", display: true },
			{ left: "$", right: "$", display: false },
		],
		ignoredTags: [
			"script",
			"noscript",
			"style",
			"textarea",
			"pre",
			"code",
			"option",
		],
		throwOnError: false,
	});
}
