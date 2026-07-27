import type React from "react";

import type { DocumentProps } from "../contracts.ts";
import { MainContent } from "./MainContent.tsx";
import { PageMeta } from "./PageMeta.tsx";
import { ReadrunShell } from "./ReadrunShell.tsx";

const KATEX_STYLESHEET_URL =
	"https://cdn.jsdelivr.net/npm/katex@0.16.43/dist/katex.min.css";

export function Document(props: DocumentProps): React.JSX.Element {
	const { shell, runtime, bodyClassName, head, inlineCss, pageData, basePath } =
		props;
	const title = shell.siteTitle
		? `${shell.page.title} | ${shell.siteTitle}`
		: shell.page.title;
	const serialisedPageData = JSON.stringify(
		pageData ?? {
			page: {
				url: shell.page.url,
				relPath: shell.page.relPath,
				title: shell.page.title,
				kind: shell.page.kind,
			},
		},
	);
	const tocItems = shell.toc ?? [];
	const pageMeta =
		(shell.meta?.length ?? 0) > 0 ? (
			<PageMeta entries={shell.meta ?? []} />
		) : null;

	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="generator" content="readrun" />
				{basePath ? <base href={basePath} /> : null}
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
					rel="stylesheet"
				/>
				<link
					rel="stylesheet"
					href={KATEX_STYLESHEET_URL}
					crossOrigin="anonymous"
				/>
				{runtime.clientStyleUrl ? (
					<link rel="stylesheet" href={runtime.clientStyleUrl} />
				) : null}
				<title>{title}</title>
				{inlineCss ? (
					<style
						dangerouslySetInnerHTML={{
							__html: inlineCss,
						}}
					/>
				) : null}
				<script
					id="readrun-runtime-config"
					type="application/json"
					dangerouslySetInnerHTML={{
						__html: serialiseJsonScript(runtime),
					}}
				/>
				{head}
			</head>
			<body className={bodyClassName}>
				<ReadrunShell
					navigation={shell.navigation}
					page={shell.page}
					siteTitle={shell.siteTitle}
					searchEnabled={shell.searchEnabled}
					settingsEnabled={shell.settingsEnabled}
					mainContent={<MainContent html={shell.contentHtml} />}
					tocItems={tocItems.length > 0 ? tocItems : undefined}
					pageMeta={pageMeta}
					resources={shell.resources}
				/>
				<script
					id="readrun-files"
					type="application/json"
					dangerouslySetInnerHTML={{
						__html: serialiseJsonScript(serialisedPageData, true),
					}}
				/>
				<script type="module" src={runtime.clientScriptUrl} />
			</body>
		</html>
	);
}

function serialiseJsonScript(value: unknown, preSerialised = false): string {
	const json = preSerialised ? String(value) : JSON.stringify(value);
	return json
		.replaceAll("<", "\\u003c")
		.replaceAll(">", "\\u003e")
		.replaceAll("&", "\\u0026");
}
