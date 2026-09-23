import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6">
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-hand)" }}>
        YAM
      </h1>
      <p className="max-w-md text-ink-soft" style={{ color: "var(--color-ink-soft)" }}>
        Un cuaderno compartido para dos. Cada día que viven juntos tiene una sola página —
        y lo que cada uno sintió permanece en secreto hasta que ambos lo cuentan.
      </p>
      <div className="flex gap-4">
        <Link
          to="/registro"
          className="px-6 py-2 rounded-full text-white"
          style={{ background: "var(--color-accent)" }}
        >
          Crear mi cuenta
        </Link>
        <Link
          to="/login"
          className="px-6 py-2 rounded-full border"
          style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}
        >
          Ya tengo cuenta
        </Link>
      </div>
    </div>
  );
}
