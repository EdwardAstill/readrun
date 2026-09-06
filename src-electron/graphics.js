export function configureDesktopGraphics(app, platform = process.platform, environment = process.env) {
	if (platform !== "linux") return;
	const ozonePlatform = app.commandLine.getSwitchValue("ozone-platform");
	const usesWayland = ozonePlatform === "wayland" ||
		((!ozonePlatform || ozonePlatform === "auto") &&
			Boolean(environment.WAYLAND_DISPLAY || environment.XDG_SESSION_TYPE === "wayland"));
	if (usesWayland) {
		// Native Wayland can fail to present even after loadURL succeeds. Prefer
		// XWayland when available, unless the caller explicitly selected Wayland.
		if (environment.DISPLAY && (!ozonePlatform || ozonePlatform === "auto")) {
			app.commandLine.appendSwitch("ozone-platform", "x11");
		}
		// The GPU process can also crash under XWayland on affected drivers.
		app.disableHardwareAcceleration();
	}
}
