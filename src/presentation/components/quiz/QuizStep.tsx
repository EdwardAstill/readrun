import type React from "react";

import type {
  GradeResult,
  QuizItem,
  QuizQuestion,
  SubmittedAnswer,
} from "./model";
import { Button } from "./primitives";
import {
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireTitle,
} from "./Questionnaire";
import { cn } from "./cn";

interface QuizStepProps {
  domId: string;
  formName: string;
  item: QuizItem;
  answer?: SubmittedAnswer;
  grade?: GradeResult;
  hintVisible: boolean;
  onAnswer: (answer: SubmittedAnswer) => void;
  onToggleHint: () => void;
}

export function QuizStep(props: QuizStepProps): React.JSX.Element {
  const headingId = `${props.domId}-title`;

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
          {props.item.content}
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
      <QuestionnaireTitle
        id={headingId}
        render={<div />}
        className="mb-5 text-base font-medium text-foreground"
      >
        {props.item.prompt}
      </QuestionnaireTitle>

      {props.item.type === "freetext" ? (
        <QuestionnaireInput
          aria-labelledby={headingId}
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

      {props.item.hint !== undefined ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={props.hintVisible}
            aria-controls={`${props.domId}-hint`}
            onClick={props.onToggleHint}
          >
            {props.hintVisible ? "Hide hint" : "Show hint"}
          </Button>
          {props.hintVisible ? (
            <div
              id={`${props.domId}-hint`}
              className="mt-3 rounded-lg border bg-muted/40 p-3 text-sm"
            >
              {props.item.hint}
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
  question: Exclude<QuizQuestion, { type: "freetext" }>;
  answer?: SubmittedAnswer;
  grade?: GradeResult;
  onAnswer: (answer: SubmittedAnswer) => void;
}): React.JSX.Element {
  const locked = props.grade !== undefined;

  return (
    <QuestionnaireChoices>
      {props.question.choices.map((choice) => {
        const checked =
          props.question.type === "multi"
            ? Array.isArray(props.answer) && props.answer.includes(choice.id)
            : props.answer === choice.id;
        const selectedWrong = Boolean(props.grade && checked && !choice.correct);

        return (
          <QuestionnaireChoice
            key={choice.id}
            value={choice.id}
            checked={checked}
            disabled={locked}
            className={cn(
              props.grade && choice.correct && "border-primary bg-primary/10",
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
                props.onAnswer(choice.id);
              }
            }}
          >
            {choice.content}
          </QuestionnaireChoice>
        );
      })}
    </QuestionnaireChoices>
  );
}

function Feedback(props: {
  question: QuizQuestion;
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
          Expected answer: <ExpectedAnswer question={props.question} />
        </p>
      ) : null}
      {props.question.explanation !== undefined ? (
        <div className="mt-3 border-t pt-3 text-foreground">
          {props.question.explanation}
        </div>
      ) : null}
    </div>
  );
}

function ExpectedAnswer(props: { question: QuizQuestion }): React.JSX.Element {
  if (props.question.type === "freetext") {
    return <>{props.question.answer.expected}</>;
  }

  const correctChoices = props.question.choices.filter(
    (choice) => choice.correct,
  );
  return (
    <>
      {correctChoices.map((choice, index) => (
        <span key={choice.id}>
          {index > 0 ? ", " : null}
          {choice.content}
        </span>
      ))}
    </>
  );
}
