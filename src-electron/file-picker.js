export function createFilePicker(window, dialog, url, token, request = fetch, cwd = process.cwd()) {
	let picking = false;
	return async () => {
		if (picking) return [];
		picking = true;
		try {
			const result = await dialog.showOpenDialog(window, {
				title: "Open files",
				defaultPath: cwd,
				properties: ["openFile", "multiSelections"],
				filters: [{ name: "Markdown and PDF", extensions: ["md", "pdf"] }],
			});
			if (result.canceled || !result.filePaths.length) return [];
			const urls = [];
			for (const filePath of result.filePaths) {
				const response = await request(new URL("/_readrun/desktop/open-file", url), {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ filePath }),
				});
				const opened = await response.json();
				if (!response.ok) throw new Error(opened.error || "Could not open this file.");
				urls.push(opened.url);
			}
			return urls;
		} finally {
			picking = false;
		}
	};
}
