import type React from "react";

import type { QuizDiagnostic } from "../../domain/quiz/model.ts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/Card.tsx";
import type { RenderedQuizDefinition } from "./model.ts";
import { isRenderedQuizQuestion } from "./model.ts";
import { serializeQuizPayload } from "./runtime.ts";

export interface QuizBlockProps {
	definition?: RenderedQuizDefinition;
	diagnostics?: readonly QuizDiagnostic[];
}

export function QuizBlock(props: QuizBlockProps): React.JSX.Element {
	if (!props.definition) {
		const errors = (props.diagnostics ?? []).filter(
			(diagnostic) => diagnostic.severity === "error",
		);
		return (
			<Card data-quiz-invalid="true" className="my-6 border-destructive/50">
				<CardHeader>
					<CardTitle>Quiz unavailable</CardTitle>
					<CardDescription>
						Fix the quiz source before readers can use this quiz.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
						{errors.map((error, index) => (
							<li key={`${error.code}-${index}`}>{error.message}</li>
						))}
					</ul>
				</CardContent>
			</Card>
		);
	}

	const definition = props.definition;
	const questions = definition.items.filter(isRenderedQuizQuestion);
	return (
		<div
			data-island="quiz"
			data-quiz-instance={definition.instanceId}
			className="my-6"
		>
			<div data-quiz-root="">
				<Card aria-busy="true">
					<CardHeader>
						<CardTitle>{definition.title}</CardTitle>
						<CardDescription>Loading interactive quiz…</CardDescription>
					</CardHeader>
				</Card>
			</div>
			<script
				type="application/json"
				data-quiz-payload=""
				dangerouslySetInnerHTML={{
					__html: serializeQuizPayload(definition),
				}}
			/>
			<noscript>
				<Card>
					<CardHeader>
						<CardTitle>{definition.title}</CardTitle>
						<CardDescription>
							Interactive grading requires JavaScript. The questions are listed
							below.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ol className="list-decimal space-y-2 pl-5">
							{questions.map((question) => (
								<li key={question.id}>{question.prompt.text}</li>
							))}
						</ol>
					</CardContent>
				</Card>
			</noscript>
		</div>
	);
}
