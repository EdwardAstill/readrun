import React from "react";

export interface PdfViewerProps {
  src: string;
  title?: string;
}

export function PdfViewer(props: PdfViewerProps): React.JSX.Element {
  return (
    <div className="viewer viewer-pdf">
      <iframe title={props.title ?? "PDF document"} src={props.src} />
    </div>
  );
}
