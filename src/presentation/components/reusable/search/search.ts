// Adapted from edcn's nested search data model.
/** IDs must be unique across the tree. An explicit children array denotes a container. */
export interface SearchItem<T = unknown> {
  id: string;
  label: string;
  description?: string;
  children?: SearchItem<T>[];
  content?: string;
  data?: T;
}

export interface SearchEntry<T = unknown> {
  item: SearchItem<T>;
  ancestors: SearchItem<T>[];
  path: string;
  depth: number;
}

export function indexItems<T>(items: SearchItem<T>[]): SearchEntry<T>[] {
  const entries: SearchEntry<T>[] = [];
  const ids = new Set<string>();
  function visit(nodes: SearchItem<T>[], ancestors: SearchItem<T>[]) {
    for (const item of nodes) {
      if (ids.has(item.id)) throw new Error(`Duplicate search item ID: ${item.id}`);
      ids.add(item.id);
      entries.push({ item, ancestors, path: [...ancestors, item].map((node) => node.label).join("/"), depth: ancestors.length });
      if (item.children) visit(item.children, [...ancestors, item]);
    }
  }
  visit(items, []);
  return entries;
}

/** Case-insensitive subsequence matching, preserving source order. */
export function fuzzyMatch(value: string, query: string): boolean {
  const text = value.toLowerCase();
  let position = 0;
  for (const character of query.toLowerCase()) {
    const found = text.indexOf(character, position);
    if (found < 0) return false;
    position = found + 1;
  }
  return true;
}

export function projectSearch<T>(entries: SearchEntry<T>[], query: string, expanded: ReadonlySet<string>) {
  const term = query.trim();
  if (!term) return {
    visible: entries.filter((entry) => entry.ancestors.every((ancestor) => expanded.has(ancestor.id))),
    included: new Set(entries.map((entry) => entry.item.id)),
    matches: new Set<string>(),
  };
  const pathMatches = entries.filter((entry) => fuzzyMatch(entry.path, term));
  const nameMatches = pathMatches.filter((entry) => fuzzyMatch(entry.item.label, term));
  const matches = new Set((nameMatches.length ? nameMatches : pathMatches).map((entry) => entry.item.id));
  const included = new Set<string>();
  for (const entry of pathMatches) {
    included.add(entry.item.id);
    for (const ancestor of entry.ancestors) included.add(ancestor.id);
  }
  return { visible: entries.filter((entry) => included.has(entry.item.id)), included, matches };
}

export function millerColumns<T>(items: SearchItem<T>[], selected: SearchEntry<T> | undefined, included: ReadonlySet<string>) {
  const parent = selected?.ancestors.at(-1);
  const grandparent = selected?.ancestors.at(-2);
  const columns = [
    { label: parent ? (grandparent?.label ?? "All items") : "Parent", items: parent ? (grandparent?.children ?? items) : [] },
    { label: parent?.label ?? "All items", items: parent?.children ?? items },
    { label: selected?.item.label ?? "Contents", items: selected?.item.children ?? [] },
  ];
  return columns.map((column) => ({ ...column, items: column.items.filter((item) => included.has(item.id)) }));
}
