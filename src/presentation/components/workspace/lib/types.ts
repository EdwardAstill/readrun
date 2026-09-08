/**
 * Workspace data model — the single source of truth for the workspace system.
 *
 * Glossary — three levels, deliberately kept apart (one word per concept):
 *
 *   VIEW     — WHAT is open (an editor, a calculator). Never a property of
 *              placement; a "tab" is just a view placed in a stack.
 *   STACK    — a group of views rendered as tabs. Knows nothing about WHERE
 *              it is displayed; one stack type serves every surface.
 *   SURFACE  — WHERE a stack is displayed: a leaf of the tiled tree, a
 *              floating window, or a popout browser window. Moving a view
 *              changes surfaces/state only — never the view.
 *
 * This module is intentionally React-free and DOM-free so it can be unit
 * tested and reused outside the UI layer.
 */

/** Identifies a kind of view, resolved against the consumer's views map. */
export type ViewType = string;

/** A single open thing. `id` is stable for the lifetime of the view. */
export interface WorkspaceView {
 id: string;
 type: ViewType;
 title: string;
 /** Whether workspace controls may close this view. Defaults to true. */
 closable?: boolean;
 /** Keep this view on its current kind of surface. Defaults to false. */
 pinned?: boolean;
}

/**
 * A group of views rendered as tabs. Exactly one view is active at a time.
 * An empty stack (no views) is valid and renders an empty state.
 */
export interface TabStack {
 id: string;
 viewIds: string[];
 activeViewId: string | null;
}

/**
 * The tiled layout tree. The tree references stacks by id — it never embeds
 * views. Splits hold normalized ratios (0 < ratio < 1) so they scale with
 * their container.
 */
export type LayoutNode = LayoutStack | LayoutSplit;

export interface LayoutStack {
 type: "stack";
 stackId: string;
}

export interface LayoutSplit {
 type: "split";
 /** Stable id so resize handles (and drop targets) can address it. */
 id: string;
 /** "horizontal" = side by side, "vertical" = stacked top/bottom. */
 direction: "horizontal" | "vertical";
 /** Fraction of the container given to `first` (0..1). */
 ratio: number;
 first: LayoutNode;
 second: LayoutNode;
}

/**
 * A floating surface hosting one stack, positioned over the tiled area.
 * Geometry lives in state (not component state) so it persists and can be
 * serialized.
 */
export interface FloatingSurface {
 id: string;
 /** The stack this window hosts (a stack lives in the tree OR in a float). */
 stackId: string;
 x: number;
 y: number;
 width: number;
 height: number;
 /** Stacking order; higher is in front. Mirrors into DOM z-index. */
 zIndex: number;
}

/**
 * A popout surface: a stack hosted in its own browser window
 * (`window.open`). Only serializable facts live here; the live `Window`
 * handle is managed by the popouts hook layer, keyed by surface id.
 */
export interface PopoutSurface {
 id: string;
 /** The stack this window hosts (single-view stack per popout). */
 stackId: string;
 /** Initial window dimensions; the user may resize the OS window freely. */
 width: number;
 height: number;
}

/** The entire workspace state. Pure data — serializable for persistence. */
export interface WorkspaceState {
 views: Record<string, WorkspaceView>;
 stacks: Record<string, TabStack>;
 /** The main tiled surface's split tree. */
 tiled: LayoutNode;
 /**
  * The stack the user is currently working in (last clicked tab strip).
  * New views open here and "split" targets it when no explicit stack is
  * given. Null when no stack has been focused yet.
  */
 activeStackId: string | null;
 /** Floating surfaces over the tiled area. */
 floating: Record<string, FloatingSurface>;
 /** Popout surfaces in their own browser windows. */
 popouts: Record<string, PopoutSurface>;
 /** Monotonic counter for assigning z-order to floating surfaces. */
 nextZIndex: number;
}
