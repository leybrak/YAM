import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchMe, loginUser, registerUser } from "../api/endpoints";
import { useAuthStore } from "../store/auth";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerUser(email, password, displayName);
      const { access_token } = await loginUser(email, password);
      useAuthStore.setState({ token: access_token });
      const user = await fetchMe();
      setSession(access_token, user);
      navigate("/vinculo");
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="polaroid w-full max-w-sm flex flex-col gap-3">
        <h1 className="text-2xl mb-2" style={{ fontFamily: "var(--font-hand)" }}>
          Crear cuenta
        </h1>
        <input
          className="border rounded px-3 py-2"
          placeholder="Tu nombre"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Contraseña"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          disabled={loading}
          className="px-4 py-2 rounded-full text-white mt-2"
          style={{ background: "var(--color-accent)" }}
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
        <Link to="/login" className="text-sm text-center mt-2" style={{ color: "var(--color-ink-soft)" }}>
          Ya tengo cuenta
        </Link>
      </form>
    </div>
  );
}
