import React from "react";

import { MAIN_CONTENT_SELECTOR } from "../client/navigation.ts";

export interface MainContentProps {
  html: string;
}

export function MainContent(props: MainContentProps): React.JSX.Element {
  return (
    <main
      id={MAIN_CONTENT_SELECTOR.slice(1)}
      className="readrun-main"
      dangerouslySetInnerHTML={{ __html: props.html }}
    />
  );
}
