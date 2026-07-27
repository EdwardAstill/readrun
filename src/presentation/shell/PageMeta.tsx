import React from "react";

import type { PageMetaEntry } from "../contracts.ts";

export interface PageMetaProps {
  entries: readonly PageMetaEntry[];
}

export function PageMeta(props: PageMetaProps): React.JSX.Element | null {
  if (props.entries.length === 0) {
    return null;
  }

  return (
    <section className="page-meta mt-8 border-t pt-4" aria-label="Page metadata">
      <dl className="grid gap-2">
        {props.entries.map((entry) => (
          <div
            key={`${entry.label}:${entry.value}`}
            className="page-meta-row grid grid-cols-[auto_1fr] gap-2 text-sm"
          >
            <dt className="font-medium text-muted-foreground">{entry.label}</dt>
            <dd>
              {entry.href ? (
                <a className="text-primary hover:underline" href={entry.href}>
                  {entry.value}
                </a>
              ) : (
                entry.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
