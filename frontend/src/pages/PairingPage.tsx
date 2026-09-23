import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { createInvite, fetchMe, fetchMyCouple, joinCouple } from "../api/endpoints";
import { useAuthStore } from "../store/auth";
import { KeyMergeAnimation } from "../components/KeyMergeAnimation";

type Mode = "choose" | "waiting" | "joining" | "merging";

export function PairingPage() {
  const [mode, setMode] = useState<Mode>("choose");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(cardRef.current, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 });
  }, [mode]);

  useEffect(() => {
    if (mode !== "waiting") return;
    const interval = setInterval(async () => {
      try {
        const couple = await fetchMyCouple();
        if (couple.status === "linked") {
          clearInterval(interval);
          setMode("merging");
        }
      } catch {
        // still pending, keep polling
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [mode]);

  async function handleGenerateInvite() {
    setError(null);
    try {
      const { invite_code } = await createInvite();
      setInviteCode(invite_code);
      setMode("waiting");
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "No se pudo generar el código");
    }
  }

  async function handleJoin() {
    setError(null);
    try {
      await joinCouple(joinCode.trim().toUpperCase());
      setMode("merging");
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Código inválido");
    }
  }

  async function handleMergeDone() {
    const user = await fetchMe();
    setUser(user);
    navigate("/album");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div ref={cardRef} className="polaroid w-full max-w-md flex flex-col items-center gap-4 text-center">
        {mode === "choose" && (
          <>
            <h1 className="text-2xl" style={{ fontFamily: "var(--font-hand)" }}>
              El ritual de entrada
            </h1>
            <p className="text-sm" style={{ color: "var(--color-ink-soft)" }}>
              Generá tu mitad de la llave, o ingresá la que te compartieron.
            </p>
            <button
              onClick={handleGenerateInvite}
              className="px-4 py-2 rounded-full text-white w-full"
              style={{ background: "var(--color-accent)" }}
            >
              Generar mi mitad de llave
            </button>
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 h-px bg-black/10" />
              <span className="text-xs" style={{ color: "var(--color-ink-soft)" }}>
                o
              </span>
              <div className="flex-1 h-px bg-black/10" />
            </div>
            <button
              onClick={() => setMode("joining")}
              className="px-4 py-2 rounded-full border w-full"
              style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}
            >
              Tengo un código
            </button>
          </>
        )}

        {mode === "waiting" && inviteCode && (
          <>
            <h1 className="text-2xl" style={{ fontFamily: "var(--font-hand)" }}>
              Compartí este código
            </h1>
            <div
              className="text-4xl tracking-[0.3em] font-mono px-6 py-3 rounded"
              style={{ background: "var(--color-paper-dark)" }}
            >
              {inviteCode}
            </div>
            <p className="text-sm animate-pulse" style={{ color: "var(--color-ink-soft)" }}>
              Esperando a que tu persona lo ingrese...
            </p>
          </>
        )}

        {mode === "joining" && (
          <>
            <h1 className="text-2xl" style={{ fontFamily: "var(--font-hand)" }}>
              Ingresá el código
            </h1>
            <input
              className="border rounded px-3 py-2 text-center text-2xl tracking-[0.3em] font-mono uppercase w-full"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              onClick={handleJoin}
              className="px-4 py-2 rounded-full text-white w-full"
              style={{ background: "var(--color-accent)" }}
            >
              Unir las llaves
            </button>
          </>
        )}

        {mode === "merging" && (
          <>
            <h1 className="text-2xl" style={{ fontFamily: "var(--font-hand)" }}>
              Bienvenidos a su espacio
            </h1>
            <KeyMergeAnimation onDone={handleMergeDone} />
          </>
        )}

        {error && mode === "choose" && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    </div>
  );
}
