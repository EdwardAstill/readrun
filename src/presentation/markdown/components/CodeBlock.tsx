import type React from "react";

import { CodePanel, CodePanelActions } from "./CodePanel.tsx";

export interface CodeBlockProps {
  code: string;
  language?: string;
  highlightedHtml?: string;
}

export function CodeBlock(props: CodeBlockProps): React.JSX.Element {
  return (
    <CodePanel
      className="markdown-code-block"
      language={props.language ?? "code"}
      preClassName="markdown-code"
      codeClassName={props.language ? `language-${props.language}` : undefined}
      source={props.code}
      highlightedHtml={props.highlightedHtml}
      actions={<CodePanelActions canEnlarge canCopy />}
    />
  );
}
