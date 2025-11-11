import {
  Bed,
  Bot,
  Building2,
  CalendarCheck,
  CalendarDays,
  LayoutDashboard,
  LineChart,
  ListChecks,
  NotebookPen,
  ReceiptText,
  Settings,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavigationItem = {
  label: string;
  path?: string;
  icon: LucideIcon;
  children?: NavigationItem[];
};

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    label: "Cadastros",
    icon: NotebookPen,
    children: [
      { label: "Hóspedes", path: "/cadastros/hospedes", icon: Users },
      { label: "Empresas", path: "/cadastros/empresas", icon: Building2 },
    ],
  },
  {
    label: "Quartos",
    icon: Bed,
    children: [
      { label: "Visão Geral", path: "/quartos/visao-geral", icon: Bed },
      { label: "Manutenção", path: "/quartos/manutencao", icon: Wrench },
    ],
  },
  {
    label: "Reservas",
    icon: CalendarCheck,
    children: [
      { label: "Lista de Reservas", path: "/reservas/lista", icon: ListChecks },
      { label: "Movimentos", path: "/reservas/movimentos", icon: CalendarCheck },
      { label: "Calendário", path: "/reservas/calendario", icon: CalendarDays },
    ],
  },
  
  {
    label: "Financeiro",
    icon: LineChart,
    children: [
      {
        label: "Dashboard Financeiro",
        path: "/financeiro/dashboard",
        icon: LineChart,
      },
      { label: "Receitas", path: "/financeiro/receitas", icon: TrendingUp },
      { label: "Despesas", path: "/financeiro/despesas", icon: ReceiptText },
    ],
  },
  {
    label: "Administração",
    icon: Settings,
    children: [
      { label: "Consultor IA", path: "/admin/consultor-ia", icon: Bot },
      { label: "Configurações", path: "/admin/configuracoes", icon: Settings },
    ],
  },
];

const normalizePath = (value: string | undefined): string => {
  if (!value) return "/";
  if (value === "/") return "/";
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

export function findNavigationLabel(pathname: string): string | undefined {
  const current = normalizePath(pathname);

  const matchesPath = (candidate?: string) => {
    const target = normalizePath(candidate);
    if (target === "/") {
      return current === "/";
    }
    return current === target || current.startsWith(`${target}/`);
  };

  const search = (items: NavigationItem[]): string | undefined => {
    for (const item of items) {
      if (item.path && matchesPath(item.path)) {
        return item.label;
      }
      if (item.children) {
        const childLabel = search(item.children);
        if (childLabel) {
          return childLabel;
        }
      }
    }
    return undefined;
  };

  return search(NAVIGATION_ITEMS);
}
