// Mobile drawer and topbar behaviour.
// Toggles the off-canvas sidebar on narrow viewports via hamburger button.

export function initMobileDrawer(): () => void {
	if (typeof document === "undefined") {
		return () => {};
	}

	const sidebar = document.getElementById("readrun-sidebar");
	const scrim = document.getElementById("drawer-scrim");
	const menuBtn = document.getElementById("mobile-menu-btn");
	const searchBtn = document.getElementById("mobile-search-btn");

	if (!sidebar || !scrim || !menuBtn) {
		return () => {};
	}

	function openDrawer(): void {
		sidebar!.classList.add("open");
		scrim!.classList.add("open");
		menuBtn!.setAttribute("aria-expanded", "true");
	}

	function closeDrawer(): void {
		sidebar!.classList.remove("open");
		scrim!.classList.remove("open");
		menuBtn!.setAttribute("aria-expanded", "false");
	}

	// Hamburger button toggles drawer
	const onMenuClick = (): void => {
		if (sidebar!.classList.contains("open")) {
			closeDrawer();
		} else {
			openDrawer();
		}
	};

	// Scrim background closes drawer
	const onScrimClick = (): void => {
		closeDrawer();
	};

	// Any link clicked inside the sidebar closes the drawer
	const onSidebarClick = (event: Event): void => {
		const target = event.target;
		if (target instanceof Element) {
			const link = target.closest("a[href]");
			if (link) {
				closeDrawer();
			}
		}
	};

	// Close drawer on window resize above mobile breakpoint
	const onResize = (): void => {
		if (window.innerWidth > 768) {
			closeDrawer();
		}
	};

	// Open current-page search when search button clicked
	const onSearchClick = (): void => {
		document.dispatchEvent(new CustomEvent("readrun:open-page-search"));
	};

	menuBtn.addEventListener("click", onMenuClick);
	scrim.addEventListener("click", onScrimClick);
	sidebar.addEventListener("click", onSidebarClick);
	window.addEventListener("resize", onResize);
	if (searchBtn) {
		searchBtn.addEventListener("click", onSearchClick);
	}

	return () => {
		menuBtn.removeEventListener("click", onMenuClick);
		scrim.removeEventListener("click", onScrimClick);
		sidebar.removeEventListener("click", onSidebarClick);
		window.removeEventListener("resize", onResize);
		if (searchBtn) {
			searchBtn.removeEventListener("click", onSearchClick);
		}
	};
}
