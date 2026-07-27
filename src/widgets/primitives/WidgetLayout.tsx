import React from "react";

export type WidgetArrangement =
  | "visual-left"
  | "visual-right"
  | "visual-top"
  | "visual-bottom"
  | "stacked";

interface WidgetLayoutProps {
  arrangement?: WidgetArrangement;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Optional content to render in the top-right of the head (e.g., a meta line). */
  headMeta?: React.ReactNode;
  children: React.ReactNode;
}

interface SlotProps {
  children: React.ReactNode;
}

function VisualSlot({ children }: SlotProps): React.ReactElement {
  // Marker only — never rendered directly by WidgetLayoutImpl.
  // When used outside WidgetLayout, children render unwrapped.
  return <>{children}</> as React.ReactElement;
}

function ControlsSlot({ children }: SlotProps): React.ReactElement {
  return <>{children}</> as React.ReactElement;
}

function AsideSlot({ children }: SlotProps): React.ReactElement {
  return <>{children}</> as React.ReactElement;
}

(VisualSlot as { __widgetSlot?: string }).__widgetSlot = "visual";
(ControlsSlot as { __widgetSlot?: string }).__widgetSlot = "controls";
(AsideSlot as { __widgetSlot?: string }).__widgetSlot = "aside";

/** Extract named slots from children via the __widgetSlot marker. */
export function extractSlots(children: React.ReactNode): Record<string, React.ReactNode> {
  const slots: Record<string, React.ReactNode> = {};
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const t = child.type as { __widgetSlot?: string };
      if (t?.__widgetSlot) {
        slots[t.__widgetSlot] = child;
      }
    }
  });
  return slots;
}

function WidgetLayoutImpl(props: WidgetLayoutProps): React.JSX.Element {
  const arrangement = props.arrangement ?? "visual-left";
  const slots = extractSlots(props.children);

  return (
    <div className={`readrun-widget readrun-widget--${arrangement}`}>
      {(props.title || props.subtitle || props.headMeta) && (
        <div
          className="readrun-widget__head"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <div>
            {props.title && <h2 className="readrun-widget__title">{props.title}</h2>}
            {props.subtitle && (
              <div className="readrun-widget__subtitle">{props.subtitle}</div>
            )}
          </div>
          {props.headMeta && <div>{props.headMeta}</div>}
        </div>
      )}
      <div className="readrun-widget__body">
        {slots["visual"] && (
          <div className="readrun-widget__visual">
            {slots["visual"]}
          </div>
        )}
        {(slots["controls"] || slots["aside"]) && (
          <div className="readrun-widget__sidebar">
            {slots["controls"] && (
              <div className="readrun-widget__controls">{slots["controls"]}</div>
            )}
            {slots["aside"] && (
              <div className="readrun-widget__aside">
                <div className="readrun-widget__aside-label">What to notice</div>
                {slots["aside"]}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const WidgetLayout = Object.assign(WidgetLayoutImpl, {
  Visual: VisualSlot,
  Controls: ControlsSlot,
  Aside: AsideSlot,
});
