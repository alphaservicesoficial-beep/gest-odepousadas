import { clsx } from "clsx";
import { Building2, ChevronDown, ChevronUp, Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { NAVIGATION_ITEMS } from "../../routes/navigation";
import { getRole } from "../../lib/auth";

type SidebarProps = {
  collapsed?: boolean;
  onToggle: () => void;
  variant?: "desktop" | "mobile";
  isOpen?: boolean;
  onClose?: () => void;
};

function Sidebar({
  collapsed = false,
  onToggle,
  variant = "desktop",
  isOpen = false,
  onClose,
}: SidebarProps) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isMobileVariant = variant === "mobile";
  const effectiveCollapsed = isMobileVariant ? false : collapsed;

  const role = getRole();

  // 🔹 Regras de acesso
  const restricted = {
    admin: [] as string[],
    recepcionista: ["/financeiro"],
    camareira: [
      "/dashboard",
      "/cadastros",
      "/reservas",
      "/financeiro",
      "/admin",
    ],
  };

  const isPathRestricted = (path: string) => {
    const restrictions =
      restricted[role as keyof typeof restricted] || [];
    return restrictions.some((r) => path.startsWith(r));
  };

  const initialState = useMemo(() => {
    const state: Record<string, boolean> = {};
    NAVIGATION_ITEMS.forEach((item) => {
      const isActiveGroup =
        item.children?.some((child) =>
          location.pathname.startsWith(child.path ?? "")
        ) ?? false;
      state[item.label] = isActiveGroup;
    });
    return state;
  }, [location.pathname]);

  useEffect(() => {
    setOpenGroups(initialState);
  }, [initialState]);

  const renderNavigation = (isCollapsed: boolean) => (
    <nav
      className={clsx(
        "flex-1 pb-6 transition-colors",
        isCollapsed ? "space-y-3 px-1" : "space-y-2 px-2"
      )}
    >
      {NAVIGATION_ITEMS.map((item) => {
        const Icon = item.icon;
        const hasChildren = Boolean(item.children?.length);
        const isBlocked = isPathRestricted(item.path ?? "");

        if (!hasChildren && item.path) {
          const content = (
            <div
              className={clsx(
                "flex items-center rounded-lg text-sm font-medium transition select-none relative",
                isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2",
                isBlocked
                  ? "text-slate-500 opacity-60 cursor-not-allowed"
                  : "hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300"
              )}
              title={isBlocked ? "Acesso restrito" : undefined}
            >
              <Icon size={18} />
              {!isCollapsed && <span>{item.label}</span>}
            </div>
          );

          if (isBlocked) return <div key={item.label}>{content}</div>;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  "block",
                  isActive && !isBlocked
                    ? "bg-slate-200 text-primary dark:bg-slate-800"
                    : ""
                )
              }
              title={isCollapsed ? item.label : undefined}
              onClick={isMobileVariant ? onClose : undefined}
            >
              {content}
            </NavLink>
          );
        }

        // 🔹 Grupos com subitens
        const groupBlocked = isPathRestricted(item.path ?? "");

        return (
          <div key={item.label} className="space-y-2">
            <button
              type="button"
              disabled={groupBlocked}
              onClick={() =>
                setOpenGroups((prev) => ({
                  ...prev,
                  [item.label]: !prev[item.label],
                }))
              }
              className={clsx(
                "flex w-full items-center rounded-lg text-sm font-medium transition",
                isCollapsed
                  ? "justify-center px-0 py-3"
                  : "justify-between px-3 py-2",
                groupBlocked
                  ? "text-slate-500 opacity-60 cursor-not-allowed"
                  : "hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300"
              )}
              title={groupBlocked ? "Acesso restrito" : undefined}
            >
              <span className="flex items-center gap-3">
                <Icon size={18} />
                {!isCollapsed && <span>{item.label}</span>}
              </span>
              {!isCollapsed && (
                <>
                  {openGroups[item.label] ? (
                    <ChevronUp size={16} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-500" />
                  )}
                </>
              )}
            </button>

            {/* Subitens */}
            {openGroups[item.label] &&
              !isCollapsed &&
              !groupBlocked &&
              item.children && (
                <div className="space-y-1 pl-8">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const childBlocked = isPathRestricted(child.path ?? "");

                    const childContent = (
                      <div
                        className={clsx(
                          "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition relative",
                          childBlocked
                            ? "text-slate-500 opacity-60 cursor-not-allowed"
                            : "hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400"
                        )}
                        title={childBlocked ? "Acesso restrito" : undefined}
                      >
                        <ChildIcon size={16} />
                        <span>{child.label}</span>
                      </div>
                    );

                    if (childBlocked)
                      return <div key={child.label}>{childContent}</div>;

                    return (
                      <NavLink
                        key={child.label}
                        to={child.path ?? "#"}
                        className={({ isActive }) =>
                          clsx(
                            "block",
                            isActive && !childBlocked
                              ? "bg-slate-200 text-primary dark:bg-slate-800"
                              : ""
                          )
                        }
                        onClick={isMobileVariant ? onClose : undefined}
                      >
                        {childContent}
                      </NavLink>
                    );
                  })}
                </div>
              )}
          </div>
        );
      })}
    </nav>
  );

  if (isMobileVariant) {
    return (
      <div
        className={clsx(
          "fixed inset-0 z-50 flex lg:hidden",
          isOpen
            ? "visible opacity-100 pointer-events-auto"
            : "invisible opacity-0 pointer-events-none",
          "transition-opacity duration-200"
        )}
        aria-hidden={!isOpen}
      >
        <div
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          onClick={onClose}
          role="button"
          tabIndex={-1}
        />
        <aside className="relative flex h-full w-72 flex-col border-r border-slate-200 bg-white text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
          <div className="flex items-center justify-between px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Building2 size={22} />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Gerenciador de Pousada
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gestão Hotelaria Simplificada
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          </div>
          {renderNavigation(false)}
        </aside>
      </div>
    );
  }

  return (
    <aside
      className={clsx(
        "hidden h-full flex-col border-r border-slate-200 bg-white text-slate-700 transition-all duration-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 lg:flex",
        collapsed ? "w-20" : "w-72"
      )}
    >
      <div
        className={clsx(
          "flex items-center px-4 py-5",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Building2 size={22} />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Gerenciador de Pousada
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestão Hotelaria Simplificada
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <Menu size={18} />
        </button>
      </div>
      {renderNavigation(effectiveCollapsed)}
    </aside>
  );
}

export default Sidebar;
