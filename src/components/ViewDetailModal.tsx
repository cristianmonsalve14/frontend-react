import { useEffect } from "react";
import type { ModuleTheme } from "../theme/moduleThemes";

export type DetailField = {
  label: string;
  value?: string | number | null;
  fullWidth?: boolean;
};

interface ViewDetailModalProps {
  title: string;
  subtitle?: string;
  fields: DetailField[];
  onClose: () => void;
  theme?: ModuleTheme;
}

const FULL_WIDTH_LABELS = /descripción|dirección|observaci|comentario|nota/i;

function shouldSpanFullWidth(field: DetailField): boolean {
  if (field.fullWidth) return true;
  if (FULL_WIDTH_LABELS.test(field.label)) return true;
  const text = String(field.value ?? "");
  return text.length > 72;
}

function ViewDetailModal({ title, subtitle, fields, onClose, theme }: ViewDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const accentBar = theme?.accentBar ?? "bg-gradient-to-r from-slate-500 to-slate-600";
  const iconBg = theme?.iconBg ?? "bg-slate-100";
  const iconText = theme?.iconText ?? "text-slate-600";
  const closeBtn = theme?.primaryBtn ?? "bg-slate-700 hover:bg-slate-800 text-white shadow-sm";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-detail-title"
        className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-1 shrink-0 ${accentBar}`} />

        <div className="shrink-0 border-b border-slate-100 bg-gradient-to-br from-slate-50/80 to-white px-6 py-5">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${iconBg} ${iconText}`}
            >
              {theme?.icon ?? "📄"}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 id="view-detail-title" className="text-xl font-bold tracking-tight text-slate-800">
                {title}
              </h3>
              {subtitle ? (
                <p className="mt-1 truncate text-sm font-medium text-slate-500">{subtitle}</p>
              ) : null}
              <p className="mt-2 text-xs text-slate-400">
                {fields.length} {fields.length === 1 ? "campo" : "campos"} registrados
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
              aria-label="Cerrar"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.map((field) => {
              const spanFull = shouldSpanFullWidth(field);
              const hasValue = field.value !== undefined && field.value !== null && field.value !== "";

              return (
                <div
                  key={field.label}
                  className={`rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 transition hover:border-slate-200 hover:bg-slate-50 ${
                    spanFull ? "sm:col-span-2" : ""
                  }`}
                >
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {field.label}
                  </dt>
                  <dd
                    className={`mt-1.5 text-sm leading-relaxed break-words whitespace-pre-wrap ${
                      hasValue ? "font-medium text-slate-800" : "italic text-slate-400"
                    }`}
                  >
                    {hasValue ? field.value : "—"}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${closeBtn}`}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewDetailModal;
