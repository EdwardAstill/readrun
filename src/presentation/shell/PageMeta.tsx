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
    <section className="page-meta" aria-label="Page metadata">
      <dl>
        {props.entries.map((entry) => (
          <div key={`${entry.label}:${entry.value}`} className="page-meta-row">
            <dt>{entry.label}</dt>
            <dd>
              {entry.href ? <a href={entry.href}>{entry.value}</a> : entry.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
