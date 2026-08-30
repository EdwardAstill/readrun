"use client";

import { Questionnaire as QuestionnairePrimitive } from "@shadcn/react/questionnaire";
import * as React from "react";

import { buttonClassName, type ButtonProps } from "./primitives";
import { cn } from "./cn";

export function Questionnaire({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Root>): React.JSX.Element {
  return (
    <QuestionnairePrimitive.Root
      data-slot="questionnaire"
      className={cn("cn-questionnaire flex w-full min-w-0 flex-col", className)}
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
        "min-h-[1lh] w-fit min-w-[14ch] font-medium text-muted-foreground tabular-nums",
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
      className={cn("min-w-0 border-0 p-0 outline-none", className)}
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
      className={cn("text-pretty", className)}
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
      className={cn("text-pretty text-muted-foreground", className)}
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
      className={cn("grid min-w-0 gap-2", className)}
      {...props}
    />
  );
}

export function QuestionnaireChoice({
  children,
  className,
  labelId,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choice> & {
  labelId: string;
}): React.JSX.Element {
  return (
    <QuestionnairePrimitive.Choice
      render={<div />}
      data-slot="questionnaire-choice"
      className={cn(
        "group/questionnaire-choice relative flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-start transition-colors outline-none select-none hover:bg-muted/50 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        "data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "data-checked:border-primary data-checked:bg-primary/5",
        className,
      )}
      {...props}
    >
      <QuestionnairePrimitive.ChoiceInput
        aria-labelledby={labelId}
        data-slot="questionnaire-choice-input"
        className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        data-slot="questionnaire-choice-indicator"
        className="pointer-events-none relative mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border border-input bg-background group-data-[type=radio]/questionnaire-choice:rounded-full group-data-checked/questionnaire-choice:border-primary group-data-checked/questionnaire-choice:bg-primary group-data-checked/questionnaire-choice:text-primary-foreground"
      >
        <span className="hidden size-1.5 rounded-full bg-current group-data-[type=checkbox]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block" />
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="hidden size-3 group-data-[type=radio]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block"
        >
          <path d="m3 8 3 3 7-7" />
        </svg>
      </span>
      <QuestionnairePrimitive.ChoiceLabel
        render={<div id={labelId} />}
        data-slot="questionnaire-choice-label"
        className="flex min-w-0 flex-1 flex-col leading-snug"
      >
        {children}
      </QuestionnairePrimitive.ChoiceLabel>
      <QuestionnairePrimitive.ChoiceShortcut
        data-slot="questionnaire-choice-shortcut"
        className="pointer-events-none ms-auto hidden shrink-0 group-data-[shortcut]/questionnaire-choice:inline-flex"
      />
    </QuestionnairePrimitive.Choice>
  );
}

export function QuestionnaireInput({
  className,
  ...props
}: React.ComponentProps<
  typeof QuestionnairePrimitive.Input
>): React.JSX.Element {
  return (
    <QuestionnairePrimitive.Input
      data-slot="questionnaire-input"
      className={cn(
        "min-h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 sm:min-h-0 sm:text-sm",
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
        "grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2",
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
      className={cn(
        buttonClassName(variant, size),
        "col-start-1 row-start-1 min-h-11 justify-self-start sm:min-h-0",
        className,
      )}
      {...props}
    >
      {children ?? "Previous"}
    </QuestionnairePrimitive.Previous>
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
      className={cn(
        buttonClassName(variant, size),
        "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
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
      className={cn(
        buttonClassName(variant, size),
        "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className,
      )}
      {...props}
    >
      {children ?? "Submit"}
    </QuestionnairePrimitive.Submit>
  );
}
