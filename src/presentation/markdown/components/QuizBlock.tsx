import type React from "react";

import type {
	Quiz,
	QuizItem,
	InteractiveQuestion,
	QuestionGroup,
	InfoItem,
} from "../../../domain/quiz/model.ts";
import { escapeHtml } from "../../../shared/html.ts";

export interface QuizBlockProps {
	quiz: Quiz;
}

export function QuizBlock(props: QuizBlockProps): React.JSX.Element {
	const { quiz } = props;
	const flatItems = flattenQuizItems(quiz.items);
	const allQuestions = getInteractiveQuestions(quiz.items);
	const totalQuestions = allQuestions.length;

	return (
		<section className="quiz" data-quiz-id="quiz-block">
			{/* Serialize quiz data for client-side JS */}
			<script
				type="application/json"
				className="quiz-data"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(quiz).replaceAll("<", "\\u003c"),
				}}
			/>

			<div className="quiz__header">
				{quiz.title ? <div className="quiz__title">{quiz.title}</div> : null}
				<div className="quiz__progress">
					<span className="quiz__progress-current">1</span>
					{" / "}
					<span className="quiz__progress-total">{flatItems.length}</span>
					<span className="quiz__answered">
						{" "}
						0 of {totalQuestions} answered
					</span>
				</div>
			</div>

			<div className="quiz__body">
				{flatItems.map((item, idx) => (
					<div
						key={item.id}
						className="quiz__item"
						data-item-index={idx}
						style={idx > 0 ? { display: "none" } : undefined}
					>
						{renderItem(item)}
					</div>
				))}
			</div>

			{/* Navigation — only shown on client */}
			<div className="quiz__nav" style={{ display: "none" }}>
				<button className="quiz__nav-btn quiz__nav-btn--prev" type="button">
					Previous
				</button>
				<button className="quiz__nav-btn quiz__nav-btn--next" type="button">
					Next
				</button>
				<button
					className="quiz__nav-btn quiz__nav-btn--finish"
					type="button"
					style={{ display: "none" }}
				>
					Finish
				</button>
			</div>

			{/* Results — shown when quiz is complete */}
			<div className="quiz__results" style={{ display: "none" }}>
				<div className="quiz__results-header">Quiz Complete</div>
				<div className="quiz__results-score"></div>
				<div className="quiz__results-detail"></div>
			</div>
		</section>
	);
}

function renderItem(item: QuizItem): React.JSX.Element {
	switch (item.type) {
		case "info":
			return <InfoDisplay item={item} />;
		case "single":
		case "multi":
			return <ChoiceQuestion question={item} />;
		case "truefalse":
			return <TrueFalseQuestionDisplay question={item} />;
		case "freetext":
			return <FreeTextDisplay question={item} />;
		case "group":
			return <GroupDisplay group={item} />;
		default:
			return <div>Unknown quiz item type</div>;
	}
}

function InfoDisplay(props: { item: InfoItem }): React.JSX.Element {
	return (
		<div
			className="quiz__question"
			data-question-id={props.item.id}
			data-question-type="info"
		>
			<div className="quiz__info-label">Reading</div>
			<div
				className="quiz__info-content"
				dangerouslySetInnerHTML={{ __html: props.item.content }}
			/>
			<button
				className="quiz__submit-btn quiz__submit-btn--continue"
				type="button"
			>
				Continue
			</button>
		</div>
	);
}

function ChoiceQuestion(props: {
	question: InteractiveQuestion & { type: "single" | "multi" };
}): React.JSX.Element {
	const { question: q } = props;
	const isMulti = q.type === "multi";
	const inputType = isMulti ? "checkbox" : "radio";
	const name = `quiz-${q.id}`;
	const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

	return (
		<div
			className="quiz__question"
			data-question-id={q.id}
			data-question-type={q.type}
		>
			<div className="quiz__question-text">{q.prompt}</div>

			{q.hint ? (
				<div className="quiz__hint">
					<button className="quiz__hint-btn" type="button" data-hint={q.id}>
						Show hint
					</button>
					<div
						className="quiz__hint-text"
						id={`hint-${q.id}`}
						style={{ display: "none" }}
					>
						{q.hint}
					</div>
				</div>
			) : null}

			<div
				className={
					isMulti ? "quiz__options quiz__options--multi" : "quiz__options"
				}
			>
				{q.options.map((option, i) => (
					<label
						key={i}
						className="quiz__option"
						data-option={i}
						data-type={q.type}
						data-qid={q.id}
					>
						<input
							type={inputType}
							name={name}
							value={i}
							className="quiz__option-input"
						/>
						{isMulti ? (
							<span className="quiz__option-check"></span>
						) : (
							<span className="quiz__option-marker">{labels[i] ?? i}</span>
						)}
						<span className="quiz__option-text">{option}</span>
					</label>
				))}
			</div>

			<button
				className="quiz__submit-btn"
				type="button"
				data-submit={q.type}
				data-qid={q.id}
				disabled
			>
				Submit
			</button>

			<div className="quiz__feedback" style={{ display: "none" }}>
				<div className="quiz__feedback-result"></div>
				<div className="quiz__correct-answer" style={{ display: "none" }}></div>
				{q.explanation ? (
					<div className="quiz__explanation" style={{ display: "none" }}>
						{q.explanation}
					</div>
				) : null}
			</div>
		</div>
	);
}

function TrueFalseQuestionDisplay(props: {
	question: InteractiveQuestion & { type: "truefalse" };
}): React.JSX.Element {
	const q = props.question;

	return (
		<div
			className="quiz__question"
			data-question-id={q.id}
			data-question-type="truefalse"
		>
			<div className="quiz__question-text">{q.prompt}</div>

			{q.hint ? (
				<div className="quiz__hint">
					<button className="quiz__hint-btn" type="button" data-hint={q.id}>
						Show hint
					</button>
					<div
						className="quiz__hint-text"
						id={`hint-${q.id}`}
						style={{ display: "none" }}
					>
						{q.hint}
					</div>
				</div>
			) : null}

			<div className="quiz__tf-options">
				<button
					className="quiz__tf-btn"
					type="button"
					data-tf="true"
					data-qid={q.id}
				>
					True
				</button>
				<button
					className="quiz__tf-btn"
					type="button"
					data-tf="false"
					data-qid={q.id}
				>
					False
				</button>
			</div>

			<div className="quiz__feedback" style={{ display: "none" }}>
				<div className="quiz__feedback-result"></div>
				{q.explanation ? (
					<div className="quiz__explanation" style={{ display: "none" }}>
						{q.explanation}
					</div>
				) : null}
			</div>
		</div>
	);
}

function FreeTextDisplay(props: {
	question: InteractiveQuestion & { type: "freetext" };
}): React.JSX.Element {
	const q = props.question;

	return (
		<div
			className="quiz__question"
			data-question-id={q.id}
			data-question-type="freetext"
		>
			<div className="quiz__question-text">{q.prompt}</div>

			{q.hint ? (
				<div className="quiz__hint">
					<button className="quiz__hint-btn" type="button" data-hint={q.id}>
						Show hint
					</button>
					<div
						className="quiz__hint-text"
						id={`hint-${q.id}`}
						style={{ display: "none" }}
					>
						{q.hint}
					</div>
				</div>
			) : null}

			<div className="quiz__freetext">
				<input
					className="quiz__freetext-input"
					type="text"
					id={`freetext-${q.id}`}
					data-qid={q.id}
					placeholder="Type your answer..."
				/>
				<button
					className="quiz__submit-btn"
					type="button"
					data-submit="freetext"
					data-qid={q.id}
				>
					Submit
				</button>
			</div>

			<div className="quiz__feedback" style={{ display: "none" }}>
				<div className="quiz__feedback-result"></div>
				<div className="quiz__correct-answer" style={{ display: "none" }}></div>
				{q.explanation ? (
					<div className="quiz__explanation" style={{ display: "none" }}>
						{q.explanation}
					</div>
				) : null}
			</div>
		</div>
	);
}

function GroupDisplay(props: { group: QuestionGroup }): React.JSX.Element {
	const g = props.group;
	const labels = "abcdefghijklmnopqrstuvwxyz";

	return (
		<div
			className="quiz__group"
			data-question-id={g.id}
			data-question-type="group"
		>
			<div className="quiz__group-prompt">{g.prompt}</div>

			{g.hint ? (
				<div className="quiz__hint">
					<button className="quiz__hint-btn" type="button" data-hint={g.id}>
						Show hint
					</button>
					<div
						className="quiz__hint-text"
						id={`hint-${g.id}`}
						style={{ display: "none" }}
					>
						{g.hint}
					</div>
				</div>
			) : null}

			{g.parts.map((part, i) => (
				<div key={part.id} className="quiz__group-part">
					<div className="quiz__group-part-label">
						Part {labels[i] ?? i + 1}
					</div>
					{renderItem(part)}
				</div>
			))}

			{g.explanation ? (
				<div className="quiz__explanation" style={{ display: "none" }}>
					{g.explanation}
				</div>
			) : null}
		</div>
	);
}

// --- Flatten helpers ---

function flattenQuizItems(items: QuizItem[]): QuizItem[] {
	const flat: QuizItem[] = [];
	for (const item of items) {
		flat.push(item);
	}
	return flat;
}

function getInteractiveQuestions(items: QuizItem[]): InteractiveQuestion[] {
	const questions: InteractiveQuestion[] = [];
	for (const item of items) {
		if (item.type === "group") {
			questions.push(...item.parts);
		} else if (
			item.type === "single" ||
			item.type === "multi" ||
			item.type === "truefalse" ||
			item.type === "freetext"
		) {
			questions.push(item);
		}
	}
	return questions;
}
