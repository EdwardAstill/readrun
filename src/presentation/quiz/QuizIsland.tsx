import * as React from "react";

import type { SubmittedAnswer } from "../../domain/quiz/model.ts";
import { Button } from "../components/ui/Button.tsx";
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../components/ui/Card.tsx";
import {
	Questionnaire,
	QuestionnaireActions,
	QuestionnaireNext,
	QuestionnairePrevious,
	QuestionnaireProgress,
	QuestionnaireSubmit,
} from "../components/ui/Questionnaire.tsx";
import type { RenderedQuizDefinition, RenderedQuizItem } from "./model.ts";
import { isRenderedQuizQuestion } from "./model.ts";
import { QuizResults } from "./QuizResults.tsx";
import { QuizStep } from "./QuizStep.tsx";
import {
	createQuizSession,
	hasAnswer,
	reduceQuizSession,
} from "./session.ts";

export function QuizIsland(props: {
	definition: RenderedQuizDefinition;
}): React.JSX.Element {
	const [state, dispatch] = React.useReducer(
		(current: ReturnType<typeof createQuizSession>, action: Parameters<typeof reduceQuizSession>[2]) =>
			reduceQuizSession(props.definition, current, action),
		props.definition,
		createQuizSession,
	);
	const resultsHeadingRef = React.useRef<HTMLHeadingElement>(null);
	const previousPhase = React.useRef(state.phase);

	React.useEffect(() => {
		if (state.phase === "complete") resultsHeadingRef.current?.focus();
		if (previousPhase.current === "complete" && state.phase === "active") {
			document
				.querySelector<HTMLElement>(
					`[data-quiz-instance="${CSS.escape(props.definition.instanceId)}"] [data-quiz-step="${CSS.escape(state.activeItemId)}"]`,
				)
				?.focus();
		}
		previousPhase.current = state.phase;
	}, [props.definition.instanceId, state.activeItemId, state.phase]);

	if (state.phase === "complete") {
		return (
			<QuizResults
				definition={props.definition}
				grades={state.grades}
				onRestart={() => dispatch({ type: "restart" })}
				headingRef={resultsHeadingRef}
			/>
		);
	}

	const activeIndex = props.definition.items.findIndex(
		(item) => item.id === state.activeItemId,
	);
	const activeItem = props.definition.items[activeIndex];
	const nextItem = props.definition.items[activeIndex + 1];
	const questionnaireItems = props.definition.items.map((item) =>
		toQuestionnaireItem(
			item,
			Boolean(state.grades[item.id]),
			formName(props.definition.instanceId, item.id),
		),
	);
	const activeAnswer = activeItem ? state.answers[activeItem.id] : undefined;
	const activeGrade = activeItem ? state.grades[activeItem.id] : undefined;

	const goNext = (event: React.MouseEvent<HTMLButtonElement>): void => {
		event.preventDefault();
		if (nextItem) dispatch({ type: "go-to", itemId: nextItem.id });
	};
	const complete = (event: React.MouseEvent<HTMLButtonElement>): void => {
		event.preventDefault();
		dispatch({ type: "complete" });
	};

	return (
		<Questionnaire
			item={formName(props.definition.instanceId, state.activeItemId)}
			items={questionnaireItems}
			shortcuts="letters"
			onItemChange={(itemName) => {
				const itemId = itemNameFromFormName(
					props.definition.instanceId,
					itemName,
				);
				if (itemId) dispatch({ type: "go-to", itemId });
			}}
			onSubmit={(event) => {
				event.preventDefault();
				dispatch({ type: "complete" });
			}}
			onKeyDownCapture={(event) => {
				if (!activeItem || !isRenderedQuizQuestion(activeItem) || activeGrade) {
					return;
				}
				if (event.key === "ArrowRight") event.preventDefault();
				if (event.key === "Enter" && hasAnswer(activeAnswer)) {
					event.preventDefault();
					dispatch({ type: "submit", itemId: activeItem.id });
				}
			}}
		>
			<Card>
				<CardHeader>
					<CardTitle>{props.definition.title}</CardTitle>
					<CardAction>
						<QuestionnaireProgress
							render={(progressProps, progressState) => (
								<span {...progressProps}>
									Step {progressState.current} of {progressState.total}
								</span>
							)}
						/>
					</CardAction>
				</CardHeader>
				<CardContent>
					{props.definition.items.map((item) => (
						<QuizStep
							key={item.id}
							instanceId={props.definition.instanceId}
							formName={formName(props.definition.instanceId, item.id)}
							item={item}
							answer={state.answers[item.id]}
							grade={state.grades[item.id]}
							hintVisible={state.visibleHints.includes(item.id)}
							onAnswer={(answer: SubmittedAnswer) =>
								dispatch({ type: "answer", itemId: item.id, answer })
							}
							onToggleHint={() =>
								dispatch({ type: "toggle-hint", itemId: item.id })
							}
						/>
					))}
				</CardContent>
				<CardFooter className="border-t pt-6">
					<QuestionnaireActions>
						<QuestionnairePrevious />
						{activeItem && !isRenderedQuizQuestion(activeItem) ? (
							nextItem ? (
								<QuestionnaireNext onClick={goNext}>Continue</QuestionnaireNext>
							) : (
								<QuestionnaireSubmit type="button" onClick={complete}>
									View results
								</QuestionnaireSubmit>
							)
						) : activeGrade ? (
							nextItem ? (
								<QuestionnaireNext onClick={goNext}>Next</QuestionnaireNext>
							) : (
								<QuestionnaireSubmit type="button" onClick={complete}>
									View results
								</QuestionnaireSubmit>
							)
						) : activeItem && isRenderedQuizQuestion(activeItem) ? (
							<Button
								type="button"
								className="col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0"
								disabled={!hasAnswer(activeAnswer)}
								onClick={() =>
									dispatch({ type: "submit", itemId: activeItem.id })
								}
							>
								Check answer
							</Button>
						) : null}
					</QuestionnaireActions>
				</CardFooter>
			</Card>
		</Questionnaire>
	);
}

function toQuestionnaireItem(
	item: RenderedQuizItem,
	locked: boolean,
	name: string,
): {
	name: string;
	required?: boolean;
	choices?: Array<{ value: string; disabled?: boolean }>;
} {
	if (item.type === "info" || item.type === "freetext") {
		return { name, required: item.type === "freetext" };
	}
	return {
		name,
		required: true,
		choices: item.choices.map((choice) => ({
			value:
				item.type === "truefalse"
					? String(choice.content.text.trim().toLowerCase() === "true")
					: choice.id,
			disabled: locked,
		})),
	};
}

function formName(instanceId: string, itemId: string): string {
	return `${instanceId}-${itemId}`;
}

function itemNameFromFormName(
	instanceId: string,
	name: string,
): string | undefined {
	const prefix = `${instanceId}-`;
	return name.startsWith(prefix) ? name.slice(prefix.length) : undefined;
}
