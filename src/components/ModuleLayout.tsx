import type { ReactNode } from "react";
import type { ModuleTheme } from "../theme/moduleThemes";

interface ModuleLayoutProps {
  theme: ModuleTheme;
  onBack: () => void;
  createLabel: string;
  onCreate: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  viewMode?: "cards" | "table";
  onViewModeChange?: (mode: "cards" | "table") => void;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string | null;
  children: ReactNode;
  toolbarExtra?: ReactNode;
}

function ModuleLayout({
  theme,
  onBack,
  createLabel,
  onCreate,
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  viewMode,
  onViewModeChange,
  onRefresh,
  loading,
  error,
  children,
  toolbarExtra,
}: ModuleLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.pageBg} p-4 sm:p-8`}>
      <div className="max-w-7xl mx-auto space-y-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
        >
          ← Volver al inicio
        </button>

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className={`h-1 ${theme.accentBar}`} />

          <div className="p-6 sm:p-8">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${theme.iconBg} ${theme.iconText}`}
                >
                  {theme.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-800">{theme.title}</h2>
                  <p className="mt-0.5 text-sm text-slate-500">{theme.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCreate}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${theme.primaryBtn}`}
              >
                <span className="text-base leading-none">+</span>
                {createLabel}
              </button>
            </div>

            <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className={`w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:bg-white focus:ring-2 ${theme.focusRing}`}
                />
              </div>

              {toolbarExtra}

              {viewMode && onViewModeChange && (
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => onViewModeChange("cards")}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                      viewMode === "cards"
                        ? theme.toggleActive
                        : "text-slate-600 hover:bg-white hover:text-slate-800"
                    }`}
                  >
                    Tarjetas
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewModeChange("table")}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                      viewMode === "table"
                        ? theme.toggleActive
                        : "text-slate-600 hover:bg-white hover:text-slate-800"
                    }`}
                  >
                    Tabla
                  </button>
                </div>
              )}

              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={loading}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Actualizar
                </button>
              )}
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div
                  className={`h-10 w-10 animate-spin rounded-full border-2 border-slate-200 ${theme.spinner} border-t-transparent`}
                />
                <p className="mt-4 text-sm text-slate-500">Cargando información...</p>
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModuleLayout;
