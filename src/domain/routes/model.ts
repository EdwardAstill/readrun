import type { AssetRef, AssetIndex } from "../assets/model.ts";
import type { ContentProjectConfig } from "../project/model.ts";

export interface PageRoutePage {
  url: string;
  relPath: string;
  title: string;
}

export interface TagRouteTag {
  id: string;
  label: string;
  slug: string;
  pages: readonly PageRoutePage[];
}

export interface SiteRouteInput {
  config: ContentProjectConfig;
  pages: readonly PageRoutePage[];
  assets?: AssetIndex | readonly AssetRef[];
  tags?: readonly TagRouteTag[] | ReadonlyMap<string, TagRouteTag>;
  systemRoutes?: readonly SystemRoute[];
  includeSearchRoute?: boolean;
}

export interface PageRoute {
  kind: "page";
  url: string;
  page: PageRoutePage;
}

export interface TagRoute {
  kind: "tag";
  url: string;
  tag: TagRouteTag;
}

export interface SearchRoute {
  kind: "search-index";
  url: string;
}

export interface AssetRoute {
  kind: "asset";
  url: string;
  asset: AssetRef;
}

export interface SystemRoute {
  kind: "system";
  url: string;
  name: string;
  localOnly?: boolean;
}

export type SiteRoute =
  | PageRoute
  | TagRoute
  | SearchRoute
  | AssetRoute
  | SystemRoute;
