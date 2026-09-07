import { app, BrowserWindow } from "electron";

import { viewerUrl } from "./viewer-url.js";
import { configureDesktopGraphics } from "./graphics.js";
import { enableWheelZoom } from "./zoom.js";
import { floatDesktopWindow } from "./floating.js";

configureDesktopGraphics(app);

let url;
try {
	url = viewerUrl(process.env.READRUN_DESKTOP_URL);
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(2);
}

let mainWindow;

async function createWindow() {
	mainWindow = new BrowserWindow({
		title: "readrun",
		width: 1280,
		height: 800,
		minWidth: 640,
		minHeight: 480,
		frame: false,
		webPreferences: {
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
