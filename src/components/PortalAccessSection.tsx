import type { ModuleTheme } from "../theme/moduleThemes";
import type { PortalRole } from "../api/adminUsers";
import { FormField, formInputClass } from "./FormModal";
import { suggestPortalUsername } from "../utils/provisionPortalAccess";

export interface PortalAccessFormState {
  enabled: boolean;
  username: string;
  password: string;
  passwordConfirm: string;
}

interface PortalAccessSectionProps {
  theme: ModuleTheme;
  role: PortalRole;
  roleLabel: string;
  email: string;
  rut?: string;
  existingUserId?: number | null;
  value: PortalAccessFormState;
  onChange: (value: PortalAccessFormState) => void;
}

export default function PortalAccessSection({
  theme,
  role,
  roleLabel,
  email,
  rut,
  existingUserId,
  value,
  onChange,
}: PortalAccessSectionProps) {
  const inputClass = formInputClass(theme);

  const handleEnabledChange = (enabled: boolean) => {
    const next = { ...value, enabled };
    if (enabled && !value.username.trim()) {
      const suggested = suggestPortalUsername(email, rut);
      if (suggested) {
        next.username = suggested;
      }
    }
    onChange(next);
  };

  if (existingUserId) {
    return (
      <div className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <p className="font-semibold">Cuenta de acceso vinculada</p>
        <p className="mt-1 text-emerald-700">
          Esta persona ya puede ingresar al panel de {roleLabel.toLowerCase()} (ID cuenta: {existingUserId}).
        </p>
      </div>
    );
  }

  return (
    <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => handleEnabledChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span>
          <span className="block text-sm font-semibold text-slate-800">
            Crear acceso al portal ({roleLabel})
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            Genera usuario y contraseña para que ingrese a su panel. El rol asignado será {role}.
          </span>
        </span>
      </label>

      {value.enabled && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Usuario de acceso" required hint="Mínimo 3 caracteres">
            <input
              type="text"
              value={value.username}
              onChange={(e) => onChange({ ...value, username: e.target.value })}
              placeholder="ej. jperez"
              className={inputClass}
              autoComplete="off"
            />
          </FormField>
          <FormField label="Email de la cuenta" required hint="Debe coincidir con el email de la ficha">
            <input type="email" value={email} readOnly className={`${inputClass} bg-slate-100`} />
          </FormField>
          <FormField label="Contraseña inicial" required hint="Mínimo 8 caracteres">
            <input
              type="password"
              value={value.password}
              onChange={(e) => onChange({ ...value, password: e.target.value })}
              className={inputClass}
              autoComplete="new-password"
            />
          </FormField>
          <FormField label="Confirmar contraseña" required>
            <input
              type="password"
              value={value.passwordConfirm}
              onChange={(e) => onChange({ ...value, passwordConfirm: e.target.value })}
              className={inputClass}
              autoComplete="new-password"
            />
          </FormField>
        </div>
      )}
    </div>
  );
}
