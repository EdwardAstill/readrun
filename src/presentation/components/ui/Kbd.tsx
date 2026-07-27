import type React from "react";

import { cn } from "./cn.ts";

export function Kbd({
	className,
	...props
}: React.ComponentProps<"kbd">): React.JSX.Element {
	return (
		<kbd
			data-slot="kbd"
			className={cn(
				"pointer-events-none inline-flex h-5 min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground select-none",
				className,
			)}
			{...props}
		/>
	);
}

export function KbdGroup({
	className,
	...props
}: React.ComponentProps<"span">): React.JSX.Element {
	return (
		<span
			data-slot="kbd-group"
			className={cn("inline-flex items-center gap-1", className)}
			{...props}
		/>
	);
}
