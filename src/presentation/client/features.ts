export type ClientFeatureScope = "application" | "page";
export type ClientFeatureDisposer = () => void;

export interface ClientFeature {
	name: string;
	scope: ClientFeatureScope;
	mount(): void | ClientFeatureDisposer;
}

export interface ClientFeatureHandle {
	remountPage(): void;
	dispose(): void;
}

export function mountClientFeatures(
	features: readonly ClientFeature[],
): ClientFeatureHandle {
	const applicationFeatures = features.filter(
		(feature) => feature.scope === "application",
	);
	const pageFeatures = features.filter((feature) => feature.scope === "page");
	const disposeApplication = mountFeatureSet(applicationFeatures);
	let disposePage = mountFeatureSet(pageFeatures);
	let disposed = false;

	return {
		remountPage() {
			if (disposed) return;
			disposePage();
			disposePage = mountFeatureSet(pageFeatures);
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			disposePage();
			disposeApplication();
		},
	};
}

function mountFeatureSet(
	features: readonly ClientFeature[],
): ClientFeatureDisposer {
	const disposers: ClientFeatureDisposer[] = [];

	for (const feature of features) {
		const dispose = feature.mount();
		if (dispose) disposers.push(dispose);
	}

	let disposed = false;
	return () => {
		if (disposed) return;
		disposed = true;
		for (const dispose of disposers.reverse()) dispose();
	};
}
