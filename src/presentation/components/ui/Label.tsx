import type React from "react";

import { cn } from "./cn.ts";

export function Label({
	className,
	...props
}: React.ComponentProps<"label">): React.JSX.Element {
	return (
		<label
			data-slot="label"
			className={cn(
				"flex items-center gap-2 text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}
