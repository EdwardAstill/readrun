import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "node:url";

import { viewerUrl } from "./viewer-url.js";
import { configureDesktopGraphics } from "./graphics.js";
import { enableWheelZoom } from "./zoom.js";
import { floatDesktopWindow } from "./floating.js";
import { editorConnection } from "./editor.js";

configureDesktopGraphics(app);

let url;
try {
	url = viewerUrl(process.env.READRUN_DESKTOP_URL);
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(2);
}

let mainWindow;
const editor = editorConnection(process.env, url.toString());
const trustedEditorEvent = (event) => event.sender === mainWindow?.webContents &&
	event.senderFrame === mainWindow.webContents.mainFrame &&
	new URL(event.senderFrame.url).origin === url.origin;
ipcMain.handle("readrun:editor-initial", (event) => trustedEditorEvent(event) ? editor?.initial ?? null : null);
ipcMain.on("readrun:editor-scroll", (event, pathname, line) => {
	if (trustedEditorEvent(event)) void editor?.scroll(pathname, line);
});

async function createWindow() {
	mainWindow = new BrowserWindow({
		title: "readrun",
		width: 1280,
		height: 800,
		minWidth: 640,
		minHeight: 480,
		frame: false,
		webPreferences: {
			preload: fileURLToPath(new URL("./preload.cjs", import.meta.url)),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
	});

	enableWheelZoom(mainWindow.webContents);
	mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
	mainWindow.webContents.on("will-navigate", (event, destination) => {
		try {
			if (new URL(destination).origin !== url.origin) {
				event.preventDefault();
			}
		} catch {
			event.preventDefault();
		}
	});
	mainWindow.on("closed", () => {
		editor?.close();
		mainWindow = undefined;
	});

	if (process.env.READRUN_DESKTOP_FLOATING === "1") {
		await floatDesktopWindow(process.pid);
	}
	await mainWindow.loadURL(url.toString());
}

app.whenReady().then(createWindow).catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	app.exit(1);
});

app.on("window-all-closed", () => {
	app.quit();
});
