import { Menu, Moon, Sun, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";

import { useTheme } from "../../providers/ThemeProvider";
import { findNavigationLabel } from "../../routes/navigation";
import { getUser } from "../../lib/auth";
 // ✅ Função pra pegar nome e papel do usuário logado

type TopbarProps = {
  onOpenMobileSidebar: () => void;
};

function Topbar({ onOpenMobileSidebar }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const currentTitle = useMemo(
    () => findNavigationLabel(location.pathname) ?? "Dashboard",
    [location.pathname]
  );

  // 👤 Obter usuário logado
  const user = getUser(); // Retorna algo tipo { name: "Paula Camareira", role: "camareira" }
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // 🚪 Função de logout
 // 🚪 Função de logout corrigida
const handleLogout = () => {
  // Remove qualquer dado salvo sobre o usuário
  localStorage.removeItem("user");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userName");

  // (opcional) Limpa também sessionStorage se estiver sendo usado
  sessionStorage.clear();

  // Redireciona para a tela de login
  navigate("/login", { replace: true });
};

  // Texto do cargo formatado
  const roleText =
    user?.role === "admin"
      ? "Administrador"
      : user?.role === "recepcionista"
      ? "Recepcionista"
      : user?.role === "camareira"
      ? "Camareira"
      : "Usuário";

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 text-slate-800 transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:px-6 sm:py-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {currentTitle}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Botão de tema */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-200"
        >
          {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
          <span className="hidden sm:inline">
            {theme === "dark" ? "Tema escuro" : "Tema claro"}
          </span>
        </button>

        {/* Usuário */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary dark:bg-primary/30">
            <span className="text-sm font-semibold">{initials || "US"}</span>
          </div>
          <div className="hidden text-right text-sm text-slate-600 dark:text-slate-300 sm:block">
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {user?.name || "Usuário Demo"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {roleText}
            </p>
          </div>

          {/* Botão de logout */}
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-red-500 hover:text-red-500 dark:border-slate-800 dark:text-slate-300"
            aria-label="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
