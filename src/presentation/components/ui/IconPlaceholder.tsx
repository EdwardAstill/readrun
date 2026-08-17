import {
	CheckIcon,
	ChevronRightIcon,
	CircleIcon,
	MoreHorizontalIcon,
	PanelLeftIcon,
	XIcon,
	type LucideIcon,
} from "lucide-react";
import type React from "react";

const icons: Record<string, LucideIcon> = {
	CheckIcon,
	ChevronRightIcon,
	MoreHorizontalIcon,
	PanelLeftIcon,
	XIcon,
};

export function IconPlaceholder({
	lucide,
	tabler: _tabler,
	hugeicons: _hugeicons,
	phosphor: _phosphor,
	remixicon: _remixicon,
	...props
}: React.ComponentProps<"svg"> & {
	lucide: string;
	tabler?: string;
	hugeicons?: string;
	phosphor?: string;
	remixicon?: string;
}): React.JSX.Element {
	const Icon = icons[lucide] ?? CircleIcon;
	return <Icon {...props} />;
}
