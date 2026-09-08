/**
 * Layout model — pure operations on the tiled LayoutNode tree. Knows nothing
 * about view records or floating surfaces: membership questions are answered
 * through an injected `holds` predicate, keeping this module testable in
 * isolation.
 */

import { createId } from "../ids";
import type { LayoutNode } from "../types";

/** Split ratios are clamped so no pane can collapse below 10%. */
export function clampRatio(ratio: number): number {
  return Math.min(0.9, Math.max(0.1, ratio));
}

/**
 * Set a split's ratio. Returns the same node when nothing changed so
 * listeners are not notified.
 */
export function resizeSplit(
  node: LayoutNode,
  splitId: string,
  ratio: number,
): LayoutNode {
  const clamped = clampRatio(ratio);

  function walk(current: LayoutNode): LayoutNode {
    if (current.type === "stack") return current;
    if (current.id === splitId) {
      return current.ratio === clamped
        ? current
        : { ...current, ratio: clamped };
    }
    const first = walk(current.first);
    const second = walk(current.second);
    if (first === current.first && second === current.second) return current;
    return { ...current, first, second };
  }

  return walk(node);
}

/**
 * Split the tree at the target stack: the target becomes the first child of
 * a new split and the fresh stack the second (or, at ratio > 0.5, swap).
 * Returns the same node when the target is absent.
 */
export function splitBeside(
  node: LayoutNode,
  targetStackId: string,
  newStackId: string,
  direction: "horizontal" | "vertical",
  ratio = 0.5,
): LayoutNode {
  if (node.type === "stack") {
    if (node.stackId !== targetStackId) return node;
    return {
      type: "split",
      id: createId("split"),
      direction,
      ratio: clampRatio(ratio),
      first: node,
      second: { type: "stack", stackId: newStackId },
    };
  }
  return {
    ...node,
    first: splitBeside(node.first, targetStackId, newStackId, direction, ratio),
    second: splitBeside(
      node.second,
      targetStackId,
      newStackId,
      direction,
      ratio,
    ),
  };
}

/**
 * Split the tree at the target stack, placing the fresh stack on the given
 * side (before = left/top) as an even 50/50 split — the drag-and-drop edge
 * insertion. Returns the same node when the target is absent.
 */
export function splitAtEdge(
  node: LayoutNode,
  targetStackId: string,
  newStackId: string,
  direction: "horizontal" | "vertical",
  before: boolean,
): LayoutNode {
  if (node.type === "stack") {
    if (node.stackId !== targetStackId) return node;
    const inserted: LayoutNode = { type: "stack", stackId: newStackId };
    return {
      type: "split",
      id: createId("split"),
      direction,
      ratio: 0.5,
      first: before ? inserted : node,
      second: before ? node : inserted,
    };
  }
  const first = splitAtEdge(
    node.first,
    targetStackId,
    newStackId,
    direction,
    before,
  );
  const second = splitAtEdge(
    node.second,
    targetStackId,
    newStackId,
    direction,
    before,
  );
  if (first === node.first && second === node.second) return node;
  return { ...node, first, second };
}

/**
 * Remove an empty stack from the tree, collapsing its parent split so the
 * sibling takes the full space. Returns null if the stack could not be
 * pruned (absent, or it IS the root — the caller decides whether the lone
 * empty root stack is kept so the tiled surface never vanishes).
 */
export function pruneStack(
  node: LayoutNode,
  stackId: string,
): { node: LayoutNode } | null {
  if (node.type === "stack") return null;

  const { first, second } = node;
  if (first.type === "stack" && first.stackId === stackId) {
    return { node: second };
  }
  if (second.type === "stack" && second.stackId === stackId) {
    return { node: first };
  }

  const prunedFirst = pruneStack(first, stackId);
  if (prunedFirst) return { node: { ...node, first: prunedFirst.node } };

  const prunedSecond = pruneStack(second, stackId);
  if (prunedSecond) return { node: { ...node, second: prunedSecond.node } };

  return null;
}

/** First stack in depth-first order — the fallback drop/activation target. */
export function findFirstStackId(node: LayoutNode): string | undefined {
  if (node.type === "stack") return node.stackId;
  return (
    findFirstStackId(node.first) ?? findFirstStackId(node.second) ?? undefined
  );
}

/**
 * Find the tiled stack that satisfies the membership predicate, in depth-first
 * order. Surface-level callers pass a predicate backed by stack records;
 * floating stacks are checked before the tree is walked.
 */
export function findStackIdForView(
  node: LayoutNode,
  holds: (stackId: string) => boolean,
): string | undefined {
  if (node.type === "stack")
    return holds(node.stackId) ? node.stackId : undefined;
  return (
    findStackIdForView(node.first, holds) ??
    findStackIdForView(node.second, holds)
  );
}
