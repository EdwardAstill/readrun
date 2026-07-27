/**
 * @readrun/widgets bundler — core logic
 *
 * All functions are pure/exported so they can be unit-tested in isolation.
 * The bundler turns a `<name>.tsx` source file into a self-contained `.jsx`
 * payload the readrun JSX runtime can mount: no imports, no exports, ending
 * with `render(<PascalName/>);`.
 */

import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import { execSync } from "child_process";

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert kebab-case to PascalCase.
 * e.g. "distribution-explorer" → "DistributionExplorer"
 */
export function kebabToPascal(name: string): string {
	return name
		.split("-")
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join("");
}

export interface WidgetExportInfo {
	kind: "default" | "named";
	name: string;
}

interface WidgetExportCandidate {
	kind: "default" | "named";
	exportedName: string;
	localName: string | null;
	reexported: boolean;
	anonymous: boolean;
}

const PASCAL_IDENTIFIER_RE = /^[A-Z][A-Za-z0-9_$]*$/;

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
	return ts.canHaveModifiers(node)
		? (ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) ??
				false)
		: false;
}

function isPascalName(name: string): boolean {
	return PASCAL_IDENTIFIER_RE.test(name);
}

function pushNamedExport(
	candidates: WidgetExportCandidate[],
	exportedName: string,
	localName: string | null,
	reexported = false,
): void {
	if (!isPascalName(exportedName)) return;
	candidates.push({
		kind: "named",
		exportedName,
		localName,
		reexported,
		anonymous: false,
	});
}

function collectVariableIdentifiers(
	declarations: ts.NodeArray<ts.VariableDeclaration>,
): string[] {
	const names: string[] = [];
	for (const declaration of declarations) {
		if (ts.isIdentifier(declaration.name)) names.push(declaration.name.text);
	}
	return names;
}

function collectWidgetExportCandidates(source: string): WidgetExportCandidate[] {
	const sourceFile = ts.createSourceFile(
		"widget.tsx",
		source,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TSX,
	);
	const candidates: WidgetExportCandidate[] = [];

	for (const statement of sourceFile.statements) {
		if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) {
			const localName = statement.name?.text ?? null;
			if (hasModifier(statement, ts.SyntaxKind.DefaultKeyword)) {
				candidates.push({
					kind: "default",
					exportedName: "default",
					localName,
					reexported: false,
					anonymous: localName === null,
				});
			} else if (
				localName &&
				hasModifier(statement, ts.SyntaxKind.ExportKeyword)
			) {
				pushNamedExport(candidates, localName, localName);
			}
			continue;
		}

		if (
			ts.isVariableStatement(statement) &&
			hasModifier(statement, ts.SyntaxKind.ExportKeyword)
		) {
			for (const localName of collectVariableIdentifiers(
				statement.declarationList.declarations,
			)) {
				pushNamedExport(candidates, localName, localName);
			}
			continue;
		}

		if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
			candidates.push({
				kind: "default",
				exportedName: "default",
				localName: ts.isIdentifier(statement.expression)
					? statement.expression.text
					: null,
				reexported: false,
				anonymous: !ts.isIdentifier(statement.expression),
			});
			continue;
		}

		if (
			!ts.isExportDeclaration(statement) ||
			!statement.exportClause ||
			statement.isTypeOnly
		) {
			continue;
		}
		if (!ts.isNamedExports(statement.exportClause)) continue;

		const reexported = Boolean(statement.moduleSpecifier);
		for (const element of statement.exportClause.elements) {
			if (element.isTypeOnly) continue;
			const exportedName = element.name.text;
			const localName = element.propertyName?.text ?? exportedName;
			if (exportedName === "default") {
				candidates.push({
					kind: "default",
					exportedName,
					localName,
					reexported,
					anonymous: false,
				});
			} else {
				pushNamedExport(candidates, exportedName, localName, reexported);
			}
		}
	}

	return candidates;
}

export function resolveWidgetExport(
	source: string,
	expectedName: string,
): WidgetExportInfo | null {
	const candidates = collectWidgetExportCandidates(source);
	const match = candidates.find(
		(candidate) =>
			!candidate.reexported &&
			candidate.localName === expectedName &&
			(candidate.kind === "default" || candidate.exportedName === expectedName),
	);

	if (!match) return null;
	return { kind: match.kind, name: expectedName };
}

function formatWidgetExportError(
	name: string,
	entryPath: string,
	expectedName: string,
	source: string,
): string {
	const candidates = collectWidgetExportCandidates(source);
	const header = `Widget "${name}" (${entryPath}) has no component export named "${expectedName}".`;
	const expected =
		`Expected one of:\n` +
		`  export function ${expectedName}() { ... }\n` +
		`  export const ${expectedName} = () => ...\n` +
		`  export default function ${expectedName}() { ... }\n` +
		`  const ${expectedName} = () => ...; export default ${expectedName};`;

	if (candidates.length === 0) return `${header}\n${expected}`;

	const defaultCandidate = candidates.find(
		(candidate) => candidate.kind === "default",
	);
	if (defaultCandidate?.anonymous) {
		return `${header}\nThe default export is anonymous or not a local identifier; name the component "${expectedName}".\n${expected}`;
	}
	if (defaultCandidate?.reexported) {
		return `${header}\nThe default export is re-exported; widgets must export a local component named "${expectedName}".\n${expected}`;
	}
	if (defaultCandidate?.localName) {
		return `${header}\nThe default export points at "${defaultCandidate.localName}". Rename it to "${expectedName}" or rename the file.\n${expected}`;
	}

	const expectedNamed = candidates.find(
		(candidate) => candidate.exportedName === expectedName,
	);
	if (expectedNamed?.reexported) {
		return `${header}\n"${expectedName}" is re-exported; widgets must export a local component named "${expectedName}".\n${expected}`;
	}
	if (expectedNamed?.localName && expectedNamed.localName !== expectedName) {
		return `${header}\n"${expectedName}" is exported from local "${expectedNamed.localName}"; widgets must use a local component named "${expectedName}".\n${expected}`;
	}

	const exportedNames = candidates
		.map((candidate) => candidate.localName ?? candidate.exportedName)
		.filter((candidateName) => candidateName && candidateName !== "default");
	if (exportedNames.length > 0) {
		return `${header}\nFound component export${exportedNames.length === 1 ? "" : "s"}: ${exportedNames.join(", ")}.\n${expected}`;
	}

	return `${header}\n${expected}`;
}

// ─── esbuild plugins ─────────────────────────────────────────────────────────

/**
 * Redirect `react`, `react-dom`, and `react/jsx-runtime` to the
 * `globalThis.React` / `globalThis.ReactDOM` UMD globals the readrun runtime
 * exposes. Without this, every widget would re-bundle react inline.
 */
export const reactGlobalsPlugin: esbuild.Plugin = {
	name: "react-globals",
	setup(build) {
		build.onResolve({ filter: /^react$/ }, () => ({
			path: "react",
			namespace: "globals",
		}));
		build.onResolve({ filter: /^react-dom$/ }, () => ({
			path: "react-dom",
			namespace: "globals",
		}));
		build.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({
			path: "react/jsx-runtime",
			namespace: "globals",
		}));
		build.onLoad({ filter: /.*/, namespace: "globals" }, (args) => ({
			contents:
				args.path === "react"
					? "module.exports = globalThis.React;"
					: args.path === "react-dom"
						? "module.exports = globalThis.ReactDOM;"
						: [
								"const React = globalThis.React;",
								"function jsx(type, props, key) {",
								"  const nextProps = key === undefined ? props : Object.assign({}, props, { key });",
								"  return React.createElement(type, nextProps);",
								"}",
								"module.exports = { Fragment: React.Fragment, jsx, jsxs: jsx };",
							].join("\n"),
			loader: "js",
		}));
	},
};

/**
 * Resolve `@readrun/widgets` and its subpath specifiers to absolute paths
 * inside the toolkit (this `widgets/` directory). Widget authors write:
 *
 *   import { Slider } from "@readrun/widgets/primitives";
 *
 * and the bundler points that at `readrun/src/widgets/primitives/index.tsx`.
 */
export function readrunWidgetsPlugin(toolkitRoot: string): esbuild.Plugin {
	const SUBPACKAGES = [
		"primitives",
		"plot",
		"diagram",
		"interaction",
		"draw",
		"math",
	];
	return {
		name: "readrun-widgets",
		setup(build) {
			build.onResolve({ filter: /^@readrun\/widgets(\/.*)?$/ }, (args) => {
				const spec = args.path;
				if (spec === "@readrun/widgets") {
					return { path: path.join(toolkitRoot, "index.ts") };
				}
				const rest = spec.slice("@readrun/widgets/".length);
				const [head, ...tail] = rest.split("/");
				if (!head || !SUBPACKAGES.includes(head)) {
					return {
						errors: [
							{
								text: `Unknown @readrun/widgets subpath: "${spec}". Valid roots: ${SUBPACKAGES.map((s) => `@readrun/widgets/${s}`).join(", ")}`,
							},
						],
					};
				}
				if (tail.length === 0) {
					const dir = path.join(toolkitRoot, head);
					const candidates = [
						path.join(dir, "index.tsx"),
						path.join(dir, "index.ts"),
					];
					for (const c of candidates) {
						if (fs.existsSync(c)) return { path: c };
					}
					return {
						errors: [{ text: `No index file under ${dir} for "${spec}".` }],
					};
				}
				const base = path.join(toolkitRoot, head, ...tail);
				const candidates = [
					base,
					base + ".tsx",
					base + ".ts",
					path.join(base, "index.tsx"),
					path.join(base, "index.ts"),
				];
				for (const c of candidates) {
					if (fs.existsSync(c) && fs.statSync(c).isFile()) return { path: c };
				}
				return {
					errors: [
						{
							text: `Cannot resolve "${spec}" — tried ${candidates.join(", ")}`,
						},
					],
				};
			});
		},
	};
}

// ─── banner ──────────────────────────────────────────────────────────────────

/**
 * Build the two-line banner comment.
 * Reads the toolkit git SHA at call time (not at import time).
 */
export function buildBanner(widgetName: string, toolkitRoot: string): string {
	let sha = "unknown";
	try {
		sha = execSync(`git -C "${toolkitRoot}" rev-parse --short HEAD`, {
			encoding: "utf8",
		}).trim();
	} catch {
		// not a git repo or git not available — use placeholder
	}

	const ts = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

	return (
		`// generated by @readrun/widgets — edit .readrun/widgets/${widgetName}.tsx, then re-run rr\n` +
		`// @readrun/widgets@${sha} — generated ${ts}\n`
	);
}

const WIDGET_RENDER_SENTINEL = "__readrunWidgetRender";

function buildRenderEntrySource(
	entryPath: string,
	exportInfo: WidgetExportInfo,
): string {
	const importPath = JSON.stringify(`./${path.basename(entryPath)}`);
	if (exportInfo.kind === "default") {
		return (
			`import WidgetComponent from ${importPath};\n` +
			`${WIDGET_RENDER_SENTINEL}(WidgetComponent);\n`
		);
	}

	return (
		`import { ${exportInfo.name} } from ${importPath};\n` +
		`${WIDGET_RENDER_SENTINEL}(${exportInfo.name});\n`
	);
}

function replaceRenderSentinel(source: string, pascalName: string): string {
	const sentinelCall = new RegExp(
		`(^|\\n)${WIDGET_RENDER_SENTINEL}\\([A-Za-z_$][A-Za-z0-9_$]*\\);(?=\\n|$)`,
	);
	if (!sentinelCall.test(source)) {
		throw new Error(
			`esbuild output for widget "${pascalName}" did not contain the generated render sentinel`,
		);
	}

	return source.replace(sentinelCall, `$1render(<${pascalName} />);\n`);
}

// ─── core bundler ────────────────────────────────────────────────────────────

export interface BundleWidgetOpts {
	/** Absolute path to the directory containing <name>.tsx files. */
	widgetsDir: string;
	/** Absolute path to readrun/src/widgets/ (for git SHA + @readrun/widgets resolution). */
	toolkitRoot: string;
}

/**
 * Bundle a single widget by name (kebab-case).
 * Returns the final .jsx source string ready for the readrun JSX runtime.
 */
export async function bundleWidget(
	name: string,
	opts: BundleWidgetOpts,
): Promise<string> {
	const { widgetsDir, toolkitRoot } = opts;
	const entryPath = path.join(widgetsDir, `${name}.tsx`);

	if (!fs.existsSync(entryPath)) {
		throw new Error(`Widget not found: ${entryPath}`);
	}

	const pascalName = kebabToPascal(name);

	const sourceText = fs.readFileSync(entryPath, "utf8");
	const exportInfo = resolveWidgetExport(sourceText, pascalName);
	if (exportInfo === null) {
		throw new Error(
			formatWidgetExportError(name, entryPath, pascalName, sourceText),
		);
	}

	const buildResult = await esbuild.build({
		stdin: {
			contents: buildRenderEntrySource(entryPath, exportInfo),
			resolveDir: widgetsDir,
			sourcefile: `${name}.readrun-entry.ts`,
			loader: "ts",
		},
		bundle: true,
		format: "esm",
		target: "es2020",
		jsx: "transform",
		loader: { ".tsx": "tsx", ".ts": "ts" },
		treeShaking: true,
		write: false,
		plugins: [reactGlobalsPlugin, readrunWidgetsPlugin(toolkitRoot)],
	});

	const first = buildResult.outputFiles[0];
	if (!first)
		throw new Error(`esbuild produced no output for widget "${name}"`);
	const rawSource = first.text;

	const withRender = replaceRenderSentinel(rawSource, pascalName);
	const banner = buildBanner(name, toolkitRoot);

	return banner + withRender;
}
