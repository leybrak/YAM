import type { Photo } from "../api/types";

export function Polaroid({ photo, rotate = 0 }: { photo: Photo; rotate?: number }) {
  return (
    <figure className="polaroid inline-block" style={{ transform: `rotate(${rotate}deg)` }}>
      <img src={photo.url} alt={photo.caption ?? ""} className="w-40 h-40 object-cover" />
      {photo.caption && (
        <figcaption className="text-xs mt-2 text-center" style={{ fontFamily: "var(--font-hand)" }}>
          {photo.caption}
        </figcaption>
      )}
    </figure>
  );
}
