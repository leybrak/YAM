type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const POSITION: Record<Corner, React.CSSProperties> = {
  "top-left": { top: -10, left: -14 },
  "top-right": { top: -10, right: -14 },
  "bottom-left": { bottom: -10, left: -14 },
  "bottom-right": { bottom: -10, right: -14 },
};

/** A translucent strip of masking tape stuck at a corner, purely decorative. */
export function WashiTape({ corner = "top-left", rotate }: { corner?: Corner; rotate?: number }) {
  const defaultRotate = corner.includes("left") ? -8 : 8;
  return (
    <div
      className="washi-tape"
      style={{ ...POSITION[corner], transform: `rotate(${rotate ?? defaultRotate}deg)` }}
    />
  );
}
