import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { DocumentProps } from "../contracts.ts";
import { Document } from "./Document.tsx";

export function renderDocument(
	props: DocumentProps & { basePath?: string },
): string {
	return `<!doctype html>${renderToStaticMarkup(<Document {...props} />)}`;
}
