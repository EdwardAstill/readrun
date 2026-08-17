import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import {
	Questionnaire,
	QuestionnaireActions,
	QuestionnaireChoice,
	QuestionnaireChoiceDescription,
	QuestionnaireChoices,
	QuestionnaireDescription,
	QuestionnaireError,
	QuestionnaireInput,
	QuestionnaireItem,
	QuestionnaireNext,
	QuestionnairePrevious,
	QuestionnaireProgress,
	QuestionnaireSubmit,
	QuestionnaireTitle,
} from "./Questionnaire.tsx";

const items = [
	{
		name: "single",
		required: true,
		choices: [{ value: "one" }, { value: "two", disabled: true }],
	},
	{
		name: "multiple",
		choices: [{ value: "a" }, { value: "b" }],
	},
	{ name: "free", required: true },
] as const;

test("Questionnaire keeps the official semantic composition and native controls", () => {
	const html = renderToStaticMarkup(
		<Questionnaire defaultItem="single" items={items} shortcuts="letters">
			<QuestionnaireProgress
				aria-label="Quiz progress"
				render={(props, state) => (
					<span {...props}>
						Question {state.current} of {state.total}
					</span>
				)}
			/>
			<QuestionnaireItem name="single" required>
				<QuestionnaireTitle>Choose one</QuestionnaireTitle>
				<QuestionnaireDescription>One answer only.</QuestionnaireDescription>
				<QuestionnaireChoices>
					<QuestionnaireChoice value="one">
						First
						<QuestionnaireChoiceDescription>
							Available choice
						</QuestionnaireChoiceDescription>
					</QuestionnaireChoice>
					<QuestionnaireChoice value="two" disabled>
						Second
					</QuestionnaireChoice>
				</QuestionnaireChoices>
				<QuestionnaireError />
			</QuestionnaireItem>
			<QuestionnaireItem name="multiple" multiple>
				<QuestionnaireTitle>Choose several</QuestionnaireTitle>
				<QuestionnaireChoices>
					<QuestionnaireChoice value="a">A</QuestionnaireChoice>
					<QuestionnaireChoice value="b">B</QuestionnaireChoice>
				</QuestionnaireChoices>
			</QuestionnaireItem>
			<QuestionnaireItem name="free" required>
				<QuestionnaireTitle>Write an answer</QuestionnaireTitle>
				<QuestionnaireInput aria-label="Free answer" disabled />
			</QuestionnaireItem>
			<QuestionnaireActions>
				<QuestionnairePrevious />
				<QuestionnaireNext />
				<QuestionnaireSubmit />
			</QuestionnaireActions>
		</Questionnaire>,
	);

	expect(html).toContain('data-slot="questionnaire"');
	expect(html).toContain('data-slot="questionnaire-progress"');
	expect(html).toContain("Question 1 of 3");
	expect(html).toContain("<fieldset");
	expect(html).toContain("<legend");
	expect(html).toContain('type="radio"');
	expect(html).toContain('type="checkbox"');
	expect(html).toContain('name="single"');
	expect(html).toContain('name="multiple"');
	expect(html).toContain('data-slot="questionnaire-input"');
	expect(html).toContain('aria-label="Free answer"');
	expect(html).toContain("disabled");
	expect(html).toContain('data-slot="questionnaire-actions"');
	expect(html).toContain('data-slot="questionnaire-previous"');
	expect(html).toContain('data-slot="questionnaire-next"');
	expect(html).toContain('data-slot="questionnaire-submit"');
	expect(html).toContain("rounded-lg");
	expect(html).toContain("focus-within:ring-3");
});
