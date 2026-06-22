import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { AuthResponse, UserProfile } from "../api/auth";
import {
  type AppRole,
  type ModuleKey,
  canAccessModule,
  canCreateInModule,
  canDeleteInModule,
  canEditInModule,
  dashboardTitle,
  isAdmin,
  isAdminReadOnlyModule,
  isGuardian,
  isStudent,
  isTeacher,
  normalizeRoles,
} from "./permissions";

interface AuthContextValue {
  user: UserProfile | null;
  roles: AppRole[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isGuardian: boolean;
  isStudent: boolean;
  dashboardTitle: string;
  setSession: (profile: UserProfile) => void;
  clearSession: () => void;
  canAccessModule: (module: ModuleKey) => boolean;
  canCreate: (module: ModuleKey) => boolean;
  canEdit: (module: ModuleKey) => boolean;
  canDelete: (module: ModuleKey) => boolean;
  isReadOnlyModule: (module: ModuleKey) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_STORAGE_KEY = "userProfile";

function readStoredProfile(): UserProfile | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

function profileFromAuthResponse(data: AuthResponse): UserProfile {
  return {
    userId: data.userId,
    username: data.username,
    email: data.email,
    roles: Array.isArray(data.roles) ? data.roles : data.roles ? Array.from(data.roles) : [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      return null;
    }
    return readStoredProfile();
  });

  const roles = useMemo(() => normalizeRoles(user?.roles), [user]);

  const setSession = useCallback((profile: UserProfile) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    setUser(profile);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    roles,
    isAuthenticated: Boolean(user && localStorage.getItem("token")),
    isAdmin: isAdmin(roles),
    isTeacher: isTeacher(roles),
    isGuardian: isGuardian(roles),
    isStudent: isStudent(roles),
    dashboardTitle: dashboardTitle(roles),
    setSession,
    clearSession,
    canAccessModule: (module) => canAccessModule(roles, module),
    canCreate: (module) => canCreateInModule(roles, module),
    canEdit: (module) => canEditInModule(roles, module),
    canDelete: (module) => canDeleteInModule(roles, module),
    isReadOnlyModule: (module) => isAdmin(roles) && isAdminReadOnlyModule(module),
  }), [user, roles, setSession, clearSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}

export function applyLoginSession(data: AuthResponse, setSession: (profile: UserProfile) => void) {
  const profile = profileFromAuthResponse(data);
  setSession(profile);
}
