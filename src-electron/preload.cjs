const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("readrunDesktop", {
	openFiles: () => ipcRenderer.send("readrun:open-files"),
});

contextBridge.exposeInMainWorld("readrunEditor", {
	initial: () => ipcRenderer.invoke("readrun:editor-initial"),
	scroll: (pathname, line) => ipcRenderer.send("readrun:editor-scroll", pathname, line),
});
