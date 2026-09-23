import { useRef } from "react";
import { gsap } from "gsap";
import type { Photo, StickerType } from "../api/types";

const STICKER_EMOJI: Record<StickerType, string> = {
  heart: "❤️",
  coffee: "☕",
  star: "⭐",
  ticket: "🎫",
};

/** Deterministic pseudo-random rotation in [-range, range] derived from the
 * photo id, so it stays the same across re-renders instead of flickering. */
function organicRotation(seed: string, range = 2.5) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const normalized = (Math.abs(hash) % 1000) / 1000;
  return normalized * range * 2 - range;
}

export function Polaroid({
  photo,
  rotate,
  captionFallback,
  armedSticker,
  onPlaceSticker,
  onRemoveSticker,
}: {
  photo: Photo;
  rotate?: number;
  /** Shown in handwriting under the photo when it has no own caption. */
  captionFallback?: string;
  armedSticker?: StickerType | null;
  onPlaceSticker?: (xPercent: number, yPercent: number) => void;
  onRemoveSticker?: (stickerId: string) => void;
}) {
  const rotation = rotate ?? organicRotation(photo.id);
  const heartRef = useRef<HTMLSpanElement>(null);

  function handleDoubleClick() {
    if (!heartRef.current) return;
    gsap.fromTo(
      heartRef.current,
      { scale: 0.6, opacity: 1 },
      { scale: 1.4, opacity: 0, duration: 0.7, ease: "power1.out" }
    );
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!armedSticker || !onPlaceSticker) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onPlaceSticker(Math.min(96, Math.max(4, x)), Math.min(96, Math.max(4, y)));
  }

  return (
    <figure className="polaroid inline-block" style={{ transform: `rotate(${rotation}deg)` }}>
      <div
        className="relative w-40 h-40"
        style={{ cursor: armedSticker ? "crosshair" : "default" }}
        onClick={handleImageClick}
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={photo.url}
          alt={photo.caption ?? ""}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {photo.stickers.map((s) => (
          <span
            key={s.id}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveSticker?.(s.id);
            }}
            className="absolute text-2xl -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
              cursor: onRemoveSticker ? "pointer" : "default",
            }}
          >
            {STICKER_EMOJI[s.sticker_type as StickerType] ?? "❤️"}
          </span>
        ))}
        <span
          ref={heartRef}
          className="absolute inset-0 flex items-center justify-center text-6xl pointer-events-none"
          style={{ opacity: 0 }}
        >
          ❤️
        </span>
      </div>
      {(photo.caption || captionFallback) && (
        <figcaption className="text-xs mt-2 text-center" style={{ fontFamily: "var(--font-hand)" }}>
          {photo.caption ?? captionFallback}
        </figcaption>
      )}
    </figure>
  );
}
