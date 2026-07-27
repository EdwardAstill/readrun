import React from "react";

export interface QueryBlockProps {
  query: string;
  source?: string;
}

export function QueryBlock(props: QueryBlockProps): React.JSX.Element {
  return (
    <section className="block block-query">
      <header>Query</header>
      <pre>{props.query || props.source || ""}</pre>
    </section>
  );
}
