const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("readrunDesktop", {
	openFiles: () => ipcRenderer.send("readrun:open-files"),
	onFilesOpened: (listener) => {
		const receive = (_event, urls) => listener(urls);
		ipcRenderer.on("readrun:files-opened", receive);
		return () => ipcRenderer.removeListener("readrun:files-opened", receive);
	},
});

contextBridge.exposeInMainWorld("readrunEditor", {
	initial: () => ipcRenderer.invoke("readrun:editor-initial"),
	scroll: (pathname, line) => ipcRenderer.send("readrun:editor-scroll", pathname, line),
});
