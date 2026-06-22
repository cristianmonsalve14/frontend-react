import { useEffect, type FormEvent, type ReactNode } from "react";
import type { ModuleTheme } from "../theme/moduleThemes";

export function formInputClass(theme: ModuleTheme) {
  return `w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 ${theme.focusRing}`;
}

export const formLabelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500";

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  fullWidth?: boolean;
  children: ReactNode;
}

export function FormField({ label, required, hint, error, fullWidth, children }: FormFieldProps) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <label className={formLabelClass}>
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p> : null}
      {hint && !error ? <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{hint}</p> : null}
    </div>
  );
}

interface FormModalProps {
  title: string;
  subtitle?: string;
  theme: ModuleTheme;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  error?: string | null;
  submitting?: boolean;
  submitLabel: string;
  cancelLabel?: string;
  children: ReactNode;
  size?: "md" | "lg" | "xl" | "2xl";
  /** Contenido a ancho completo sin grid de dos columnas (listas, tablas, etc.) */
  fullWidthContent?: boolean;
}

const sizeClasses = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-5xl",
};

function FormModal({
  title,
  subtitle,
  theme,
  onClose,
  onSubmit,
  error,
  submitting = false,
  submitLabel,
  cancelLabel = "Cancelar",
  children,
  size = "lg",
  fullWidthContent = false,
}: FormModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, submitting]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      onClick={submitting ? undefined : onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
        className={`flex w-full ${sizeClasses[size]} max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-1 shrink-0 ${theme.accentBar}`} />

        <div className="shrink-0 border-b border-slate-100 bg-gradient-to-br from-slate-50/80 to-white px-6 py-5">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${theme.iconBg} ${theme.iconText}`}
            >
              {theme.icon}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 id="form-modal-title" className="text-xl font-bold tracking-tight text-slate-800">
                {title}
              </h3>
              {subtitle ? (
                <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50"
              aria-label="Cerrar"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {error ? (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3">
                <p className="text-sm font-medium text-rose-700">{error}</p>
              </div>
            ) : null}
            <div
              className={
                fullWidthContent ? "flex flex-col gap-4" : "grid grid-cols-1 gap-4 sm:grid-cols-2"
              }
            >
              {children}
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${theme.primaryBtn}`}
              >
                {submitting ? "Guardando..." : submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormModal;
