import React from "react";

export interface MediaViewerProps {
  src: string;
  kind?: "image" | "audio" | "video" | "file";
  alt?: string;
  title?: string;
}

export function MediaViewer(props: MediaViewerProps): React.JSX.Element {
  if (props.kind === "audio") {
    return <audio className="viewer viewer-audio" controls src={props.src} />;
  }

  if (props.kind === "video") {
    return <video className="viewer viewer-video" controls src={props.src} />;
  }

  if (props.kind === "file") {
    return (
      <p className="viewer viewer-file">
        <a href={props.src}>{props.title ?? props.src}</a>
      </p>
    );
  }

  return (
    <img
      className="viewer viewer-image"
      src={props.src}
      alt={props.alt ?? props.title ?? ""}
    />
  );
}
