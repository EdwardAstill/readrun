import { join } from "path";
import { mkdir, writeFile, stat } from "fs/promises";
import { homedir } from "os";

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

export interface SavedEntry {
  name: string;
  path: string;
}

export interface ReadrunConfig {
  shortcuts: ShortcutConfig;
  saved: SavedEntry[];
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

export const defaultConfig: ReadrunConfig = {
  shortcuts: { ...defaultShortcuts },
  saved: [],
};

function escapeTomlString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function shortcutsToToml(shortcuts: ShortcutConfig): string {
  const lines = ["[shortcuts]"];
  const maxKey = Math.max(...Object.keys(shortcuts).map(k => k.length));
  for (const [key, value] of Object.entries(shortcuts)) {
    lines.push(`${key.padEnd(maxKey)} = "${value}"`);
  }
  return lines.join("\n") + "\n";
}

function savedToToml(entries: SavedEntry[]): string {
  if (entries.length === 0) return "";
  return entries
    .map(e => `[[saved]]\nname = "${escapeTomlString(e.name)}"\npath = "${escapeTomlString(e.path)}"`)
    .join("\n\n") + "\n";
}

function configToToml(config: ReadrunConfig): string {
  let toml = shortcutsToToml(config.shortcuts);
  if (config.saved.length > 0) {
    toml += "\n" + savedToToml(config.saved);
  }
  return toml;
}

function getConfigPath(): string {
  return join(homedir(), ".config", "readrun", "settings.toml");
}

export async function saveConfig(config: ReadrunConfig): Promise<void> {
  const configPath = getConfigPath();
  const configDir = join(homedir(), ".config", "readrun");
  await mkdir(configDir, { recursive: true });
  await writeFile(configPath, configToToml(config));
}

export async function loadConfig(): Promise<ReadrunConfig> {
  const configPath = getConfigPath();
  const configDir = join(homedir(), ".config", "readrun");

  try {
    await stat(configPath);
  } catch {
    // File doesn't exist — create it with defaults
    await mkdir(configDir, { recursive: true });
    await writeFile(configPath, shortcutsToToml(defaultShortcuts));
    return structuredClone(defaultConfig);
  }

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

    if (Array.isArray(parsed.saved)) {
      config.saved = parsed.saved
        .filter((e: any) => typeof e.name === "string" && typeof e.path === "string")
        .map((e: any) => ({ name: e.name, path: e.path }));
    }

    return config;
  } catch {
    return structuredClone(defaultConfig);
  }
}
