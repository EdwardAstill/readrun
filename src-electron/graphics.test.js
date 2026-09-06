import { expect, test } from "bun:test";
import { configureDesktopGraphics } from "./graphics.js";

function usesSoftwareRendering(platform, environment, ozonePlatform = "") {
	let disabled = false;
	configureDesktopGraphics({
		commandLine: { getSwitchValue: () => ozonePlatform, appendSwitch() {} },
		disableHardwareAcceleration() { disabled = true; },
	}, platform, environment);
	return disabled;
}

test("uses software rendering for native Linux Wayland before startup", () => {
	expect(usesSoftwareRendering("linux", { WAYLAND_DISPLAY: "wayland-1" })).toBe(true);
	expect(usesSoftwareRendering("linux", { XDG_SESSION_TYPE: "wayland" }, "auto")).toBe(true);
	expect(usesSoftwareRendering("linux", {}, "wayland")).toBe(true);
});

test("uses XWayland with software rendering when available without overriding explicit platforms", () => {
	for (const [selected, environment, expected] of [
		["", { WAYLAND_DISPLAY: "wayland-1", DISPLAY: ":0" }, [["ozone-platform", "x11"]]],
		["auto", { XDG_SESSION_TYPE: "wayland", DISPLAY: ":0" }, [["ozone-platform", "x11"]]],
		["wayland", { WAYLAND_DISPLAY: "wayland-1", DISPLAY: ":0" }, []],
		["", { WAYLAND_DISPLAY: "wayland-1" }, []],
	]) {
		const switches = [];
		let disabled = false;
		configureDesktopGraphics({
			commandLine: {
				getSwitchValue: () => selected,
				appendSwitch: (...args) => switches.push(args),
			},
			disableHardwareAcceleration() { disabled = true; },
		}, "linux", environment);
		expect(switches).toEqual(expected);
		expect(disabled).toBe(true);
	}
});

test("preserves acceleration outside Wayland and for an explicit X11 override", () => {
	expect(usesSoftwareRendering("linux", { DISPLAY: ":0" })).toBe(false);
	expect(usesSoftwareRendering("linux", { WAYLAND_DISPLAY: "wayland-1" }, "x11")).toBe(false);
	expect(usesSoftwareRendering("darwin", { WAYLAND_DISPLAY: "wayland-1" })).toBe(false);
	expect(usesSoftwareRendering("win32", {})).toBe(false);
});
