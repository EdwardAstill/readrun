Workspace sources are installed from EdwardAstill/edcn, `registry/workspace`,
at commit `32ca32a` (2026-09-08). Imports point to readrun's component tree and
shared shadcn Tabs/cn components. The tiled and floating surfaces are used here;
the standalone demo, popout component, and working-state hook are not installed.
The unused persistence module is also omitted. Local adaptations add strict
indexed-access guards, select a surviving pane when closing one, and indicate
the focused stack. Floating content leaves a gutter so its resize handles remain
reachable beside the document frame. Tabs use explicit Tailwind data-attribute
variants.

The readrun integration lives in `../../client/workspace/`. Document frames are
mounted outside the edcn layout tree and positioned over its view slots. This
preserves browsing contexts when tabs change stacks or move between tiled and
floating surfaces, and isolates each document's existing page lifecycle.
