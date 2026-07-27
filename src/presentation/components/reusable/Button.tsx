import type React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ControlSize = "compact" | "default";

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	controlSize?: ControlSize;
}

export function Button({
	variant = "secondary",
	controlSize = "compact",
	className,
	type = "button",
	...props
}: ButtonProps): React.JSX.Element {
	const classes = [
		"rr-control",
		`rr-control--${controlSize}`,
		"rr-button",
		`rr-button--${variant}`,
		className,
	]
		.filter(Boolean)
		.join(" ");

	return <button {...props} type={type} className={classes} />;
}
