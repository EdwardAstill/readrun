"use client";

import * as React from "react";
// Adapted from edcn's nested search hook.
import { fuzzyMatch, indexItems, millerColumns, projectSearch, type SearchEntry, type SearchItem } from "./search.ts";

export type SearchMode = "files" | "miller";
export interface UseNestedSearchOptions<T = unknown> {
  items: SearchItem<T>[];
  defaultMode?: SearchMode;
  defaultSelectedId?: string;
  defaultExpandedIds?: string[];
  onSelect?: (item: SearchItem<T>) => void;
  onOpen?: (item: SearchItem<T>) => void;
}

/** Shared state and accessible prop getters; no icons, layout, or content rendering. */
export function useNestedSearch<T>({ items, defaultMode = "files", defaultSelectedId, defaultExpandedIds = [], onSelect, onOpen }: UseNestedSearchOptions<T>) {
  const entries = React.useMemo(() => indexItems(items), [items]);
  const byId = React.useMemo(() => new Map(entries.map((entry) => [entry.item.id, entry])), [entries]);
  const [mode, setMode] = React.useState(defaultMode);
  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState(defaultSelectedId);
  const [expanded, setExpanded] = React.useState(() => new Set([
    ...defaultExpandedIds,
    ...(byId.get(defaultSelectedId ?? "")?.ancestors.map((item) => item.id) ?? []),
  ]));
  // Keep the current level anchored even when its query has no matches.
  const anchor = byId.get(selectedId ?? "") ?? entries[0];
  const currentItems = anchor?.ancestors.at(-1)?.children ?? items;
  const projection = React.useMemo(() => {
    if (mode === "files") return projectSearch(entries, query, expanded);
    const currentIds = new Set(currentItems.map((item) => item.id));
    const matches = new Set(currentItems.filter((item) => fuzzyMatch(item.label, query.trim())).map((item) => item.id));
    return {
      visible: entries.filter((entry) => currentIds.has(entry.item.id) && matches.has(entry.item.id)),
      included: new Set(entries.filter((entry) => !currentIds.has(entry.item.id) || matches.has(entry.item.id)).map((entry) => entry.item.id)),
      matches: query.trim() ? matches : new Set<string>(),
    };
  }, [entries, query, expanded, mode, currentItems]);
  const candidates = projection.visible;
  const selected = candidates.find((entry) => entry.item.id === selectedId)
    ?? candidates.find((entry) => projection.matches.has(entry.item.id)) ?? candidates[0]
    ?? (mode === "miller" ? anchor : undefined);
  const columns = millerColumns(items, selected, projection.included);
  const activeColumn = 1;
  const navigation = mode === "files" ? projection.visible : (columns[activeColumn]?.items ?? []).map((item) => byId.get(item.id)!);
  const prefix = React.useId();
  const input = React.useRef<HTMLInputElement>(null);
  const rows = React.useRef(new Map<string, HTMLElement>());
  const pendingFocus = React.useRef<string | null>(null);
  const rowId = (id: string) => `${prefix}-item-${encodeURIComponent(id)}`;
  const resultsId = mode === "files" ? `${prefix}-tree` : `${prefix}-column-${activeColumn}`;
  const searching = query.trim().length > 0;

  React.useLayoutEffect(() => {
    if (pendingFocus.current) {
      rows.current.get(pendingFocus.current)?.focus();
      pendingFocus.current = null;
    }
  });

  React.useEffect(() => {
    const row = selected ? rows.current.get(selected.item.id) : undefined;
    const list = row?.closest<HTMLElement>('[role="tree"], [role="listbox"]');
    if (row && list) {
      const bounds = row.getBoundingClientRect();
      const viewport = list.getBoundingClientRect();
      if (bounds.top < viewport.top) list.scrollTop += bounds.top - viewport.top;
      else if (bounds.bottom > viewport.bottom) list.scrollTop += bounds.bottom - viewport.bottom;
    }
  }, [selected?.item.id, mode, columns.length]);

  function choose(entry: SearchEntry<T>, focus = false) {
    if (mode === "miller" && entry.ancestors.at(-1)?.id !== anchor?.ancestors.at(-1)?.id) setQuery("");
    setSelectedId(entry.item.id);
    onSelect?.(entry.item);
    if (focus) {
      if (selected?.item.id === entry.item.id) rows.current.get(entry.item.id)?.focus();
      else pendingFocus.current = entry.item.id;
    }
  }
  function toggle(id: string, open: boolean) {
    if (searching) return;
    setExpanded((previous) => {
      const next = new Set(previous);
      if (open) next.add(id); else next.delete(id);
      return next;
    });
  }
  function changeQuery(value: string) {
    setQuery(value);
    const next = projectSearch(entries, value, expanded);
    const first = mode === "miller"
      ? currentItems.filter((item) => fuzzyMatch(item.label, value.trim())).map((item) => byId.get(item.id)!)[0]
      : next.visible.find((entry) => next.matches.has(entry.item.id));
    if (first) choose(first);
  }
  function changeMode(next: SearchMode) {
    if (selected) {
      setSelectedId(selected.item.id);
      if (!searching) setExpanded((previous) => new Set([...previous, ...selected.ancestors.map((item) => item.id)]));
    }
    setMode(next);
  }
  function keyDown(event: React.KeyboardEvent, fromInput = false, entry = selected) {
    if (event.nativeEvent.isComposing || event.altKey || event.metaKey) return;
    if (!fromInput && !event.ctrlKey && event.key.length === 1) {
      event.preventDefault();
      changeQuery(query + event.key);
      input.current?.focus();
      return;
    }
    if (event.key === "Tab" && !event.ctrlKey) {
      // Shift+Tab from search leaves the widget; Escape returns to search.
      if (fromInput && event.shiftKey) return;
      const options = mode === "files" && searching
        ? navigation.filter((node) => projection.matches.has(node.item.id)) : navigation;
      if (!options.length) return;
      event.preventDefault();
      const index = navigation.findIndex((node) => node.item.id === entry?.item.id);
      const target = fromInput && options.some((node) => node.item.id === entry?.item.id)
        ? entry!
        : event.shiftKey
          ? options.findLast((node) => navigation.indexOf(node) < index) ?? options.at(-1)!
          : options.find((node) => navigation.indexOf(node) > index) ?? options[0];
      if (target) choose(target, true);
      return;
    }
    // Keep normal text editing available; horizontal navigation belongs to the rows.
    if (fromInput && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const keys = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End", "Enter", "Escape"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Escape") { changeQuery(""); input.current?.focus(); return; }
    if (!entry || (fromInput && !navigation.length)) return;
    const list = event.ctrlKey && searching ? navigation.filter((node) => projection.matches.has(node.item.id)) : navigation;
    const index = list.findIndex((node) => node.item.id === entry.item.id);
    let target: SearchEntry<T> | undefined;
    if (event.key === "ArrowDown") target = list[(index + 1) % list.length];
    if (event.key === "ArrowUp") target = list[index < 0 ? list.length - 1 : (index - 1 + list.length) % list.length];
    if (event.key === "Home") target = list[0];
    if (event.key === "End") target = list.at(-1);
    if (event.key === "ArrowLeft") {
      if (mode === "files") toggle(entry.item.id, false);
      else target = byId.get(entry.ancestors.at(-1)?.id ?? "");
    }
    if (event.key === "ArrowRight" || event.key === "Enter") {
      if (entry.item.children) {
        if (mode === "files") toggle(entry.item.id, event.key === "Enter" ? !expanded.has(entry.item.id) : true);
        else target = entry.item.children.map((item) => byId.get(item.id)!).find((node) => projection.included.has(node.item.id));
      } else if (event.key === "Enter") onOpen?.(entry.item);
    }
    if (target) choose(target, !fromInput);
  }

  function getInputProps(): React.ComponentPropsWithRef<"input"> {
    return {
      ref: input, role: "combobox", "aria-label": mode === "miller" ? "Search current column" : "Search all items",
      "aria-autocomplete": "list", "aria-haspopup": mode === "files" ? "tree" : "listbox",
      "aria-expanded": true, "aria-controls": resultsId,
      "aria-activedescendant": selected && navigation.some((entry) => entry.item.id === selected.item.id) ? rowId(selected.item.id) : undefined,
      value: query, onChange: (event) => changeQuery(event.target.value),
      onKeyDown: (event) => keyDown(event, true),
    };
  }

  function getListProps(column = 1): React.ComponentPropsWithoutRef<"div"> {
    return mode === "files"
      ? { role: "tree", id: `${prefix}-tree`, "aria-label": "Search results" }
      : { role: "listbox", id: `${prefix}-column-${column}`, "aria-label": `${["Parent", "Current", "Children"][column]}: ${columns[column]?.label ?? ""}` };
  }

  function getItemState(entry: SearchEntry<T>) {
    const isContainer = entry.item.children !== undefined;
    return {
      isContainer,
      isSelected: selected?.item.id === entry.item.id,
      isAncestor: selected?.ancestors.some((ancestor) => ancestor.id === entry.item.id) ?? false,
      isExpanded: !!(searching ? entry.item.children?.some((child) => projection.included.has(child.id)) : expanded.has(entry.item.id)),
      isMatch: searching && projection.matches.has(entry.item.id),
    };
  }

  function getItemProps<E extends HTMLElement = HTMLDivElement>(entry: SearchEntry<T>): React.HTMLAttributes<E> & React.RefAttributes<E> {
    const { item } = entry;
    const { isContainer, isSelected, isExpanded } = getItemState(entry);
    const tree = mode === "files";
    const siblings = (entry.ancestors.at(-1)?.children ?? items).filter((item) => projection.included.has(item.id));
    const position = siblings.findIndex((sibling) => sibling.id === item.id);
    return {
      id: rowId(item.id),
      ref: (node) => { if (node) rows.current.set(item.id, node); else rows.current.delete(item.id); },
      role: tree ? "treeitem" : "option", "aria-label": item.label, "aria-selected": isSelected,
      "aria-level": tree ? entry.depth + 1 : undefined,
      "aria-expanded": tree && isContainer ? isExpanded : undefined,
      "aria-setsize": siblings.length, "aria-posinset": position + 1,
      tabIndex: isSelected || (!tree && position === 0 && entry.depth !== selected?.depth) ? 0 : -1,
      onFocus: () => { if (!isSelected) choose(entry, true); },
      onClick: (event) => { event.currentTarget.focus(); if (tree && isContainer) toggle(item.id, !isExpanded); },
      onDoubleClick: () => { if (!isContainer) onOpen?.(item); },
      onKeyDown: (event) => keyDown(event, false, entry),
    };
  }

  return {
    mode, query, selected, entries, columns, searching,
    visibleEntries: projection.visible,
    matchCount: projection.matches.size,
    setMode: changeMode, setQuery: changeQuery,
    select: (id: string) => {
      const entry = byId.get(id);
      if (!entry) return;
      setExpanded((previous) => new Set([...previous, ...entry.ancestors.map((item) => item.id)]));
      choose(entry);
    },
    setExpanded: toggle,
    open: () => { if (selected && !selected.item.children) onOpen?.(selected.item); },
    focusSearch: () => input.current?.focus(),
    getInputProps, getListProps, getItemProps, getItemState,
  };
}

export type NestedSearchState<T = unknown> = ReturnType<typeof useNestedSearch<T>>;
