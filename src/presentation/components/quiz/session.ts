import { gradeAnswer } from "./grading";
import type {
  GradeResult,
  QuizDefinition,
  QuizQuestion,
  SubmittedAnswer,
} from "./model";

export interface QuizSessionState {
  activeItemId: string;
  answers: Record<string, SubmittedAnswer>;
  grades: Record<string, GradeResult>;
  visibleHints: string[];
  skipped: string[];
  phase: "active" | "complete";
}

export type QuizSessionAction =
  | { type: "answer"; itemId: string; answer: SubmittedAnswer }
  | { type: "toggle-hint"; itemId: string }
  | { type: "submit"; itemId: string }
  | { type: "skip"; itemId: string }
  | { type: "go-to"; itemId: string }
  | { type: "complete" }
  | { type: "restart" };

export function createQuizSession(definition: QuizDefinition): QuizSessionState {
  return {
    activeItemId: definition.items[0]?.id ?? "",
    answers: {},
    grades: {},
    visibleHints: [],
    skipped: [],
    phase: definition.items.length > 0 ? "active" : "complete",
  };
}

export function reduceQuizSession(
  definition: QuizDefinition,
  state: QuizSessionState,
  action: QuizSessionAction,
): QuizSessionState {
  if (action.type === "restart") {
    return createQuizSession(definition);
  }

  if (state.phase === "complete") {
    return state;
  }

  switch (action.type) {
    case "answer": {
      const question = findQuestion(definition, action.itemId);

      if (
        question === undefined ||
        action.itemId !== state.activeItemId ||
        state.grades[action.itemId] !== undefined
      ) {
        return state;
      }

      return {
        ...state,
        answers: {
          ...state.answers,
          [action.itemId]: action.answer,
        },
      };
    }
    case "toggle-hint": {
      const question = findQuestion(definition, action.itemId);

      if (
        question?.hint === undefined ||
        action.itemId !== state.activeItemId
      ) {
        return state;
      }

      const visibleHints = new Set(state.visibleHints);

      if (visibleHints.has(action.itemId)) {
        visibleHints.delete(action.itemId);
      } else {
        visibleHints.add(action.itemId);
      }

      return {
        ...state,
        visibleHints: [...visibleHints],
      };
    }
    case "submit": {
      const question = findQuestion(definition, action.itemId);
      const submitted = state.answers[action.itemId];

      if (
        question === undefined ||
        action.itemId !== state.activeItemId ||
        state.grades[action.itemId] !== undefined ||
        !hasAnswer(submitted)
      ) {
        return state;
      }

      return {
        ...state,
        skipped: state.skipped.filter((id) => id !== action.itemId),
        grades: {
          ...state.grades,
          [action.itemId]: gradeAnswer(question, submitted),
        },
      };
    }
    case "skip": {
      const index = definition.items.findIndex((item) => item.id === action.itemId);
      const item = definition.items[index];
      if (!item || !isQuestion(item) || action.itemId !== state.activeItemId || state.grades[item.id]) {
        return state;
      }
      const answers = { ...state.answers };
      delete answers[item.id];
      const skipped = [...new Set([...state.skipped, item.id])];
      const next = definition.items[index + 1];
      const canComplete = definition.items.filter(isQuestion).every(
        (question) => state.grades[question.id] !== undefined || skipped.includes(question.id),
      );
      return {
        ...state,
        answers,
        skipped,
        activeItemId: next?.id ?? state.activeItemId,
        phase: !next && canComplete ? "complete" : "active",
      };
    }
    case "go-to": {
      const currentIndex = definition.items.findIndex(
        (item) => item.id === state.activeItemId,
      );
      const targetIndex = definition.items.findIndex(
        (item) => item.id === action.itemId,
      );

      if (currentIndex < 0 || targetIndex < 0 || currentIndex === targetIndex) {
        return state;
      }

      if (targetIndex < currentIndex) {
        return {
          ...state,
          activeItemId: action.itemId,
        };
      }

      if (targetIndex !== currentIndex + 1) {
        return state;
      }

      const currentItem = definition.items[currentIndex];

      if (
        currentItem !== undefined &&
        isQuestion(currentItem) &&
        state.grades[currentItem.id] === undefined &&
        !state.skipped.includes(currentItem.id)
      ) {
        return state;
      }

      return {
        ...state,
        activeItemId: action.itemId,
      };
    }
    case "complete": {
      const allQuestionsGraded = definition.items
        .filter(isQuestion)
        .every((question) => state.grades[question.id] !== undefined || state.skipped.includes(question.id));

      if (!allQuestionsGraded) {
        return state;
      }

      return {
        ...state,
        phase: "complete",
      };
    }
  }
}

function hasAnswer(answer: SubmittedAnswer | undefined): answer is SubmittedAnswer {
  if (typeof answer === "string") {
    return answer.trim().length > 0;
  }

  return Array.isArray(answer) && answer.length > 0;
}

function findQuestion(
  definition: QuizDefinition,
  itemId: string,
): QuizQuestion | undefined {
  const item = definition.items.find((candidate) => candidate.id === itemId);
  return item !== undefined && isQuestion(item) ? item : undefined;
}

function isQuestion(item: QuizDefinition["items"][number]): item is QuizQuestion {
  return item.type !== "info";
}
