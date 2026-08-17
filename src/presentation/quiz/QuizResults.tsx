import type React from "react";

import type { GradeResult } from "../../domain/quiz/model.ts";
import { Button } from "../components/ui/Button.tsx";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../components/ui/Card.tsx";
import type { RenderedQuizDefinition } from "./model.ts";
import { isRenderedQuizQuestion } from "./model.ts";

export function QuizResults(props: {
	definition: RenderedQuizDefinition;
	grades: Readonly<Record<string, GradeResult>>;
	onRestart: () => void;
	headingRef?: React.Ref<HTMLHeadingElement>;
}): React.JSX.Element {
	const questions = props.definition.items.filter(isRenderedQuizQuestion);
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
							<span>
								{index + 1}. {question.prompt.text}
							</span>
							<span className="shrink-0 font-medium">
								{props.grades[question.id]?.correct ? "Correct" : "Incorrect"}
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
