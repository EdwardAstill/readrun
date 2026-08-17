import { baseStyles } from "./base.ts";
import { themeStyles } from "./themes.ts";
import { markdownStyles } from "./markdown.ts";
import { shellStyles } from "./shell.ts";
import { uiStyles } from "./ui.ts";
import { execBlockStyles } from "./exec-blocks.ts";
import { viewerStyles } from "./viewers.ts";

export const presentationStyles = [
	baseStyles,
	themeStyles,
	markdownStyles,
	shellStyles,
	uiStyles,
	execBlockStyles,
	viewerStyles,
].join("\n");
