// File upload block handler: detect file selections, write to Pyodide FS.
// Remount-safe — uses event delegation, returns teardown.

let teardownListener: (() => void) | null = null;

interface UploadStatusElements {
	status: HTMLElement | null;
	fileList: HTMLElement | null;
}

function findStatusElements(input: HTMLInputElement): UploadStatusElements {
	// Walk up to find the upload block container, then find status/file-list within it
	const block = input.closest<HTMLElement>(".upload-block, .block-upload");
	if (!block) return { status: null, fileList: null };

	const status = block.querySelector<HTMLElement>(".upload-block-status");
	const fileList = block.querySelector<HTMLElement>(".upload-file-list");

	return { status, fileList };
}

function setStatus(
	elements: UploadStatusElements,
	text: string,
	isError = false,
): void {
	if (elements.status) {
		elements.status.textContent = text;
		if (isError) {
			elements.status.classList.add("upload-error");
		} else {
			elements.status.classList.remove("upload-error");
		}
	}
}

function clearFileList(elements: UploadStatusElements): void {
	if (!elements.fileList) return;
	elements.fileList.textContent = "";
}

async function loadPyodideRuntime(): Promise<unknown | null> {
	// Check for global Pyodide (loaded by the execution module)
	const g = globalThis as Record<string, unknown>;
	if (typeof g.loadPyodide === "function") {
		return g.loadPyodide;
	}
	// Check for already-loaded Pyodide instance
	if (g.pyodide) {
		return g.pyodide;
	}
	return null;
}

async function handleFileSelection(event: Event): Promise<void> {
	const input = event.target;
	if (!(input instanceof HTMLInputElement)) return;
	if (input.type !== "file") return;

	// Must be inside an upload block
	const block = input.closest(".upload-block, .block-upload, [data-upload-id]");
	if (!block) return;

	const files = Array.from(input.files ?? []);
	if (files.length === 0) return;

	const elements = findStatusElements(input);
	clearFileList(elements);

	// Try Pyodide
	const pyodide = await loadPyodideRuntime();
	if (pyodide) {
		setStatus(elements, "Loading Python...");
		try {
			type PyodideFS = {
				writeFile(name: string, bytes: Uint8Array): void;
			};
			const py = pyodide as { FS: PyodideFS };
			const loaded: string[] = [];
			for (const file of files) {
				const buf = await file.arrayBuffer();
				const bytes = new Uint8Array(buf);
				py.FS.writeFile(file.name, bytes);
				loaded.push(file.name);
			}

			const message =
				loaded.length === 1
					? `Loaded: ${loaded[0]}`
					: `${loaded.length} files loaded`;

			setStatus(elements, message);

			// Show file tags
			if (elements.fileList) {
				for (const name of loaded) {
					const tag = document.createElement("span");
					tag.className = "upload-file-tag";
					tag.textContent = name;
					elements.fileList.append(tag);
				}
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Unknown error";
			setStatus(elements, `Error: ${msg}`, true);
		}
	} else {
		// No Pyodide — show file names in status
		const names = files.map((f) => f.name).join(", ");
		if (files.length === 1) {
			setStatus(elements, `Selected: ${names}`);
		} else {
			setStatus(elements, `${files.length} files selected: ${names}`);
		}

		if (elements.fileList) {
			for (const file of files) {
				const tag = document.createElement("span");
				tag.className = "upload-file-tag";
				tag.textContent = file.name;
				elements.fileList.append(tag);
			}
		}
	}
}

function handleChange(event: Event): void {
	const input = event.target;
	if (
		input instanceof HTMLInputElement &&
		input.type === "file" &&
		input.closest(".upload-block, .block-upload, [data-upload-id]")
	) {
		void handleFileSelection(event);
	}
}

export function initUploadBlocks(root: ParentNode = document): () => void {
	if (typeof document === "undefined") return () => {};

	root.addEventListener("change", handleChange);

	teardownListener = () => {
		root.removeEventListener("change", handleChange);
	};

	return teardownListener;
}
