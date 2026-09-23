import { useState } from "react";
import { openCapsule } from "../api/endpoints";
import type { Capsule } from "../api/types";
import { CountdownTimer } from "./CountdownTimer";
import { Envelope } from "./Envelope";

export function SealedCapsule({
  capsule,
  onOpened,
}: {
  capsule: Capsule;
  onOpened: (updated: Capsule) => void;
}) {
  const [broken, setBroken] = useState(!!capsule.opened_at);

  if (broken) {
    return (
      <div className="polaroid">
        <p className="font-semibold mb-1" style={{ fontFamily: "var(--font-hand)" }}>
          {capsule.title}
        </p>
        <p className="text-xs mb-2" style={{ color: "var(--color-ink-soft)" }}>
          Se abrió el {new Date(capsule.unlock_date).toLocaleDateString("es-AR")}
        </p>
        {capsule.content_text && <p>{capsule.content_text}</p>}
        {capsule.photo_url && <img src={capsule.photo_url} className="mt-2 rounded max-w-full" />}
      </div>
    );
  }

  return (
    <div className="polaroid flex flex-col items-center gap-4 py-6">
      <p className="font-semibold" style={{ fontFamily: "var(--font-hand)" }}>
        {capsule.title}
      </p>
      <Envelope
        canBreak={capsule.is_open}
        countdown={<CountdownTimer unlockDate={capsule.unlock_date} />}
        onBreak={async () => {
          setBroken(true);
          onOpened(await openCapsule(capsule.id));
        }}
      />
    </div>
  );
}
