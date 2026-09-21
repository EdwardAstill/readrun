const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("readrunEditor", {
	initial: () => ipcRenderer.invoke("readrun:editor-initial"),
	scroll: (pathname, line) => ipcRenderer.send("readrun:editor-scroll", pathname, line),
});
