import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/auth";

export function NavBar() {
  const logout = useAuthStore((s) => s.logout);
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1 rounded-full text-sm ${isActive ? "text-white" : ""}`;
  const linkStyle = (isActive: boolean) => ({
    background: isActive ? "var(--color-accent)" : "transparent",
    color: isActive ? "white" : "var(--color-ink-soft)",
  });

  return (
    <nav className="flex items-center justify-between px-6 py-4 max-w-3xl mx-auto">
      <span className="text-xl" style={{ fontFamily: "var(--font-hand)" }}>
        YAM
      </span>
      <div className="flex gap-2 items-center">
        <NavLink to="/album" className={linkClass} style={({ isActive }) => linkStyle(isActive)}>
          Álbum
        </NavLink>
        <NavLink to="/capsulas" className={linkClass} style={({ isActive }) => linkStyle(isActive)}>
          Cápsulas
        </NavLink>
        <button onClick={logout} className="text-sm ml-2" style={{ color: "var(--color-ink-soft)" }}>
          Salir
        </button>
      </div>
    </nav>
  );
}
