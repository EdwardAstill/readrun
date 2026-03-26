import { join } from "path";

export interface ShortcutConfig {
  nextPage: string;
  prevPage: string;
  goHome: string;
  scrollDown: string;
  scrollUp: string;
  scrollToTop: string;
  scrollToBottom: string;
  toggleSidebar: string;
  focusMode: string;
  nextTheme: string;
  prevTheme: string;
  fontIncrease: string;
  fontDecrease: string;
  search: string;
  showShortcuts: string;
  closeOverlay: string;
}

export interface ExplainrConfig {
  shortcuts: ShortcutConfig;
}

export const defaultShortcuts: ShortcutConfig = {
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
  fontIncrease: "+",
  fontDecrease: "-",
  search: "/",
  showShortcuts: "?",
  closeOverlay: "Escape",
};

export const defaultConfig: ExplainrConfig = {
  shortcuts: { ...defaultShortcuts },
};

export async function loadConfig(contentDir: string): Promise<ExplainrConfig> {
  const configPath = join(contentDir, ".config", "explainr", "settings.toml");
  try {
    const file = Bun.file(configPath);
    const text = await file.text();
    const parsed = Bun.TOML.parse(text) as Record<string, any>;

    const config = structuredClone(defaultConfig);

    if (parsed.shortcuts && typeof parsed.shortcuts === "object") {
      for (const [key, value] of Object.entries(parsed.shortcuts)) {
        if (key in config.shortcuts && typeof value === "string") {
          (config.shortcuts as Record<string, string>)[key] = value;
        }
      }
    }

    return config;
  } catch {
    return structuredClone(defaultConfig);
  }
}
