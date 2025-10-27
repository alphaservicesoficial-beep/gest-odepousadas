import { ReactNode } from "react";
import { clsx } from "clsx";

type KpiCardProps = {
  label: string;
  value: ReactNode;
  subtitle?: string;
  tone?: "default" | "success" | "info" | "warning" | "danger";
};

const toneClasses: Record<Required<KpiCardProps>["tone"], string> = {
  default:
    "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80",
  success: "border-emerald-500/40 bg-emerald-500/10",
  info: "border-sky-500/40 bg-sky-500/10",
  warning: "border-amber-500/40 bg-amber-500/10",
  danger: "border-rose-500/40 bg-rose-500/10",
};

export function KpiCard({
  label,
  value,
  subtitle,
  tone = "default",
}: KpiCardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border p-5 shadow-sm transition hover:shadow-lg",
        toneClasses[tone],
      )}
    >
      <p className="text-sm font-medium text-muted-strong">{label}</p>
      <div className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
        {value}
      </div>
      {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
    </div>
  );
}

export default KpiCard;
