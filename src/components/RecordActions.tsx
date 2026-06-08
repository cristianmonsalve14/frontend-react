import type { ReactNode } from "react";

interface RecordActionsProps {
  onView?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  compact?: boolean;
  stretch?: boolean;
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 4.5C5.5 4.5 2.2 7.9 1 10c1.2 2.1 4.5 5.5 9 5.5s7.8-3.4 9-5.5C17.8 7.9 14.5 4.5 10 4.5zm0 9.2a3.7 3.7 0 1 1 0-7.4 3.7 3.7 0 0 1 0 7.4z" />
      <circle cx="10" cy="10" r="2.2" />
    </svg>
  );
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M13.6 2.9a1.5 1.5 0 0 1 2.1 0l1.4 1.4a1.5 1.5 0 0 1 0 2.1l-9.2 9.2-3.5.8.8-3.5 9.2-9.2zM12.5 4.5 4.8 12.2l-.3 1.3 1.3-.3 7.7-7.7-1-1z" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M7 2.5A1.5 1.5 0 0 1 8.5 1h3A1.5 1.5 0 0 1 13 2.5V3h3.25a.75.75 0 0 1 0 1.5H16v10.75A2.75 2.75 0 0 1 13.25 17H6.75A2.75 2.75 0 0 1 4 14.25V4.5H3.75a.75.75 0 0 1 0-1.5H7v-.5zM5.5 4.5v9.75c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V4.5h-9zM8.25 7a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5A.75.75 0 0 1 8.25 7zm3.5 0a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5a.75.75 0 0 1 .75-.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

type ActionKind = "view" | "edit" | "delete";

const actionStyles: Record<ActionKind, string> = {
  view:
    "border-slate-200/90 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 focus:ring-slate-200",
  edit:
    "border-sky-200/90 bg-sky-50/70 text-sky-700 hover:border-sky-300 hover:bg-sky-100/80 hover:text-sky-800 focus:ring-sky-200",
  delete:
    "border-rose-200/90 bg-rose-50/60 text-rose-600 hover:border-rose-300 hover:bg-rose-100/70 hover:text-rose-700 focus:ring-rose-200",
};

function RecordActions({
  onView,
  onEdit,
  onDelete,
  compact = false,
  stretch = false,
}: RecordActionsProps) {
  const iconOnly = compact && !stretch;

  const iconSize = iconOnly ? "h-4 w-4" : compact ? "h-3.5 w-3.5 shrink-0" : "h-4 w-4 shrink-0";
  const base =
    "inline-flex items-center justify-center rounded-lg border font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1";
  const size = iconOnly
    ? "h-8 w-8 shrink-0 p-0"
    : compact
      ? stretch
        ? "flex-1 gap-1.5 px-2 py-2 text-xs"
        : "gap-1.5 px-3 py-2 text-xs"
      : "gap-1.5 px-3 py-2 text-xs";

  const containerClass = stretch
    ? "flex w-full gap-1.5"
    : iconOnly
      ? "flex items-center gap-1"
      : "flex flex-wrap justify-center gap-1.5";

  const renderButton = (
    kind: ActionKind,
    label: string,
    onClick: () => void,
    icon: ReactNode,
  ) => (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`${base} ${size} ${actionStyles[kind]} ${stretch ? "flex-1" : ""}`}
    >
      {icon}
      {!iconOnly && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );

  return (
    <div className={containerClass}>
      {onView &&
        renderButton("view", "Ver", onView, <IconEye className={iconSize} />)}
      {renderButton("edit", "Editar", onEdit, <IconPencil className={iconSize} />)}
      {renderButton("delete", "Eliminar", onDelete, <IconTrash className={iconSize} />)}
    </div>
  );
}

export default RecordActions;
