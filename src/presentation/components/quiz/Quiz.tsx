"use client";

import * as React from "react";

import type {
  QuizDefinition,
  QuizItem,
  QuizResult,
  SubmittedAnswer,
} from "./model";
import { scoreQuiz } from "./grading";
import { createQuizSession, reduceQuizSession } from "./session";
import { validateQuizDefinition } from "./validation";
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./primitives";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSubmit,
} from "./Questionnaire";
import { QuizResults } from "./QuizResults";
import { QuizStep } from "./QuizStep";
import { cn } from "./cn";

export interface QuizProps {
  quiz: QuizDefinition;
  className?: string;
  onComplete?: (result: QuizResult) => void;
}

export function Quiz(props: QuizProps): React.JSX.Element {
  const generatedId = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const idPrefix = `quiz-${generatedId}`;

  if (!isValidQuiz(props.quiz)) {
    const headingId = `${idPrefix}-unavailable`;
    return (
      <div
        ref={rootRef}
        className={cn(
          "cn-questionnaire rounded-xl border p-6",
          props.className,
        )}
        role="alert"
        aria-labelledby={headingId}
      >
        <h3 id={headingId} className="font-semibold">
          Quiz unavailable
        </h3>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={cn("cn-questionnaire", props.className)}
      data-quiz-root=""
    >
      <QuizSession
        key={quizSessionKey(props.quiz)}
        quiz={props.quiz}
        idPrefix={idPrefix}
        rootRef={rootRef}
        onComplete={props.onComplete}
      />
    </div>
  );
}

function QuizSession(props: {
  quiz: QuizDefinition;
  idPrefix: string;
  rootRef: React.RefObject<HTMLDivElement | null>;
  onComplete?: (result: QuizResult) => void;
}): React.JSX.Element {
  const [state, dispatch] = React.useReducer(
    (
      current: ReturnType<typeof createQuizSession>,
      action: Parameters<typeof reduceQuizSession>[2],
    ) => reduceQuizSession(props.quiz, current, action),
    props.quiz,
    createQuizSession,
  );
  const resultsHeadingRef = React.useRef<HTMLHeadingElement>(null);
  const previousPhase = React.useRef(state.phase);
  const completionNotified = React.useRef(false);
  const result = React.useMemo(
    () => scoreQuiz(props.quiz, state.answers),
    [props.quiz, state.answers],
  );

  React.useEffect(() => {
    if (state.phase === "complete") {
      resultsHeadingRef.current?.focus();
      if (!completionNotified.current) {
        completionNotified.current = true;
        props.onComplete?.(result);
      }
    } else {
      completionNotified.current = false;
      if (previousPhase.current === "complete") {
        findStep(props.rootRef.current, state.activeItemId)?.focus();
      }
    }
    previousPhase.current = state.phase;
  }, [props.onComplete, props.rootRef, result, state.activeItemId, state.phase]);

  if (state.phase === "complete") {
    return (
      <QuizResults
        definition={props.quiz}
        grades={state.grades}
        onRestart={() => dispatch({ type: "restart" })}
        headingRef={resultsHeadingRef}
      />
    );
  }

  const activeIndex = props.quiz.items.findIndex(
    (item) => item.id === state.activeItemId,
  );
  const activeItem = props.quiz.items[activeIndex];
  const nextItem = props.quiz.items[activeIndex + 1];
  const questionnaireItems = props.quiz.items.map((item) =>
    toQuestionnaireItem(
      item,
      Boolean(state.grades[item.id]),
      formName(props.idPrefix, item.id),
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
      item={formName(props.idPrefix, state.activeItemId)}
      items={questionnaireItems}
      shortcuts="letters"
      onItemChange={(itemName) => {
        const itemId = itemNameFromFormName(props.idPrefix, itemName);
        if (itemId) dispatch({ type: "go-to", itemId });
      }}
      onSubmit={(event) => {
        event.preventDefault();
        dispatch({ type: "complete" });
      }}
      onKeyDown={(event) => {
        if (
          event.defaultPrevented ||
          event.nativeEvent.isComposing ||
          event.keyCode === 229 ||
          event.repeat ||
          event.metaKey ||
          event.ctrlKey ||
          event.altKey ||
          event.shiftKey
        ) {
          return;
        }

        if (
          (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
          (isEditingControl(event.target) || isRadioInput(event.target))
        ) {
          return;
        }

        if (
          event.key === "ArrowRight" &&
          activeItem &&
          (activeItem.type === "info" || activeGrade) &&
          nextItem
        ) {
          event.preventDefault();
          dispatch({ type: "go-to", itemId: nextItem.id });
          return;
        }

        if (
          event.key !== "Enter" ||
          !activeItem ||
          activeItem.type === "info" ||
          activeGrade ||
          !hasAnswer(activeAnswer) ||
          !(event.target instanceof HTMLInputElement) ||
          event.target.name !== formName(props.idPrefix, activeItem.id)
        ) {
          return;
        }

        event.preventDefault();
        dispatch({ type: "submit", itemId: activeItem.id });
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{props.quiz.title}</CardTitle>
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
          {props.quiz.items.map((item, index) => (
            <QuizStep
              key={item.id}
              domId={`${props.idPrefix}-step-${index}`}
              formName={formName(props.idPrefix, item.id)}
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
            {activeItem?.type === "info" ? (
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
            ) : activeItem ? (
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

function isValidQuiz(quiz: QuizDefinition): boolean {
  try {
    return validateQuizDefinition(quiz).length === 0;
  } catch {
    return false;
  }
}

function quizSessionKey(quiz: QuizDefinition): string {
  return JSON.stringify([
    quiz.id,
    quiz.items.map((item) => {
      if (item.type === "info") return [item.type, item.id];
      if (item.type === "freetext") {
        return [
          item.type,
          item.id,
          item.answer.expected,
          item.answer.caseSensitive ?? false,
        ];
      }

      return [
        item.type,
        item.id,
        item.choices.map((choice) => [choice.id, choice.correct]),
      ];
    }),
  ]);
}

function hasAnswer(answer: SubmittedAnswer | undefined): boolean {
  return typeof answer === "string"
    ? answer.trim().length > 0
    : Array.isArray(answer) && answer.length > 0;
}

function isEditingControl(target: EventTarget): boolean {
  if (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true;
  }

  if (target instanceof HTMLInputElement) {
    return !["button", "checkbox", "radio", "reset", "submit"].includes(
      target.type,
    );
  }

  return target instanceof HTMLElement && target.isContentEditable;
}

function isRadioInput(target: EventTarget): boolean {
  return target instanceof HTMLInputElement && target.type === "radio";
}

function toQuestionnaireItem(
  item: QuizItem,
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
      value: choice.id,
      disabled: locked,
    })),
  };
}

function formName(idPrefix: string, itemId: string): string {
  return `${idPrefix}-${itemId}`;
}

function itemNameFromFormName(
  idPrefix: string,
  name: string,
): string | undefined {
  const prefix = `${idPrefix}-`;
  return name.startsWith(prefix) ? name.slice(prefix.length) : undefined;
}

function findStep(root: HTMLElement | null, itemId: string): HTMLElement | null {
  if (!root) return null;
  return (
    Array.from(root.querySelectorAll<HTMLElement>("[data-quiz-step]")).find(
      (step) => step.dataset.quizStep === itemId,
    ) ?? null
  );
}
