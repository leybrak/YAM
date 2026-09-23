import type { ReactNode } from "react";
import { WashiTape } from "./WashiTape";

/** A torn notebook-paper sheet (ruled lines, punched spiral holes, inset
 * vignette) with a couple of washi-tape corners — the "note" surface used
 * for blind-drop comments instead of a flat card. */
export function ScrapbookPaper({
  children,
  className = "",
  tape = true,
}: {
  children: ReactNode;
  className?: string;
  tape?: boolean;
}) {
  return (
    <div className={`scrapbook-paper relative ${className}`}>
      {tape && (
        <>
          <WashiTape corner="top-left" />
          <WashiTape corner="bottom-right" />
        </>
      )}
      {children}
    </div>
  );
}
