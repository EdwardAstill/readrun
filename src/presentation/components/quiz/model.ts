import type { ReactNode } from "react";

export interface QuizDefinition {
  id: string;
  title: string;
  items: QuizItem[];
}

export interface QuizInfo {
  type: "info";
  id: string;
  content: ReactNode;
}

export interface QuizChoice {
  id: string;
  content: ReactNode;
  correct: boolean;
}

interface QuizQuestionBase {
  id: string;
  prompt: ReactNode;
  hint?: ReactNode;
  explanation?: ReactNode;
}

export interface SingleChoiceQuestion extends QuizQuestionBase {
  type: "single";
  choices: QuizChoice[];
}

export interface MultipleChoiceQuestion extends QuizQuestionBase {
  type: "multi";
  choices: QuizChoice[];
}

export interface TrueFalseQuestion extends QuizQuestionBase {
  type: "truefalse";
  choices: QuizChoice[];
}

export interface FreeTextQuestion extends QuizQuestionBase {
  type: "freetext";
  answer: {
    expected: string;
    caseSensitive?: boolean;
  };
}

export type QuizQuestion =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | FreeTextQuestion;

export type QuizItem = QuizInfo | QuizQuestion;

export type SubmittedAnswer = string | string[];

export interface GradeResult {
  correct: boolean;
  submitted: SubmittedAnswer;
  expected: SubmittedAnswer;
  error?: "invalid-answer-shape" | "unknown-choice";
}

export interface QuizResult {
  correct: number;
  total: number;
  answers: Readonly<Record<string, SubmittedAnswer>>;
  grades: Readonly<Record<string, GradeResult>>;
}
