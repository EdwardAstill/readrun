import type React from "react";

import type { GradeResult, QuizDefinition, QuizQuestion } from "./model";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./primitives";

interface QuizResultsProps {
  definition: QuizDefinition;
  grades: Readonly<Record<string, GradeResult>>;
  onRestart: () => void;
  headingRef?: React.Ref<HTMLHeadingElement>;
}

export function QuizResults(props: QuizResultsProps): React.JSX.Element {
  const questions = props.definition.items.filter(isQuestion);
  const correct = questions.filter(
    (question) => props.grades[question.id]?.correct,
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3 ref={props.headingRef} tabIndex={-1} className="outline-none">
            {props.definition.title}: results
          </h3>
        </CardTitle>
        <p className="text-2xl font-semibold tabular-nums">
          {correct} / {questions.length}
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {questions.map((question, index) => (
            <li
              key={question.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-3 text-sm"
            >
              <div>
                {index + 1}. {question.prompt}
              </div>
              <span className="shrink-0 font-medium">
                {!props.grades[question.id] ? "Skipped" : props.grades[question.id]?.correct ? "Correct" : "Incorrect"}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button type="button" onClick={props.onRestart}>
          Restart quiz
        </Button>
      </CardFooter>
    </Card>
  );
}

function isQuestion(item: QuizDefinition["items"][number]): item is QuizQuestion {
  return item.type !== "info";
}
