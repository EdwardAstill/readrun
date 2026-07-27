export interface ShortcutConfig {
  [name: string]: string;
}

export interface SavedEntry {
  path: string;
  label?: string;
}

export interface ReadrunConfig {
  shortcuts: ShortcutConfig;
  saved: SavedEntry[];
  recent: string[];
}

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  nextPage: "j",
  prevPage: "k",
  goHome: "g h",
  scrollDown: "Space",
  scrollUp: "Shift+Space",
  scrollToTop: "g g",
  scrollToBottom: "G",
  toggleSidebar: "s",
  focusMode: "f",
  nextTheme: "t",
  prevTheme: "T",
  search: "/",
  showShortcuts: "?",
  closeOverlay: "Escape",
};

export const DEFAULT_READRUN_CONFIG: ReadrunConfig = {
  shortcuts: DEFAULT_SHORTCUTS,
  saved: [],
  recent: [],
};

export function mergeReadrunConfig(
  value?: Partial<ReadrunConfig>,
): ReadrunConfig {
  return {
    shortcuts: { ...DEFAULT_SHORTCUTS, ...(value?.shortcuts ?? {}) },
    saved: [...(value?.saved ?? [])],
    recent: [...(value?.recent ?? [])],
  };
}
