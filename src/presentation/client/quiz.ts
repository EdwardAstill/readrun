import type {
	Quiz,
	QuizItem,
	InteractiveQuestion,
} from "../../domain/quiz/model.ts";

// --- Public API ---

export interface QuizState {
	answers: Map<string, QuizAnswer>;
	phase: "active" | "finished";
}

interface QuizAnswer {
	userAnswer: unknown;
	correct: boolean;
}

export function initQuizzes(root: ParentNode = document): () => void {
	const containers = root.querySelectorAll<HTMLElement>(".quiz");
	const teardowns: Array<() => void> = [];

	for (const container of containers) {
		teardowns.push(initSingleQuiz(container));
	}

	return () => {
		for (const td of teardowns) {
			td();
		}
	};
}

// --- Single quiz instance ---

function initSingleQuiz(container: HTMLElement): () => void {
	// Parse quiz data from embedded script
	const dataEl = container.querySelector<HTMLScriptElement>(".quiz-data");
	if (!dataEl?.textContent) return () => {};

	let quiz: Quiz;
	try {
		quiz = JSON.parse(dataEl.textContent) as Quiz;
	} catch {
		return () => {};
	}

	const allItems = flattenAllItems(quiz.items);
	const totalInteractive = allInteractive(quiz.items).length;
	let currentIndex = 0;
	const answers = new Map<string, QuizAnswer>();
	const phase: "active" | "finished" = "active";

	// Show nav
	const navEl = container.querySelector<HTMLElement>(".quiz__nav");
	if (navEl) navEl.style.display = "";

	// Event delegation: handle clicks on quiz options, submit, nav, hints
	const clickHandler = (event: Event): void => {
		const target = event.target as HTMLElement | null;
		if (!target) return;

		// Hint button
		const hintBtn = target.closest<HTMLElement>(".quiz__hint-btn");
		if (hintBtn) {
			const hintId = hintBtn.dataset.hint;
			if (hintId) {
				const textEl = container.querySelector<HTMLElement>(`#hint-${hintId}`);
				if (textEl) {
					textEl.style.display = textEl.style.display === "none" ? "" : "none";
				}
			}
			return;
		}

		// Option selection (radio for single, checkbox-like toggle for multi)
		const optionBtn = target.closest<HTMLElement>(".quiz__option");
		if (optionBtn) {
			const qid = optionBtn.dataset.qid;
			const qtype = optionBtn.dataset.type as string;
			const optIndex = Number(optionBtn.dataset.option);

			if (!qid || isNaN(optIndex)) return;

			// Don't allow selection if already submitted
			if (answers.has(qid)) return;

			const questionEl = container.querySelector<HTMLElement>(
				`.quiz__question[data-question-id="${qid}"]`,
			);
			if (!questionEl) return;

			if (qtype === "single") {
				// Radio-style: deselect all, select clicked
				questionEl
					.querySelectorAll(".quiz__option")
					.forEach((el) => el.classList.remove("quiz__option--selected"));
				optionBtn.classList.add("quiz__option--selected");
			} else if (qtype === "multi") {
				// Toggle
				optionBtn.classList.toggle("quiz__option--selected");
			}

			// Enable submit button if any option selected
			updateSubmitButton(questionEl, qtype);
			return;
		}

		// T/F button
		const tfBtn = target.closest<HTMLElement>(".quiz__tf-btn");
		if (tfBtn) {
			const qid = tfBtn.dataset.qid;
			if (!qid || answers.has(qid)) return;

			const questionEl = container.querySelector<HTMLElement>(
				`.quiz__question[data-question-id="${qid}"]`,
			);
			if (!questionEl) return;

			// Deselect all, select clicked
			questionEl
				.querySelectorAll(".quiz__tf-btn")
				.forEach((el) => el.classList.remove("quiz__option--selected"));
			tfBtn.classList.add("quiz__option--selected");

			// Auto-submit for T/F
			doSubmit(container, quiz, qid, phase, answers, totalInteractive);
			return;
		}

		// Submit button
		const submitBtn = target.closest<HTMLElement>(".quiz__submit-btn");
		if (submitBtn) {
			if (submitBtn.classList.contains("quiz__submit-btn--continue")) {
				// Info continue — just advance
				navNext();
				return;
			}

			const qid = submitBtn.dataset.qid;
			if (!qid) return;

			if (submitBtn.dataset.submit === "freetext") {
				// Get text input value
				const inputEl = container.querySelector<HTMLInputElement>(
					`#freetext-${qid}`,
				);
				if (!inputEl) return;
				doSubmitFreetext(container, quiz, qid, inputEl.value, answers);
			} else {
				doSubmit(container, quiz, qid, phase, answers, totalInteractive);
			}
			return;
		}

		// Nav: prev
		if (target.closest(".quiz__nav-btn--prev")) {
			navPrev();
			return;
		}

		// Nav: next
		if (target.closest(".quiz__nav-btn--next")) {
			navNext();
			return;
		}

		// Nav: finish
		if (target.closest(".quiz__nav-btn--finish")) {
			showResults(container, answers, totalInteractive);
			return;
		}
	};

	container.addEventListener("click", clickHandler);

	// Input handler for freetext
	const inputHandler = (event: Event): void => {
		const input = event.target as HTMLInputElement | null;
		if (
			input?.classList.contains("quiz__freetext-input") &&
			input.dataset.qid
		) {
			const qid = input.dataset.qid;
			const questionEl = container.querySelector<HTMLElement>(
				`.quiz__question[data-question-id="${qid}"]`,
			);
			if (questionEl) {
				updateSubmitButton(questionEl, "freetext");
			}
		}
	};

	container.addEventListener("input", inputHandler);

	function navPrev(): void {
		if (currentIndex <= 0) return;
		currentIndex--;
		showItem(currentIndex);
	}

	function navNext(): void {
		if (currentIndex >= allItems.length - 1) {
			// Show finish button
			const finishBtn = container.querySelector<HTMLElement>(
				".quiz__nav-btn--finish",
			);
			if (finishBtn) finishBtn.style.display = "";
			return;
		}
		currentIndex++;
		showItem(currentIndex);
	}

	function showItem(index: number): void {
		const allEls = container.querySelectorAll<HTMLElement>(".quiz__item");
		for (let i = 0; i < allEls.length; i++) {
			allEls[i]!.style.display = i === index ? "" : "none";
		}

		// Update progress
		const currentEl = container.querySelector(".quiz__progress-current");
		if (currentEl) currentEl.textContent = String(index + 1);

		// Toggle nav buttons
		const prevBtn = container.querySelector<HTMLElement>(
			".quiz__nav-btn--prev",
		);
		if (prevBtn) {
			(prevBtn as HTMLButtonElement).disabled = index === 0;
		}

		const nextBtn = container.querySelector<HTMLElement>(
			".quiz__nav-btn--next",
		);
		const finishBtn = container.querySelector<HTMLElement>(
			".quiz__nav-btn--finish",
		);

		if (index >= allItems.length - 1) {
			if (nextBtn) (nextBtn as HTMLButtonElement).style.display = "none";
			if (finishBtn) finishBtn.style.display = "";
		} else {
			if (nextBtn) (nextBtn as HTMLButtonElement).style.display = "";
			if (finishBtn) finishBtn.style.display = "none";
		}
	}

	return () => {
		container.removeEventListener("click", clickHandler);
		container.removeEventListener("input", inputHandler);
	};
}

// --- Submission helpers ---

function doSubmit(
	container: HTMLElement,
	_quiz: Quiz,
	qid: string,
	phase: string,
	answers: Map<string, QuizAnswer>,
	totalInteractive: number,
): void {
	if (phase === "finished" || answers.has(qid)) return;

	const question = findQuestion(_quiz.items, qid);
	if (!question) return;

	const questionEl = container.querySelector<HTMLElement>(
		`.quiz__question[data-question-id="${qid}"]`,
	);
	if (!questionEl) return;

	let userAnswer: unknown;
	let correct: boolean;

	if (question.type === "single") {
		const selected = questionEl.querySelector<HTMLElement>(
			".quiz__option--selected",
		);
		userAnswer = selected ? Number(selected.dataset.option) : -1;
		correct = userAnswer === question.correctIndex;
	} else if (question.type === "multi") {
		const selected = questionEl.querySelectorAll<HTMLElement>(
			".quiz__option--selected",
		);
		const selectedIndexes = [...selected]
			.map((el) => Number(el.dataset.option))
			.filter((n) => !isNaN(n))
			.sort((a, b) => a - b);
		userAnswer = selectedIndexes;
		const expected = [...question.correctIndexes].sort((a, b) => a - b);
		correct =
			selectedIndexes.length === expected.length &&
			selectedIndexes.every((v, i) => v === expected[i]);
	} else if (question.type === "truefalse") {
		const selected = questionEl.querySelector<HTMLElement>(
			".quiz__tf-btn--selected, .quiz__option--selected",
		);
		if (!selected) return;
		userAnswer = selected.dataset.tf === "true";
		correct = userAnswer === question.correctAnswer;
	} else {
		return;
	}

	answers.set(qid, { userAnswer, correct });
	showFeedback(questionEl, question, correct);

	// Count correct so far
	let cumulativeCorrect = 0;
	for (const ans of answers.values()) {
		if (ans.correct) cumulativeCorrect++;
	}
	updateAnsweredCount(
		container,
		answers.size,
		cumulativeCorrect,
		totalInteractive,
	);

	// Auto-advance after short delay
	setTimeout(() => {
		const navBtn = container.querySelector<HTMLElement>(".quiz__nav-btn--next");
		if (navBtn) navBtn.click();
	}, 1500);
}

function doSubmitFreetext(
	container: HTMLElement,
	quiz: Quiz,
	qid: string,
	value: string,
	answers: Map<string, QuizAnswer>,
): void {
	if (answers.has(qid)) return;

	const question = findQuestion(quiz.items, qid);
	if (!question || question.type !== "freetext") return;

	const questionEl = container.querySelector<HTMLElement>(
		`.quiz__question[data-question-id="${qid}"]`,
	);
	if (!questionEl) return;

	const trimmed = value.trim();
	const caseSensitive = question.caseSensitive ?? false;
	const userVal = caseSensitive ? trimmed : trimmed.toLowerCase();
	const correctVal = caseSensitive
		? question.correctAnswer.trim()
		: question.correctAnswer.trim().toLowerCase();
	const correct = userVal === correctVal;

	answers.set(qid, { userAnswer: trimmed, correct });
	showFeedback(questionEl, question, correct);

	let cumulativeCorrect = 0;
	for (const ans of answers.values()) {
		if (ans.correct) cumulativeCorrect++;
	}
	updateAnsweredCount(
		container,
		answers.size,
		cumulativeCorrect,
		allInteractive(quiz.items).length,
	);

	// Show correct answer if wrong
	if (!correct) {
		const correctEl = questionEl.querySelector<HTMLElement>(
			".quiz__correct-answer",
		);
		if (correctEl) {
			correctEl.style.display = "";
			correctEl.textContent = `Answer: ${question.correctAnswer}`;
		}
	}
}

function showFeedback(
	questionEl: HTMLElement,
	question: InteractiveQuestion,
	correct: boolean,
): void {
	// Disable options
	questionEl.querySelectorAll(".quiz__option, .quiz__tf-btn").forEach((el) => {
		el.classList.add("quiz__option--disabled", "quiz__tf-btn--disabled");
	});

	// Mark correct/wrong
	if (question.type === "single" || question.type === "multi") {
		const correctIndexes =
			question.type === "single"
				? [question.correctIndex]
				: question.correctIndexes;

		questionEl.querySelectorAll(".quiz__option").forEach((el) => {
			const idx = Number((el as HTMLElement).dataset.option);
			if (correctIndexes.includes(idx)) {
				el.classList.add("quiz__option--correct");
			} else if (el.classList.contains("quiz__option--selected")) {
				el.classList.add("quiz__option--wrong");
			}
		});
	} else if (question.type === "truefalse") {
		questionEl.querySelectorAll(".quiz__tf-btn").forEach((el) => {
			const val = (el as HTMLElement).dataset.tf === "true";
			if (val === question.correctAnswer) {
				el.classList.add("quiz__tf-btn--correct");
			} else if (el.classList.contains("quiz__option--selected")) {
				el.classList.add("quiz__tf-btn--wrong");
			}
		});
	}

	// Hide submit button
	const submitBtn = questionEl.querySelector<HTMLElement>(".quiz__submit-btn");
	if (submitBtn) submitBtn.style.display = "none";

	// Show feedback
	const feedback = questionEl.querySelector<HTMLElement>(".quiz__feedback");
	if (feedback) {
		feedback.style.display = "";
		const result = feedback.querySelector<HTMLElement>(
			".quiz__feedback-result",
		);
		if (result) {
			result.classList.add(
				correct
					? "quiz__feedback-result--correct"
					: "quiz__feedback-result--wrong",
			);
			result.textContent = correct ? "Correct!" : "Incorrect";
		}

		// Show correct answer if wrong
		if (!correct) {
			const correctEl = feedback.querySelector<HTMLElement>(
				".quiz__correct-answer",
			);
			if (correctEl) {
				correctEl.style.display = "";
				correctEl.textContent = formatCorrectAnswer(question);
			}
		}

		// Show explanation
		const explanation =
			feedback.querySelector<HTMLElement>(".quiz__explanation");
		if (explanation) {
			explanation.style.display = "";
		}
	}
}

function formatCorrectAnswer(question: InteractiveQuestion): string {
	switch (question.type) {
		case "single":
			return `Answer: ${question.options[question.correctIndex] ?? ""}`;
		case "multi":
			return `Answer: ${question.correctIndexes
				.map((i) => question.options[i] ?? "")
				.join(", ")}`;
		case "truefalse":
			return `Answer: ${question.correctAnswer ? "True" : "False"}`;
		case "freetext":
			return `Answer: ${question.correctAnswer}`;
	}
}

function updateAnsweredCount(
	container: HTMLElement,
	answered: number,
	correct: number,
	total: number,
): void {
	const answeredEl = container.querySelector(".quiz__answered");
	if (answeredEl) {
		answeredEl.textContent = ` ${answered} of ${total} answered`;
	}

	const scoreEl = container.querySelector(".quiz__results-score");
	if (scoreEl) {
		scoreEl.textContent = `Score: ${correct} / ${total}`;
	}
}

function updateSubmitButton(questionEl: HTMLElement, qtype: string): void {
	const submitBtn =
		questionEl.querySelector<HTMLButtonElement>(".quiz__submit-btn");
	if (!submitBtn) return;

	if (qtype === "single" || qtype === "multi") {
		const hasSelection = questionEl.querySelector(".quiz__option--selected");
		submitBtn.disabled = !hasSelection;
	} else if (qtype === "freetext") {
		const input = questionEl.querySelector<HTMLInputElement>(
			".quiz__freetext-input",
		);
		submitBtn.disabled = !input?.value.trim();
	}
}

function showResults(
	container: HTMLElement,
	answers: Map<string, QuizAnswer>,
	total: number,
): void {
	// Hide body and nav
	const body = container.querySelector<HTMLElement>(".quiz__body");
	if (body) body.style.display = "none";
	const nav = container.querySelector<HTMLElement>(".quiz__nav");
	if (nav) nav.style.display = "none";

	// Show results
	const results = container.querySelector<HTMLElement>(".quiz__results");
	if (!results) return;
	results.style.display = "";

	// Re-count correct from answers map
	let actualCorrect = 0;
	for (const ans of answers.values()) {
		if (ans.correct) actualCorrect++;
	}

	const scoreEl = results.querySelector<HTMLElement>(".quiz__results-score");
	if (scoreEl) {
		scoreEl.textContent = `Score: ${actualCorrect} / ${total}`;
	}

	const detailEl = results.querySelector<HTMLElement>(".quiz__results-detail");
	if (detailEl) {
		const pct = total > 0 ? Math.round((actualCorrect / total) * 100) : 0;
		detailEl.textContent =
			pct >= 80
				? "Great job!"
				: pct >= 60
					? "Good effort!"
					: "Keep practicing!";
	}

	// Also show in header
	const answeredEl = container.querySelector(".quiz__answered");
	if (answeredEl) {
		answeredEl.textContent = ` ${actualCorrect} / ${total} correct`;
	}
}

// --- Query helpers ---

function flattenAllItems(items: QuizItem[]): QuizItem[] {
	return items;
}

function allInteractive(items: QuizItem[]): InteractiveQuestion[] {
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

function findQuestion(
	items: QuizItem[],
	qid: string,
): InteractiveQuestion | null {
	for (const item of items) {
		if (item.type === "group") {
			for (const part of item.parts) {
				if (part.id === qid) return part;
			}
		} else if (
			item.type === "single" ||
			item.type === "multi" ||
			item.type === "truefalse" ||
			item.type === "freetext"
		) {
			if (item.id === qid) return item;
		}
	}
	return null;
}
