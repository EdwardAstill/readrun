// Optional browser-side Python execution via Pyodide (WebAssembly).
// Only loaded when enableBrowserPython is true in runtime config.

// --- Types ---

interface PyodideInterface {
	runPython(code: string): unknown;
	loadPackage(names: string | string[]): Promise<void>;
	FS: {
		writeFile(path: string, data: Uint8Array): void;
		readFile(path: string): Uint8Array;
		readdir(path: string): string[];
	};
	pyimport(name: string): {
		install(pkg: string): Promise<void>;
	};
}

declare global {
	// Provided by Pyodide's CDN script
	function loadPyodide(): Promise<PyodideInterface>;
}

// --- Constants ---

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js";

const IMAGE_EXTENSIONS = new Set([
	"png",
	"jpg",
	"jpeg",
	"gif",
	"svg",
	"webp",
	"bmp",
]);

const IMPORT_TO_PACKAGE: Record<string, string> = {
	PIL: "pillow",
	cv2: "opencv-python",
	sklearn: "scikit-learn",
	skimage: "scikit-image",
	bs4: "beautifulsoup4",
	yaml: "pyyaml",
	attr: "attrs",
	dotenv: "python-dotenv",
	gi: "pygobject",
};

const STDLIB = new Set([
	"sys",
	"os",
	"io",
	"re",
	"math",
	"json",
	"csv",
	"collections",
	"itertools",
	"functools",
	"operator",
	"string",
	"datetime",
	"time",
	"random",
	"hashlib",
	"pathlib",
	"typing",
	"abc",
	"copy",
	"enum",
	"dataclasses",
	"decimal",
	"fractions",
	"statistics",
	"textwrap",
	"unicodedata",
	"struct",
	"codecs",
	"pprint",
	"logging",
	"warnings",
	"traceback",
	"unittest",
	"doctest",
	"argparse",
	"configparser",
	"pickle",
	"shelve",
	"sqlite3",
	"gzip",
	"zipfile",
	"tarfile",
	"tempfile",
	"shutil",
	"glob",
	"fnmatch",
	"base64",
	"binascii",
	"html",
	"xml",
	"urllib",
	"http",
	"email",
	"socket",
	"ssl",
	"select",
	"threading",
	"multiprocessing",
	"subprocess",
	"signal",
	"contextlib",
	"weakref",
	"array",
	"queue",
	"heapq",
	"bisect",
	"ast",
	"dis",
	"inspect",
	"importlib",
	"pkgutil",
	"platform",
	"sysconfig",
	"gc",
	"ctypes",
	"calendar",
	"locale",
	"gettext",
	"numbers",
]);

// --- Singleton state ---

let pyodide: PyodideInterface | null = null;
let pyodideLoading: Promise<PyodideInterface> | null = null;
let packagesReady: Promise<void> | null = null;
let matplotlibPatched = false;

// --- Package parsing ---

function parseImports(code: string): string[] {
	const packages = new Set<string>();
	const importPattern = /^(?:import|from)\s+(\w+)/gm;
	let match: RegExpExecArray | null;
	while ((match = importPattern.exec(code)) !== null) {
		const module = match[1]!;
		if (!STDLIB.has(module)) {
			packages.add(IMPORT_TO_PACKAGE[module] ?? module);
		}
	}
	return [...packages];
}

// --- Loading ---

export async function loadPyodideRuntime(): Promise<PyodideInterface> {
	if (pyodide) {
		return pyodide;
	}
	if (pyodideLoading) {
		return pyodideLoading;
	}

	const loading = (async () => {
		// Load Pyodide script
		const script = document.createElement("script");
		script.src = PYODIDE_URL;
		document.head.appendChild(script);
		await new Promise<void>((resolve, reject) => {
			script.onload = () => resolve();
			script.onerror = () => reject(new Error("Failed to load Pyodide"));
		});

		pyodide = await loadPyodide();

		// Load page data files into Pyodide FS
		const filesEl = document.getElementById("readrun-files");
		if (filesEl) {
			try {
				const data = JSON.parse(filesEl.textContent) as unknown;
				const files: Array<{ name: string }> =
					data &&
					typeof data === "object" &&
					"files" in data &&
					Array.isArray((data as Record<string, unknown>).files)
						? ((data as Record<string, unknown>).files as Array<{
								name: string;
							}>)
						: [];
				await Promise.all(
					files.map(async (file) => {
						try {
							const response = await fetch(
								`/_readrun/files/${encodeURIComponent(file.name)}`,
							);
							if (!response.ok) {
								return;
							}
							const bytes = new Uint8Array(await response.arrayBuffer());
							pyodide!.FS.writeFile(file.name, bytes);
						} catch {
							// Best-effort file loading
						}
					}),
				);
			} catch {
				// Best-effort config parsing
			}
		}

		return pyodide!;
	})();
	pyodideLoading = loading;
	try {
		return await loading;
	} catch (error) {
		if (pyodideLoading === loading) {
			pyodideLoading = null;
		}
		throw error;
	}
}

// --- Package installation ---

export async function installPackages(packages: string[]): Promise<void> {
	if (packages.length === 0) {
		return;
	}

	const py = await loadPyodideRuntime();
	await py.loadPackage("micropip");
	const micropip = py.pyimport("micropip");

	for (const pkg of packages) {
		try {
			await micropip.install(pkg);
		} catch {
			// Best-effort package installation
		}
	}

	// Patch matplotlib to capture figures as base64 images
	if (packages.includes("matplotlib") && !matplotlibPatched) {
		py.runPython(`
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as _plt
_readrun_figures = []
def _readrun_show(*a, **kw):
    import io as _io, base64 as _b64
    for _num in _plt.get_fignums():
        _fig = _plt.figure(_num)
        _buf = _io.BytesIO()
        _fig.savefig(_buf, format="png", dpi=150, bbox_inches="tight")
        _buf.seek(0)
        _readrun_figures.append(_b64.b64encode(_buf.read()).decode())
    _plt.close("all")
_plt.show = _readrun_show
`);
		matplotlibPatched = true;
	}
}

// --- Scanning page for imports ---

function scanPageImports(): string[] {
	const allPackages = new Set<string>();
	const scripts = document.querySelectorAll<HTMLScriptElement>(
		"script[data-source]",
	);
	for (const script of scripts) {
		try {
			const code = atob(script.textContent ?? "");
			for (const pkg of parseImports(code)) {
				allPackages.add(pkg);
			}
		} catch {
			// Best-effort
		}
	}
	return [...allPackages];
}

// Pre-scan page imports on module load
const pagePackages = scanPageImports();
if (pagePackages.length > 0) {
	packagesReady = installPackages(pagePackages);
}

// --- FS helpers ---

function snapshotFS(py: PyodideInterface): Set<string> {
	try {
		return new Set(
			py.FS.readdir("/home/pyodide").filter(
				(file: string) => file !== "." && file !== "..",
			),
		);
	} catch {
		return new Set();
	}
}

function detectNewFiles(py: PyodideInterface, before: Set<string>): string[] {
	try {
		const after = py.FS.readdir("/home/pyodide").filter(
			(file: string) => file !== "." && file !== "..",
		);
		return after.filter((file) => !before.has(file));
	} catch {
		return [];
	}
}

// --- Rendering output ---

function renderFileDownloads(
	py: PyodideInterface,
	newFiles: string[],
	outputEl: HTMLElement,
): void {
	for (const file of newFiles) {
		try {
			const data = py.FS.readFile(`/home/pyodide/${file}`);
			// Pyodide FS returns Uint8Array; cast for Blob constructor
			const blob = new Blob([data as unknown as BlobPart]);
			const url = URL.createObjectURL(blob);

			const ext = file.split(".").pop()?.toLowerCase() ?? "";

			if (IMAGE_EXTENSIONS.has(ext)) {
				const img = document.createElement("img");
				img.src = url;
				img.alt = file;
				img.style.maxWidth = "100%";
				img.style.marginTop = "8px";
				outputEl.appendChild(img);
			}

			const link = document.createElement("a");
			link.href = url;
			link.download = file;
			link.textContent = `\u2b07 ${file}`;
			link.className = "exec-file-link";
			outputEl.appendChild(link);
		} catch {
			// Best-effort
		}
	}
}

function renderFigures(py: PyodideInterface, outputEl: HTMLElement): void {
	try {
		const figList = py.runPython(
			"_readrun_figures if '_readrun_figures' in dir() else []",
		) as string[];

		if (!figList || !Array.isArray(figList) || figList.length === 0) {
			return;
		}

		for (const b64 of figList) {
			const img = document.createElement("img");
			img.src = `data:image/png;base64,${b64}`;
			img.style.maxWidth = "100%";
			img.style.marginTop = "8px";
			outputEl.appendChild(img);
		}

		py.runPython("_readrun_figures.clear()");
	} catch {
		// Best-effort
	}
}

// --- Execution ---

export interface PyodideExecResult {
	stdout: string;
	stderr: string;
	images: string[];
}

export async function runPyodidePython(
	code: string,
): Promise<PyodideExecResult> {
	if (packagesReady) {
		await packagesReady;
	}

	const py = await loadPyodideRuntime();

	// Install any new packages needed for this code
	const pkgs = parseImports(code);
	if (pkgs.length > 0) {
		await installPackages(pkgs);
	}

	// Capture stdout/stderr
	const stdoutParts: string[] = [];
	const stderrParts: string[] = [];
	let imageCount = 0;

	try {
		py.runPython(`
import sys
import io as _rr_io
_readrun_stdout = _rr_io.StringIO()
_readrun_stderr = _rr_io.StringIO()
sys.stdout = _readrun_stdout
sys.stderr = _readrun_stderr
`);
		py.runPython(code);
	} finally {
		try {
			const captured = py.runPython(
				"_readrun_stdout.getvalue() if '_readrun_stdout' in dir() else ''",
			) as string;
			if (captured) {
				stdoutParts.push(captured);
			}
		} catch {
			// Best-effort
		}

		try {
			const captured = py.runPython(
				"_readrun_stderr.getvalue() if '_readrun_stderr' in dir() else ''",
			) as string;
			if (captured) {
				stderrParts.push(captured);
			}
		} catch {
			// Best-effort
		}
	}

	// Collect matplotlib figures
	const figList = (() => {
		try {
			return py.runPython(
				"_readrun_figures if '_readrun_figures' in dir() else []",
			) as string[];
		} catch {
			return [];
		}
	})();

	if (figList && figList.length > 0) {
		imageCount = figList.length;
		for (const _b64 of figList) {
			stdoutParts.push(`[Image: figure ${imageCount}]`);
		}
		py.runPython("_readrun_figures.clear()");
	}

	try {
		py.runPython("sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__");
	} catch {
		// Best-effort
	}

	return {
		stdout: stdoutParts.join("\n"),
		stderr: stderrParts.join("\n"),
		images: [],
	};
}

export async function runPyodideBlock(
	blockId: string,
	code: string,
): Promise<void> {
	const outputEl = document.querySelector<HTMLElement>(
		`.exec-output[data-output="${CSS.escape(blockId)}"]`,
	);
	const runBtn = document.querySelector<HTMLButtonElement>(
		`.exec-run-btn[data-block-id="${CSS.escape(blockId)}"]`,
	);

	if (!outputEl || !runBtn) {
		return;
	}

	runBtn.disabled = true;
	runBtn.textContent = pyodide ? "Running..." : "Loading Python...";

	// Clear output
	while (outputEl.firstChild) {
		outputEl.firstChild.remove();
	}

	try {
		if (packagesReady) {
			runBtn.textContent = "Installing packages...";
			await packagesReady;
		}

		const py = await loadPyodideRuntime();
		const pkgs = parseImports(code);

		if (pkgs.length > 0 && !packagesReady) {
			runBtn.textContent = "Installing packages...";
			await installPackages(pkgs);
		}

		runBtn.textContent = "Running...";
		const beforeFS = snapshotFS(py);
		const result = await runPyodidePython(code);

		// Render output
		while (outputEl.firstChild) {
			outputEl.removeChild(outputEl.firstChild);
		}

		if (result.stdout) {
			const pre = document.createElement("pre");
			pre.className = "stdout";
			pre.textContent = result.stdout;
			outputEl.appendChild(pre);
		}

		if (result.stderr) {
			const pre = document.createElement("pre");
			pre.className = "stderr";
			pre.textContent = result.stderr;
			outputEl.appendChild(pre);
		}

		renderFigures(py, outputEl);

		const newFiles = detectNewFiles(py, beforeFS);
		renderFileDownloads(py, newFiles, outputEl);
	} catch (err) {
		while (outputEl.firstChild) {
			outputEl.removeChild(outputEl.firstChild);
		}
		const pre = document.createElement("pre");
		pre.className = "error";
		const message = err instanceof Error ? err.message : String(err);
		pre.textContent = `Error: ${message}`;
		outputEl.appendChild(pre);
	} finally {
		runBtn.disabled = false;
		runBtn.textContent = "Run";
	}
}
