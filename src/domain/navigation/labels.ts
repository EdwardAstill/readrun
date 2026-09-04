import type { Page } from "./model.ts";

export function pageNavigationLabel(page: Page): string {
  return page.filename.replace(/\.(md|jsx|pdf)$/i, "");
}
