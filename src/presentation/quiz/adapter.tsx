import type {
	QuizChoice,
	QuizDefinition,
	QuizItem,
} from "../components/quiz/model.ts";

import type {
	RenderedQuizChoice,
	RenderedQuizDefinition,
	RenderedQuizItem,
	RenderedRichText,
} from "./model.ts";
import { ReadRunRichText } from "./ReadRunRichText.tsx";

export function toQuizDefinition(
	payload: RenderedQuizDefinition,
): QuizDefinition {
	return {
		id: payload.id,
		title: payload.title,
		items: payload.items.map(toQuizItem),
	};
}

function toQuizItem(item: RenderedQuizItem): QuizItem {
	if (item.type === "info") {
		return {
			type: "info",
			id: item.id,
			content: richText(item.content),
		};
	}

	const common = {
		id: item.id,
		prompt: richText(item.prompt),
		hint: item.hint ? richText(item.hint) : undefined,
		explanation: item.explanation ? richText(item.explanation) : undefined,
	};
	if (item.type === "freetext") {
		return {
			...common,
			type: "freetext",
			answer: { ...item.answer },
		};
	}
	if (item.type === "truefalse") {
		return {
			...common,
			type: "truefalse",
			choices: item.choices.map((choice) => ({
				id: choice.id,
				content: choice.content.text,
				correct: choice.correct,
			})),
		};
	}
	return {
		...common,
		type: item.type,
		choices: item.choices.map(toQuizChoice),
	};
}

function toQuizChoice(choice: RenderedQuizChoice): QuizChoice {
	return {
		id: choice.id,
		content: richText(choice.content),
		correct: choice.correct,
	};
}

function richText(value: RenderedRichText): React.JSX.Element {
	return <ReadRunRichText value={value} />;
}
