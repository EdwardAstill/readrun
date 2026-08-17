import { gradeAnswer } from "../../domain/quiz/grading.ts";
import type { GradeResult, SubmittedAnswer } from "../../domain/quiz/model.ts";

import type {
	RenderedQuizDefinition,
	RenderedQuizQuestion,
} from "./model.ts";
import { isRenderedQuizQuestion } from "./model.ts";

export interface QuizSessionState {
	activeItemId: string;
	answers: Record<string, SubmittedAnswer>;
	grades: Record<string, GradeResult>;
	visibleHints: string[];
	phase: "active" | "complete";
}

export type QuizSessionAction =
	| { type: "answer"; itemId: string; answer: SubmittedAnswer }
	| { type: "toggle-hint"; itemId: string }
	| { type: "submit"; itemId: string }
	| { type: "go-to"; itemId: string }
	| { type: "complete" }
	| { type: "restart" };

export function createQuizSession(
	definition: RenderedQuizDefinition,
): QuizSessionState {
	return {
		activeItemId: definition.items[0]?.id ?? "",
		answers: {},
		grades: {},
		visibleHints: [],
		phase: definition.items.length > 0 ? "active" : "complete",
	};
}

export function reduceQuizSession(
	definition: RenderedQuizDefinition,
	state: QuizSessionState,
	action: QuizSessionAction,
): QuizSessionState {
	if (action.type === "restart") return createQuizSession(definition);
	if (state.phase === "complete") return state;

	switch (action.type) {
		case "answer": {
			const item = findQuestion(definition, action.itemId);
			if (
				!item ||
				action.itemId !== state.activeItemId ||
				state.grades[action.itemId]
			) {
				return state;
			}
			return {
				...state,
				answers: { ...state.answers, [action.itemId]: action.answer },
			};
		}
		case "toggle-hint": {
			const item = findQuestion(definition, action.itemId);
			if (!item?.hint || action.itemId !== state.activeItemId) return state;
			const visible = new Set(state.visibleHints);
			if (visible.has(action.itemId)) visible.delete(action.itemId);
			else visible.add(action.itemId);
			return { ...state, visibleHints: [...visible] };
		}
		case "submit": {
			const item = findQuestion(definition, action.itemId);
			const answer = state.answers[action.itemId];
			if (
				!item ||
				action.itemId !== state.activeItemId ||
				state.grades[action.itemId] ||
				!hasAnswer(answer)
			) {
				return state;
			}
			return {
				...state,
				grades: {
					...state.grades,
					[action.itemId]: gradeAnswer(item, answer),
				},
			};
		}
		case "go-to": {
			const currentIndex = definition.items.findIndex(
				(item) => item.id === state.activeItemId,
			);
			const targetIndex = definition.items.findIndex(
				(item) => item.id === action.itemId,
			);
			if (currentIndex < 0 || targetIndex < 0 || targetIndex === currentIndex) {
				return state;
			}
			if (targetIndex < currentIndex) {
				return { ...state, activeItemId: action.itemId };
			}
			if (targetIndex !== currentIndex + 1) return state;
			const current = definition.items[currentIndex]!;
			if (isRenderedQuizQuestion(current) && !state.grades[current.id]) {
				return state;
			}
			return { ...state, activeItemId: action.itemId };
		}
		case "complete": {
			const allGraded = definition.items
				.filter(isRenderedQuizQuestion)
				.every((question) => state.grades[question.id]);
			if (!allGraded) return state;
			return { ...state, phase: "complete" };
		}
	}
}

export function hasAnswer(
	answer: SubmittedAnswer | undefined,
): answer is SubmittedAnswer {
	if (typeof answer === "boolean") return true;
	if (typeof answer === "string") return answer.trim().length > 0;
	return Array.isArray(answer) && answer.length > 0;
}

function findQuestion(
	definition: RenderedQuizDefinition,
	id: string,
): RenderedQuizQuestion | undefined {
	const item = definition.items.find((candidate) => candidate.id === id);
	return item && isRenderedQuizQuestion(item) ? item : undefined;
}
