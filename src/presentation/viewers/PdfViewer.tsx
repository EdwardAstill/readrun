import React from "react";

export interface PdfViewerProps {
  src: string;
  title?: string;
  standalone?: boolean;
}

export function PdfViewer(props: PdfViewerProps): React.JSX.Element {
  return (
    <div className={`viewer viewer-pdf${props.standalone ? " viewer-pdf-page" : ""}`}>
      <iframe title={props.title ?? "PDF document"} src={props.src} />
    </div>
  );
}
