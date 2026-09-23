import { useRef, useState } from "react";

const MAX_SECONDS = 30;

export function VoiceRecorder({ onRecorded }: { onRecorded: (blob: Blob, seconds: number) => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  function stopRecording() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const elapsed = (Date.now() - startedAtRef.current) / 1000;
        if (blob.size > 0) onRecorded(blob, elapsed);
      };
      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          if (next >= MAX_SECONDS) stopRecording();
          return next;
        });
      }, 1000);
    } catch {
      setError("No se pudo acceder al micrófono");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={recording ? stopRecording : startRecording}
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shrink-0"
        style={{ background: recording ? "#8a3c26" : "var(--color-accent)" }}
        aria-label={recording ? "Detener grabación" : "Grabar nota de voz"}
      >
        {recording ? "■" : "🎤"}
      </button>
      {recording && (
        <span className="text-sm animate-pulse" style={{ color: "var(--color-ink-soft)" }}>
          Grabando... {seconds}s / {MAX_SECONDS}s
        </span>
      )}
      {!recording && !error && (
        <span className="text-xs" style={{ color: "var(--color-ink-soft)" }}>
          Nota de voz (hasta 30s)
        </span>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
