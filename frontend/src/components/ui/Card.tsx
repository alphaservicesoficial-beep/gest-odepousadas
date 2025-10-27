import { ReactNode } from "react";
import { clsx } from "clsx";

type CardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
};

export function Card({
  title,
  description,
  children,
  className,
  headerAction,
}: CardProps) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200",
        className,
      )}
    >
      {(title || description || headerAction) && (
        <header className="mb-4 flex items-center justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {title}
              </h2>
            )}
            {description && <p className="text-sm text-muted">{description}</p>}
          </div>
          {headerAction}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}

export default Card;
