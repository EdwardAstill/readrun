/**
 * Workspace keymap — pure data mapping command ids to key combinations.
 *
 * The keymap is CONFIG, not state: it describes how the user talks to the
 * workspace, not what the workspace contains. It travels in
 * WorkspaceConfig and is interpreted by hooks/use-workspace-keymap.ts.
 *
 * Combo syntax: modifier keys joined with "+", actual key last.
 *   "mod+w"        — mod = Ctrl on Linux/Windows, Cmd on macOS
 *   "ctrl+Tab"     — literal modifiers and key names
 *   "alt+ArrowDown" — event.key names, case-insensitive
 *
 * Note: avoid combos the browser reserves (e.g. mod+w / ctrl+t / ctrl+n) —
 * page JavaScript cannot intercept those. The defaults stick to alt+ combos,
 * which are reliably preventable; consumers are expected to override.
 */

export type ModifierKey = "ctrl" | "alt" | "meta" | "shift";

/** e.g. "mod+w", "ctrl+shift+Tab". The key is the last "+-separated part". */
export type KeyCombo = string;

/** High-level workspace operations the keymap can bind. */
export type WorkspaceCommand =
 | "view/close"
 | "view/activate-next"
 | "view/activate-prev"
 | "view/float"
 | "view/dock"
 | "view/popout";

export type WorkspaceKeymap = Partial<
 Record<WorkspaceCommand, KeyCombo | KeyCombo[]>
>;

export const defaultKeymap: Required<WorkspaceKeymap> = {
 "view/close": "alt+w",
 "view/activate-next": "alt+ArrowDown",
 "view/activate-prev": "alt+ArrowUp",
 "view/float": "alt+f",
 "view/dock": "alt+d",
 "view/popout": "alt+p",
};

/**
 * Whether a KeyboardEvent matches a combo. Modifiers must match exactly
 * (except that the browser may fold e.g. AltGraph — handled loosely).
 */
export function eventMatchesCombo(
 combo: KeyCombo,
 event: KeyboardEvent,
): boolean {
 const parts = combo.toLowerCase().split("+");
 const key = parts[parts.length - 1];
 const mods = new Set(parts.slice(0, -1));

 const wantsMod = mods.delete("mod");
 const isMac = /mac/i.test(
  typeof navigator !== "undefined"
   ? navigator.platform || navigator.userAgent
   : "",
 );
 const wantsCtrl = mods.delete("ctrl") || (wantsMod && !isMac);
 const wantsMeta = mods.delete("meta") || (wantsMod && isMac);
 const wantsAlt = mods.delete("alt");
 const wantsShift = mods.delete("shift");
 if (mods.size > 0) return false; // unknown modifier in the combo

 return (
  event.key.toLowerCase() === key &&
  event.ctrlKey === wantsCtrl &&
  event.metaKey === wantsMeta &&
  event.altKey === wantsAlt &&
  event.shiftKey === wantsShift
 );
}

/** Map a DOM modifier name ("ctrl") to its KeyboardEvent property. */
export function modifierToEventKey(
 modifier: ModifierKey,
): "ctrlKey" | "altKey" | "metaKey" | "shiftKey" {
 switch (modifier) {
  case "ctrl":
   return "ctrlKey";
  case "alt":
   return "altKey";
  case "meta":
   return "metaKey";
  case "shift":
   return "shiftKey";
 }
}
