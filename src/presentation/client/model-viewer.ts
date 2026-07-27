// Client-side Three.js model viewer for STL, GLB, and GLTF blocks.
// Lazily loads Three.js + addons via import maps when a model block exists on the page.
// Remount-safe — returns a teardown function.

const THREE_CDN = "https://cdn.jsdelivr.net/npm/three@0.160.0";

interface ActiveModel {
	container: HTMLElement;
	renderer: {
		domElement: HTMLElement;
		setSize(w: number, h: number): void;
		render(s: unknown, c: unknown): void;
		dispose(): void;
	};
	scene: { dispose?(): void };
	controls: { dispose(): void; update(): void };
	rafId: number;
	resizeObserver: ResizeObserver;
}

const activeModels = new Map<HTMLElement, ActiveModel>();
let importMapInjected = false;

async function ensureThreeJsLoaded(): Promise<void> {
	if (importMapInjected) return;

	const existingImportMap = document.querySelector<HTMLScriptElement>(
		'script[type="importmap"][data-readrun-three]',
	);
	if (existingImportMap) {
		importMapInjected = true;
		return;
	}

	const importMap = document.createElement("script");
	importMap.type = "importmap";
	importMap.dataset.readrunThree = "true";
	importMap.textContent = JSON.stringify({
		imports: {
			three: `${THREE_CDN}/build/three.module.js`,
			"three/addons/": `${THREE_CDN}/examples/jsm/`,
		},
	});
	document.head.appendChild(importMap);

	// Let the browser process the import map before we import
	await new Promise<void>((resolve) => setTimeout(resolve, 0));
	importMapInjected = true;
}

async function loadModelViewer(
	container: HTMLElement,
	signal: AbortSignal,
): Promise<void> {
	const src = container.dataset.modelSrc;
	const kind = container.dataset.modelKind || "stl";
	const height = Number(container.dataset.modelHeight || 480);
	const canvas = container.querySelector<HTMLCanvasElement>(".model-canvas");
	const errorEl = container.querySelector<HTMLElement>(".model-error");

	if (!src || !canvas) return;

	try {
		await ensureThreeJsLoaded();
		if (signal.aborted || !container.isConnected) return;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const THREE: any = await import("three");
		const { OrbitControls } = await import(
			"three/addons/controls/OrbitControls.js"
		);
		if (signal.aborted || !container.isConnected) return;

		const scene = new THREE.Scene();
		const w = container.clientWidth || 800;
		const camera = new THREE.PerspectiveCamera(45, w / height, 0.1, 1000);

		const renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
		});
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(w, height);

		canvas.replaceWith(renderer.domElement);

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.update();

		scene.add(new THREE.AmbientLight(0xffffff, 0.6));
		const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
		dirLight.position.set(1, 1, 1);
		scene.add(dirLight);

		if (kind === "stl") {
			const { STLLoader } = await import("three/addons/loaders/STLLoader.js");
			if (signal.aborted || !container.isConnected) {
				renderer.dispose();
				controls.dispose();
				return;
			}
			const loader = new STLLoader();
			loader.load(
				src,
				(geometry: unknown) => {
					if (signal.aborted || !activeModels.has(container)) return;
					const material = new THREE.MeshStandardMaterial({
						color: new THREE.Color(0x888888),
						metalness: 0.2,
						roughness: 0.5,
					});
					const mesh = new THREE.Mesh(geometry, material);
					centerAndFit(mesh, camera, controls, THREE);
					scene.add(mesh);
				},
				undefined,
				() => {
					if (!signal.aborted) showError(errorEl, "Failed to load STL model");
				},
			);
		} else {
			const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
			if (signal.aborted || !container.isConnected) {
				renderer.dispose();
				controls.dispose();
				return;
			}
			const loader = new GLTFLoader();
			loader.load(
				src,
				(gltf: any) => {
					if (signal.aborted || !activeModels.has(container)) return;
					scene.add(gltf.scene);
					centerAndFit(gltf.scene, camera, controls, THREE);
				},
				undefined,
				() => {
					if (!signal.aborted) showError(errorEl, "Failed to load GLTF/GLB model");
				},
			);
		}

		const resizeObserver = new ResizeObserver(() => {
			const cw = container.clientWidth || 800;
			const ch =
				Number(container.dataset.modelHeight) ||
				container.clientHeight ||
				height;
			camera.aspect = cw / ch;
			camera.updateProjectionMatrix();
			renderer.setSize(cw, ch);
		});
		resizeObserver.observe(container);

		let _rafId = 0;
		function animate(): void {
			if (!activeModels.has(container)) return;
			controls.update();
			renderer.render(scene, camera);
			_rafId = requestAnimationFrame(animate);
		}

		const active: ActiveModel = {
			container,
			renderer,
			scene,
			controls,
			rafId: 0,
			resizeObserver,
		};
		activeModels.set(container, active);
		_rafId = requestAnimationFrame(animate);
		active.rafId = _rafId;
	} catch (err) {
		if (signal.aborted) return;
		showError(
			errorEl,
			err instanceof Error ? err.message : "Failed to initialise 3D viewer",
		);
	}
}

function centerAndFit(
	object: any,
	camera: any,
	controls: any,
	THREE: any,
): void {
	try {
		const box = new THREE.Box3().setFromObject(object);
		const center = box.getCenter(new THREE.Vector3(0, 0, 0));
		const size = box.getSize(new THREE.Vector3(0, 0, 0));
		const maxDim = Math.max(size.x, size.y, size.z);

		object.position.x -= center.x;
		object.position.y -= center.y;
		object.position.z -= center.z;

		const fov = 45 * (Math.PI / 180);
		const dist = (maxDim * 2) / Math.tan(fov / 2);
		camera.position.set(center.x, center.y + maxDim * 0.3, center.z + dist);
		controls.target.set(center.x, center.y, center.z);
		controls.update();
	} catch {
		// Best-effort centering
	}
}

function showError(el: HTMLElement | null | undefined, message: string): void {
	if (!el) return;
	el.hidden = false;
	el.textContent = message;
}

function teardownModel(container: HTMLElement): void {
	const active = activeModels.get(container);
	if (!active) return;

	cancelAnimationFrame(active.rafId);

	try {
		active.renderer.dispose();
		active.scene.dispose?.();
		active.controls.dispose();
		active.resizeObserver.disconnect();
	} catch {
		// Best-effort cleanup
	}

	activeModels.delete(container);

	// Restore placeholder canvas
	const existingCanvas = container.querySelector("canvas");
	const placeholder = container.querySelector(".model-canvas");
	if (existingCanvas && existingCanvas !== placeholder) {
		const newPlaceholder = document.createElement("canvas");
		newPlaceholder.className = "model-canvas";
		existingCanvas.replaceWith(newPlaceholder);
	}
}

export function initModelViewers(root: ParentNode = document): () => void {
	if (typeof document === "undefined") return () => {};

	const containers = Array.from(
		root.querySelectorAll<HTMLElement>(".model-viewer[data-model-src]"),
	);
	const controller = new AbortController();

	for (const container of containers) {
		if (activeModels.has(container)) continue;
		void loadModelViewer(container, controller.signal);
	}

	return () => {
		controller.abort();
		for (const container of containers) {
			teardownModel(container);
		}
	};
}
