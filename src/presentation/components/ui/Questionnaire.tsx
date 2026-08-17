"use client";

import { Questionnaire as QuestionnairePrimitive } from "@shadcn/react/questionnaire";
import * as React from "react";

import { buttonVariants, type ButtonProps } from "./Button.tsx";
import { cn } from "./cn.ts";
import { IconPlaceholder } from "./IconPlaceholder.tsx";

export function Questionnaire({
	className,
	...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Root>): React.JSX.Element {
	return (
		<QuestionnairePrimitive.Root
			data-slot="questionnaire"
			className={cn(
				"cn-questionnaire flex w-full min-w-0 flex-col",
				className,
			)}
			{...props}
		/>
	);
}

export function QuestionnaireProgress({
	className,
	...props
}: React.ComponentProps<
	typeof QuestionnairePrimitive.Progress
>): React.JSX.Element {
	return (
		<QuestionnairePrimitive.Progress
			data-slot="questionnaire-progress"
			className={cn(
				"cn-questionnaire-progress min-h-[1lh] w-fit min-w-[14ch] font-medium text-muted-foreground tabular-nums",
				className,
			)}
			{...props}
		/>
	);
}

export function QuestionnaireItem({
	className,
	...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Item>): React.JSX.Element {
	return (
		<QuestionnairePrimitive.Item
			data-slot="questionnaire-item"
			className={cn(
				"cn-questionnaire-item min-w-0 border-0 p-0 outline-none",
				className,
			)}
			{...props}
		/>
	);
}

export function QuestionnaireTitle({
	className,
	...props
}: React.ComponentProps<
	typeof QuestionnairePrimitive.Title
>): React.JSX.Element {
	return (
		<QuestionnairePrimitive.Title
			data-slot="questionnaire-title"
			className={cn(
				"cn-questionnaire-title cn-font-heading text-pretty",
				className,
			)}
			{...props}
		/>
	);
}

export function QuestionnaireDescription({
	className,
	...props
}: React.ComponentProps<
	typeof QuestionnairePrimitive.Description
>): React.JSX.Element {
	return (
		<QuestionnairePrimitive.Description
			data-slot="questionnaire-description"
			className={cn(
				"cn-questionnaire-description text-pretty text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

export function QuestionnaireChoices({
	className,
	...props
}: React.ComponentProps<
	typeof QuestionnairePrimitive.Choices
>): React.JSX.Element {
	return (
		<QuestionnairePrimitive.Choices
			data-slot="questionnaire-choices"
			className={cn(
				"cn-questionnaire-choices group/questionnaire-choices grid min-w-0 gap-2",
				className,
			)}
			{...props}
		/>
	);
}

export function QuestionnaireChoice({
	children,
	className,
	...props
}: React.ComponentProps<
	typeof QuestionnairePrimitive.Choice
>): React.JSX.Element {
	return (
		<QuestionnairePrimitive.Choice
			data-slot="questionnaire-choice"
			className={cn(
				"cn-questionnaire-choice group/questionnaire-choice relative flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-start transition-colors outline-none select-none hover:bg-muted/50 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
				"data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
				"data-checked:border-primary data-checked:bg-primary/5",
				className,
			)}
			{...props}
		>
			<QuestionnairePrimitive.ChoiceInput
				data-slot="questionnaire-choice-input"
				className="cn-questionnaire-choice-input absolute inset-0 z-10 size-full cursor-pointer opacity-0"
			/>
			<span
				aria-hidden="true"
				data-slot="questionnaire-choice-indicator"
				className="cn-questionnaire-choice-indicator pointer-events-none relative mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border border-input bg-background group-data-[type=radio]/questionnaire-choice:rounded-full group-data-checked/questionnaire-choice:border-primary group-data-checked/questionnaire-choice:bg-primary group-data-checked/questionnaire-choice:text-primary-foreground"
			>
				<span
					data-slot="questionnaire-choice-indicator-dot"
					className="cn-questionnaire-choice-indicator-dot hidden size-1.5 rounded-full bg-current group-data-[type=checkbox]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block"
				/>
				<IconPlaceholder
					data-slot="questionnaire-choice-indicator-check"
					className="cn-questionnaire-choice-indicator-check hidden size-3 group-data-[type=radio]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block"
					lucide="CheckIcon"
					tabler="IconCheck"
					hugeicons="Tick02Icon"
					phosphor="CheckIcon"
					remixicon="RiCheckLine"
				/>
			</span>
			<QuestionnairePrimitive.ChoiceLabel
				data-slot="questionnaire-choice-label"
				className="cn-questionnaire-choice-label cn-questionnaire-choice-content flex min-w-0 flex-1 flex-col leading-snug"
			>
				{children}
			</QuestionnairePrimitive.ChoiceLabel>
			<QuestionnairePrimitive.ChoiceShortcut
				data-slot="questionnaire-choice-shortcut"
				className="cn-questionnaire-choice-shortcut cn-questionnaire-shortcut pointer-events-none ms-auto hidden shrink-0 group-data-[shortcut]/questionnaire-choice:inline-flex"
			/>
		</QuestionnairePrimitive.Choice>
	);
}

export function QuestionnaireChoiceDescription({
	className,
	...props
}: React.ComponentProps<"span">): React.JSX.Element {
	return (
		<span
			data-slot="questionnaire-choice-description"
			className={cn(
				"cn-questionnaire-choice-description text-sm text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

export function QuestionnaireInput({
	className,
	...props
}: React.ComponentProps<
	typeof QuestionnairePrimitive.Input
>): React.JSX.Element {
	return (
		<div
			data-slot="questionnaire-input-wrapper"
			className="cn-questionnaire-input-wrapper group/questionnaire-input relative min-w-0"
		>
			<QuestionnairePrimitive.Input
				data-slot="questionnaire-input"
				className={cn(
					"cn-questionnaire-input min-h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-base transition-[color,box-shadow,background-color] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 sm:min-h-0 sm:text-sm dark:bg-input/30",
					className,
				)}
				{...props}
			/>
		</div>
	);
}

export function QuestionnaireError({
	className,
	...props
}: React.ComponentProps<
	typeof QuestionnairePrimitive.Error
>): React.JSX.Element {
	return (
		<QuestionnairePrimitive.Error
			data-slot="questionnaire-error"
			className={cn(
				"cn-questionnaire-error mt-2 text-sm text-destructive",
				className,
			)}
			{...props}
		/>
	);
}

export function QuestionnaireActions({
	className,
	...props
}: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="questionnaire-actions"
			className={cn(
				"cn-questionnaire-actions grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2",
				className,
			)}
			{...props}
		/>
	);
}

type QuestionnaireButtonProps = Pick<ButtonProps, "size" | "variant">;

export function QuestionnairePrevious({
	children,
	className,
	size = "default",
	variant = "outline",
	...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Previous> &
	QuestionnaireButtonProps): React.JSX.Element {
	return (
		<QuestionnairePrimitive.Previous
			data-slot="questionnaire-previous"
			data-size={size}
			data-variant={variant}
			className={cn(
				buttonVariants({ size, variant }),
				"cn-questionnaire-previous col-start-1 row-start-1 min-h-11 justify-self-start sm:min-h-0",
				className,
			)}
			{...props}
		>
			{children ?? "Previous"}
		</QuestionnairePrimitive.Previous>
	);
}

export function QuestionnaireSkip({
	children,
	className,
	size = "default",
	variant = "outline",
	...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Skip> &
	QuestionnaireButtonProps): React.JSX.Element {
	return (
		<QuestionnairePrimitive.Skip
			data-slot="questionnaire-skip"
			data-size={size}
			data-variant={variant}
			className={cn(
				buttonVariants({ size, variant }),
				"cn-questionnaire-skip col-start-2 row-start-1 min-h-11 justify-self-end sm:min-h-0",
				className,
			)}
			{...props}
		>
			{children ?? "Skip"}
		</QuestionnairePrimitive.Skip>
	);
}

export function QuestionnaireNext({
	children,
	className,
	size = "default",
	variant = "default",
	...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Next> &
	QuestionnaireButtonProps): React.JSX.Element {
	return (
		<QuestionnairePrimitive.Next
			data-slot="questionnaire-next"
			data-size={size}
			data-variant={variant}
			className={cn(
				buttonVariants({ size, variant }),
				"cn-questionnaire-next col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
				className,
			)}
			{...props}
		>
			{children ?? "Next"}
		</QuestionnairePrimitive.Next>
	);
}

export function QuestionnaireSubmit({
	children,
	className,
	size = "default",
	variant = "default",
	...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Submit> &
	QuestionnaireButtonProps): React.JSX.Element {
	return (
		<QuestionnairePrimitive.Submit
			data-slot="questionnaire-submit"
			data-size={size}
			data-variant={variant}
			className={cn(
				buttonVariants({ size, variant }),
				"cn-questionnaire-submit col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
				className,
			)}
			{...props}
		>
			{children ?? "Submit"}
		</QuestionnairePrimitive.Submit>
	);
}
