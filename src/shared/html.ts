export interface HtmlDocumentOptions {
  lang?: string;
  title: string;
  body: string;
  head?: readonly string[];
  htmlAttributes?: HtmlAttributeMap;
  bodyAttributes?: HtmlAttributeMap;
}

export type HtmlAttributeValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type HtmlAttributeMap = Record<string, HtmlAttributeValue>;

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderAttributes(attributes?: HtmlAttributeMap): string {
  if (!attributes) {
    return "";
  }

  const parts: string[] = [];

  for (const [name, value] of Object.entries(attributes)) {
    if (value === false || value == null) {
      continue;
    }

    if (value === true) {
      parts.push(name);
      continue;
    }

    parts.push(`${name}="${escapeHtml(String(value))}"`);
  }

  return parts.length === 0 ? "" : ` ${parts.join(" ")}`;
}

export function joinHtml(
  parts: ReadonlyArray<string | null | undefined | false>,
): string {
  return parts.filter((part): part is string => typeof part === "string" && part !== "").join(
    "",
  );
}

export function renderHtmlDocument(options: HtmlDocumentOptions): string {
  const lang = options.lang ?? "en";
  const htmlAttributes = renderAttributes({ lang, ...(options.htmlAttributes ?? {}) });
  const bodyAttributes = renderAttributes(options.bodyAttributes);
  const head = joinHtml([
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${escapeHtml(options.title)}</title>`,
    ...(options.head ?? []),
  ]);

  return `<!doctype html><html${htmlAttributes}><head>${head}</head><body${bodyAttributes}>${options.body}</body></html>`;
}
