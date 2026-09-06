export function enableWheelZoom(contents) {
	contents.on("zoom-changed", (_event, direction) => {
		if (direction !== "in" && direction !== "out") return;
		const factor = contents.getZoomFactor() * (direction === "in" ? 1.2 : 1 / 1.2);
		contents.setZoomFactor(Math.max(0.5, Math.min(3, factor)));
	});
}
