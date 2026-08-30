import { createRoot, type Root } from "react-dom/client";

import { Quiz } from "../components/quiz/Quiz.tsx";
import "../components/quiz/styles.css";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/Card.tsx";
import { toQuizDefinition } from "./adapter.tsx";
import { parseQuizPayload } from "./runtime.ts";

interface MountedQuiz {
	host: HTMLElement;
	root: Root;
}

export function mountQuizIslands(root: ParentNode = document): () => void {
	const mounted: MountedQuiz[] = [];
	const hosts = root.querySelectorAll<HTMLElement>(
		'[data-island="quiz"]:not([data-quiz-mounted])',
	);

	for (const host of hosts) {
		const target = host.querySelector<HTMLElement>("[data-quiz-root]");
		const payload = host.querySelector<HTMLScriptElement>("[data-quiz-payload]");
		if (!target) continue;
		let definition: ReturnType<typeof parseQuizPayload>;
		try {
			if (!payload?.textContent) throw new Error("Quiz payload is missing.");
			definition = parseQuizPayload(payload.textContent);
		} catch (cause) {
			const message = cause instanceof Error ? cause.message : "Unknown payload error.";
			const reactRoot = createRoot(target, {
				identifierPrefix: `${host.dataset.quizInstance ?? "quiz-error"}-`,
			});
			host.dataset.quizMounted = "true";
			mounted.push({ host, root: reactRoot });
			reactRoot.render(
				<Card className="border-destructive/50">
					<CardHeader>
						<CardTitle>Quiz could not load</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-destructive">
						{message}
					</CardContent>
				</Card>,
			);
			continue;
		}

		const reactRoot = createRoot(target, {
			identifierPrefix: `${definition.instanceId}-`,
		});
		host.dataset.quizMounted = "true";
		mounted.push({ host, root: reactRoot });
		reactRoot.render(<Quiz quiz={toQuizDefinition(definition)} />);
	}

	return () => {
		for (const item of mounted) {
			item.root.unmount();
			delete item.host.dataset.quizMounted;
		}
	};
}
