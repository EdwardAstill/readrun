import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import type React from "react";

import { cn } from "./cn.ts";

export function DropdownMenu(props: MenuPrimitive.Root.Props) {
	return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

export function DropdownMenuPortal(props: MenuPrimitive.Portal.Props) {
	return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

export function DropdownMenuPositioner({
	className,
	...props
}: MenuPrimitive.Positioner.Props) {
	return (
		<MenuPrimitive.Positioner
			data-slot="dropdown-menu-positioner"
			className={cn("z-50 outline-none", className as string | undefined)}
			{...props}
		/>
	);
}

export function DropdownMenuContent({
	className,
	...props
}: MenuPrimitive.Popup.Props) {
	return (
		<MenuPrimitive.Popup
			data-slot="dropdown-menu-content"
			className={cn(
				"min-w-32 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none",
				className as string | undefined,
			)}
			{...props}
		/>
	);
}

export function DropdownMenuItem({
	className,
	...props
}: MenuPrimitive.Item.Props) {
	return (
		<MenuPrimitive.Item
			data-slot="dropdown-menu-item"
			className={cn(
				"relative flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground",
				className as string | undefined,
			)}
			{...props}
		/>
	);
}

export function DropdownMenuSeparator({
	className,
	...props
}: MenuPrimitive.Separator.Props) {
	return (
		<MenuPrimitive.Separator
			data-slot="dropdown-menu-separator"
			className={cn("-mx-1 my-1 h-px bg-border", className as string | undefined)}
			{...props}
		/>
	);
}
