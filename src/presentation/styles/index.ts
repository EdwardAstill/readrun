import { baseStyles } from "./base.ts";
import { themeStyles } from "./themes.ts";
import { markdownStyles } from "./markdown.ts";
import { shellStyles } from "./shell.ts";
import { uiStyles } from "./ui.ts";
import { mobileStyles } from "./mobile.ts";
import { execBlockStyles } from "./exec-blocks.ts";
import { quizStyles } from "./quiz.ts";
import { viewerStyles } from "./viewers.ts";
import { controlStyles } from "./controls.ts";
import { shellActionStyles } from "./shell-actions.ts";

export const presentationStyles = [
	baseStyles,
	themeStyles,
	markdownStyles,
	shellStyles,
	uiStyles,
	mobileStyles,
	execBlockStyles,
	quizStyles,
	viewerStyles,
	controlStyles,
	shellActionStyles,
].join("\n");
