import {
	mountClientFeatures,
	type ClientFeature,
} from "./features.ts";

export interface PageLifecycleHandle {
	teardown(): void;
}

export function mountPresentationClient(
	features: readonly ClientFeature[],
	eventTarget: EventTarget = document,
): PageLifecycleHandle {
	const featureHandle = mountClientFeatures(features);
	const remountHandler = (): void => featureHandle.remountPage();

	eventTarget.addEventListener("readrun:remount", remountHandler);

	return {
		teardown() {
			eventTarget.removeEventListener("readrun:remount", remountHandler);
			featureHandle.dispose();
		},
	};
}
