import type React from "react";

import type { ControlSize } from "./Button.tsx";

export interface TextInputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	controlSize?: ControlSize;
}

export function TextInput({
	controlSize = "compact",
	className,
	type = "text",
	...props
}: TextInputProps): React.JSX.Element {
	const classes = [
		"rr-control",
		`rr-control--${controlSize}`,
		"rr-input",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return <input {...props} type={type} className={classes} />;
}
