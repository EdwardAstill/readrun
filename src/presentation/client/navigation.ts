export const MAIN_CONTENT_SELECTOR = "#main-content";
export const READRUN_SHELL_SELECTOR = ".readrun-shell";
export const TOC_SIDEBAR_SELECTOR = "#toc-sidebar";
export const TOC_SLOT_SELECTOR = "#toc-sidebar-slot";
export const SIDEBAR_NAV_SELECTOR = ".sidebar-nav";
export const PAGE_DATA_SELECTOR = "#readrun-files";

export interface PageSwapRequest {
  id: number;
  url: string;
  reason: "navigation" | "popstate" | "live-update";
  contentVersion?: number;
}

export interface ReadrunRemountDetail {
  reason: "navigation" | "popstate" | "live-update";
  url: string;
  contentVersion?: number;
  root: HTMLElement | null;
}

export interface ShellSwapSnapshot {
  mainContent: HTMLElement | null;
  tocSlot: HTMLElement | null;
  sidebarNav: Element | null;
  pageData: HTMLScriptElement | null;
  title: string;
}

export interface ShellNavigationOptions {
  root?: ParentNode;
  fetchPage?: (request: PageSwapRequest) => Promise<Document>;
  onRemount?: (detail: ReadrunRemountDetail) => void;
}

export interface ShellNavigationState {
  currentUrl: string;
  currentRequestId: number;
  reserveRequestId(): number;
  teardown(): void;
  navigate(url: string): Promise<boolean>;
  handlePopstate(url?: string): Promise<boolean>;
  swap(request: PageSwapRequest, nextDocument: Document): boolean;
}

export function createShellNavigation(
  options: ShellNavigationOptions = {},
): ShellNavigationState {
  let currentRequestId = 0;
  const root = options.root ?? document;
  const fetchPage = options.fetchPage ?? fetchPageDocument;
  const clickHandler = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const link = target.closest("a[href]");
    if (!(link instanceof HTMLAnchorElement)) {
      return;
    }
    if (!shouldHandleShellNavigation(event, link)) {
      return;
    }
    const href = link.getAttribute("href");
    if (!href) {
      return;
    }
    event.preventDefault();
    const url = new URL(href, window.location.href);
    void state.navigate(url.pathname + url.search + url.hash).then((ok) => {
      if (!ok) {
        window.location.href = url.href;
      }
    });
  };

  root.addEventListener("click", clickHandler);

  const state: ShellNavigationState = {
    get currentUrl() {
      return window.location.pathname;
    },
    get currentRequestId() {
      return currentRequestId;
    },
    reserveRequestId() {
      currentRequestId += 1;
      return currentRequestId;
    },
    teardown() {
      root.removeEventListener("click", clickHandler);
    },
    async navigate(url) {
      return performSwap(url, "navigation");
    },
    async handlePopstate(
      url = window.location.pathname + window.location.search + window.location.hash,
    ) {
      return performSwap(url, "popstate");
    },
    swap(request, nextDocument) {
      if (request.id < currentRequestId) {
        return false;
      }
      currentRequestId = request.id;
      const success = replaceShellRegions(readShellSwapSnapshot(nextDocument));
      if (!success) {
        return false;
      }
      if (request.reason === "navigation") {
        window.history.pushState({}, "", request.url);
      } else if (request.reason === "popstate") {
        window.history.replaceState({}, "", request.url);
      }
      dispatchReadrunRemount({
        reason: request.reason,
        url: request.url,
        contentVersion: request.contentVersion,
        root: document.querySelector(MAIN_CONTENT_SELECTOR),
      });
      options.onRemount?.({
        reason: request.reason,
        url: request.url,
        contentVersion: request.contentVersion,
        root: document.querySelector(MAIN_CONTENT_SELECTOR),
      });
      return true;
    },
  };

  async function performSwap(
    url: string,
    reason: PageSwapRequest["reason"],
  ): Promise<boolean> {
    const request: PageSwapRequest = {
      id: state.reserveRequestId(),
      url,
      reason,
    };
    try {
      const nextDocument = await fetchPage(request);
      const swapped = state.swap(request, nextDocument);
      if (swapped) {
        scrollAfterNavigation(url);
      }
      return swapped;
    } catch {
      return false;
    }
  }

  return state;
}

export function readShellSwapSnapshot(root: ParentNode): ShellSwapSnapshot {
  return {
    mainContent: root.querySelector(MAIN_CONTENT_SELECTOR),
    tocSlot: root.querySelector(TOC_SLOT_SELECTOR),
    sidebarNav: root.querySelector(SIDEBAR_NAV_SELECTOR),
    pageData: root.querySelector(PAGE_DATA_SELECTOR),
    title: root instanceof Document ? root.title : document.title,
  };
}

export function replaceShellRegions(snapshot: ShellSwapSnapshot): boolean {
  const currentMain = document.querySelector(MAIN_CONTENT_SELECTOR);
  const currentNav = document.querySelector(SIDEBAR_NAV_SELECTOR);
  const currentTocSlot = document.querySelector(TOC_SLOT_SELECTOR);
  const currentPageData = document.querySelector(PAGE_DATA_SELECTOR);

  if (!currentMain || !snapshot.mainContent) {
    return false;
  }

  currentMain.replaceWith(snapshot.mainContent);
  if (currentNav && snapshot.sidebarNav) {
    currentNav.replaceWith(snapshot.sidebarNav);
  }
  if (currentTocSlot && snapshot.tocSlot) {
    currentTocSlot.replaceWith(snapshot.tocSlot);
  } else if (currentTocSlot && !snapshot.tocSlot) {
    currentTocSlot.remove();
  } else if (!currentTocSlot && snapshot.tocSlot) {
    document.querySelector(READRUN_SHELL_SELECTOR)?.appendChild(snapshot.tocSlot);
  }
  document
    .querySelector(READRUN_SHELL_SELECTOR)
    ?.classList.toggle("readrun-shell--with-toc", !!snapshot.tocSlot);
  if (currentPageData && snapshot.pageData) {
    currentPageData.replaceWith(snapshot.pageData);
  }
  if (snapshot.title) {
    document.title = snapshot.title;
  }
  return true;
}

export function dispatchReadrunRemount(detail: ReadrunRemountDetail): void {
  document.dispatchEvent(new CustomEvent<ReadrunRemountDetail>("readrun:remount", { detail }));
}

function isExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:");
}

function shouldHandleShellNavigation(
  event: Event,
  link: HTMLAnchorElement,
): boolean {
  if (event.defaultPrevented) return false;
  const mouseEvent = event instanceof MouseEvent ? event : null;
  if (mouseEvent) {
    if (mouseEvent.button !== 0) return false;
    if (
      mouseEvent.metaKey ||
      mouseEvent.ctrlKey ||
      mouseEvent.shiftKey ||
      mouseEvent.altKey
    ) {
      return false;
    }
  }
  if (link.target && link.target !== "_self") return false;
  if (link.hasAttribute("download") || link.dataset.resourceFile !== undefined) {
    return false;
  }
  const href = link.getAttribute("href");
  if (!href || isExternalHref(href)) return false;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  if (
    url.hash &&
    normalizePath(url.pathname) === normalizePath(window.location.pathname)
  ) {
    return false;
  }
  return true;
}

async function fetchPageDocument(
  request: PageSwapRequest,
): Promise<Document> {
  const url = new URL(request.url, window.location.href);
  const response = await fetch(url.href, { headers: { Accept: "text/html" } });
  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`);
  }
  const html = await response.text();
  return new DOMParser().parseFromString(html, "text/html");
}

function normalizePath(path: string): string {
  return path.replace(/\/index\.html$/, "").replace(/\/$/, "") || "/";
}

function scrollAfterNavigation(url: string): void {
  const parsed = new URL(url, window.location.href);
  if (parsed.hash) {
    const target = document.getElementById(decodeURIComponent(parsed.hash.slice(1)));
    if (target) {
      target.scrollIntoView();
      return;
    }
  }
  window.scrollTo({ top: 0 });
}
