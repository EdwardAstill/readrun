import * as React from "react";

import type { GradeResult, SubmittedAnswer } from "../../domain/quiz/model.ts";
import { Button } from "../components/ui/Button.tsx";
import {
	QuestionnaireChoice,
	QuestionnaireChoices,
	QuestionnaireDescription,
	QuestionnaireInput,
	QuestionnaireItem,
	QuestionnaireTitle,
} from "../components/ui/Questionnaire.tsx";
import { cn } from "../components/ui/cn.ts";
import type {
	RenderedQuizItem,
	RenderedQuizQuestion,
} from "./model.ts";
import { ReadRunRichText } from "./ReadRunRichText.tsx";

export interface QuizStepProps {
	instanceId: string;
	formName: string;
	item: RenderedQuizItem;
	answer?: SubmittedAnswer;
	grade?: GradeResult;
	hintVisible: boolean;
	onAnswer: (answer: SubmittedAnswer) => void;
	onToggleHint: () => void;
}

export function QuizStep(props: QuizStepProps): React.JSX.Element {
	const headingId = `${props.instanceId}-${props.item.id}-title`;
	if (props.item.type === "info") {
		return (
			<QuestionnaireItem
				name={props.formName}
				aria-labelledby={headingId}
				data-quiz-step={props.item.id}
			>
				<QuestionnaireTitle id={headingId} className="sr-only">
					Information
				</QuestionnaireTitle>
				<QuestionnaireDescription
					render={<div />}
					className="max-w-none text-foreground"
				>
					<ReadRunRichText value={props.item.content} />
				</QuestionnaireDescription>
			</QuestionnaireItem>
		);
	}

	const locked = props.grade !== undefined;
	return (
		<QuestionnaireItem
			name={props.formName}
			multiple={props.item.type === "multi"}
			required
			aria-labelledby={headingId}
			data-quiz-step={props.item.id}
		>
			<QuestionnaireTitle id={headingId} className="sr-only">
				{props.item.prompt.text}
			</QuestionnaireTitle>
			<QuestionnaireDescription
				render={<div />}
				className="mb-5 max-w-none text-base font-medium text-foreground [&_p]:my-0"
			>
				<ReadRunRichText value={props.item.prompt} />
			</QuestionnaireDescription>

			{props.item.type === "freetext" ? (
				<QuestionnaireInput
					aria-label={`Answer: ${props.item.prompt.text}`}
					value={typeof props.answer === "string" ? props.answer : ""}
					disabled={locked}
					onInput={(event) => props.onAnswer(event.currentTarget.value)}
				/>
			) : (
				<ChoiceAnswers
					question={props.item}
					answer={props.answer}
					grade={props.grade}
					onAnswer={props.onAnswer}
				/>
			)}

			{props.item.hint ? (
				<div className="mt-4">
					<Button
						type="button"
						variant="outline"
						size="sm"
						aria-expanded={props.hintVisible}
						aria-controls={`${props.instanceId}-${props.item.id}-hint`}
						onClick={props.onToggleHint}
					>
						{props.hintVisible ? "Hide hint" : "Show hint"}
					</Button>
					{props.hintVisible ? (
						<div
							id={`${props.instanceId}-${props.item.id}-hint`}
							className="mt-3 rounded-lg border bg-muted/40 p-3 text-sm"
						>
							<ReadRunRichText value={props.item.hint} />
						</div>
					) : null}
				</div>
			) : null}

			{props.grade ? (
				<Feedback question={props.item} grade={props.grade} />
			) : null}
		</QuestionnaireItem>
	);
}

function ChoiceAnswers(props: {
	question: Exclude<RenderedQuizQuestion, { type: "freetext" }>;
	answer?: SubmittedAnswer;
	grade?: GradeResult;
	onAnswer: (answer: SubmittedAnswer) => void;
}): React.JSX.Element {
	const locked = props.grade !== undefined;
	return (
		<QuestionnaireChoices>
			{props.question.choices.map((choice) => {
				const value =
					props.question.type === "truefalse"
						? choice.content.text.trim().toLowerCase() === "true"
						: choice.id;
				const checked =
					props.question.type === "multi"
						? Array.isArray(props.answer) && props.answer.includes(choice.id)
						: props.answer === value;
				const selectedWrong = Boolean(
					props.grade && checked && !choice.correct,
				);
				return (
					<QuestionnaireChoice
						key={choice.id}
						value={String(value)}
						checked={checked}
						disabled={locked}
						className={cn(
							props.grade && choice.correct &&
								"border-primary bg-primary/10",
							selectedWrong && "border-destructive bg-destructive/10",
						)}
						onChange={(event) => {
							if (props.question.type === "multi") {
								const current = Array.isArray(props.answer) ? props.answer : [];
								props.onAnswer(
									event.currentTarget.checked
										? [...new Set([...current, choice.id])]
										: current.filter((id) => id !== choice.id),
								);
							} else {
								props.onAnswer(value);
							}
						}}
					>
						<ReadRunRichText value={choice.content} />
					</QuestionnaireChoice>
				);
			})}
		</QuestionnaireChoices>
	);
}

function Feedback(props: {
	question: RenderedQuizQuestion;
	grade: GradeResult;
}): React.JSX.Element {
	return (
		<div
			className={cn(
				"mt-5 rounded-lg border p-4 text-sm",
				props.grade.correct
					? "border-primary/50 bg-primary/5"
					: "border-destructive/50 bg-destructive/5",
			)}
			role="status"
			aria-live="polite"
		>
			<p className="font-semibold">
				{props.grade.correct ? "Correct." : "Incorrect."}
			</p>
			{!props.grade.correct ? (
				<p className="mt-1 text-muted-foreground">
					Expected answer: {expectedAnswerText(props.question)}
				</p>
			) : null}
			{props.question.explanation ? (
				<div className="mt-3 border-t pt-3 text-foreground">
					<ReadRunRichText value={props.question.explanation} />
				</div>
			) : null}
		</div>
	);
}

export function expectedAnswerText(question: RenderedQuizQuestion): string {
	if (question.type === "freetext") return question.answer.expected;
	if (question.type === "truefalse") {
		return question.correctAnswer ? "True" : "False";
	}
	return question.choices
		.filter((choice) => choice.correct)
		.map((choice) => choice.content.text)
		.join(", ");
}
