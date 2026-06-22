import { createAdminUser, type PortalRole } from "../api/adminUsers";

export interface PortalAccessInput {
  enabled: boolean;
  username: string;
  password: string;
  passwordConfirm: string;
  email: string;
  role: PortalRole;
  existingUserId?: number | null;
}

export function suggestPortalUsername(email: string, rut?: string): string {
  const localPart = email.split("@")[0]?.replace(/[^a-zA-Z0-9._-]/g, "") ?? "";
  if (localPart.length >= 3) {
    return localPart.toLowerCase();
  }
  const rutDigits = (rut ?? "").replace(/[^0-9kK]/g, "").slice(0, 8);
  if (rutDigits) {
    return `user${rutDigits}`.toLowerCase();
  }
  return "";
}

export function validatePortalAccess(input: PortalAccessInput): string | null {
  if (input.existingUserId) {
    return null;
  }
  if (!input.enabled) {
    return null;
  }
  if (!input.username.trim()) {
    return "El usuario de acceso es obligatorio";
  }
  if (input.username.trim().length < 3) {
    return "El usuario debe tener al menos 3 caracteres";
  }
  if (!input.password) {
    return "La contraseña inicial es obligatoria";
  }
  if (input.password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres";
  }
  if (input.password !== input.passwordConfirm) {
    return "Las contraseñas no coinciden";
  }
  if (!input.email.trim()) {
    return "El email es obligatorio para crear la cuenta de acceso";
  }
  return null;
}

export async function provisionPortalAccess(input: PortalAccessInput): Promise<number | undefined> {
  if (input.existingUserId) {
    return input.existingUserId;
  }
  const validationError = validatePortalAccess(input);
  if (validationError) {
    throw new Error(validationError);
  }
  if (!input.enabled) {
    return undefined;
  }
  const created = await createAdminUser({
    username: input.username.trim(),
    email: input.email.trim(),
    password: input.password,
    role: input.role,
  });
  return created.id;
}

export const initialPortalAccessState = {
  enabled: false,
  username: "",
  password: "",
  passwordConfirm: "",
};
