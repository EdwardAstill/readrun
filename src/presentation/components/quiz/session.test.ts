import { expect, test } from "bun:test";
import type { QuizDefinition } from "./model";
import { createQuizSession, reduceQuizSession } from "./session";

const quiz: QuizDefinition = {
  id: "skip",
  title: "Skip",
  items: [
    { id: "q", type: "freetext", prompt: "Answer", answer: { expected: "yes" } },
    { id: "end", type: "info", content: "Done" },
  ],
};

test("skipping discards a draft without grading and permits completion after an info step", () => {
  let state = createQuizSession(quiz);
  expect(reduceQuizSession(quiz, state, { type: "complete" })).toBe(state);
  expect(reduceQuizSession(quiz, state, { type: "skip", itemId: "end" })).toBe(state);
  state = reduceQuizSession(quiz, state, { type: "answer", itemId: "q", answer: "yes" });
  state = reduceQuizSession(quiz, state, { type: "skip", itemId: "q" });
  expect(state.activeItemId).toBe("end");
  expect(state.answers).toEqual({});
  expect(state.grades).toEqual({});
  expect(state.skipped).toEqual(["q"]);
  state = reduceQuizSession(quiz, state, { type: "complete" });
  expect(state.phase).toBe("complete");
  expect(reduceQuizSession(quiz, state, { type: "restart" })).toEqual(createQuizSession(quiz));
});
