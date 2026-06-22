import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { UserProfile } from "../api/auth";
import { applyLoginSession, AuthProvider, useAuth } from "./AuthContext";

function AuthProbe() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="authenticated">{auth.isAuthenticated ? "yes" : "no"}</span>
      <span data-testid="dashboard">{auth.dashboardTitle}</span>
      <span data-testid="can-students">{auth.canAccessModule("students") ? "yes" : "no"}</span>
    </div>
  );
}

describe("AuthContext", () => {
  it("throws when useAuth is used outside provider", () => {
    expect(() => render(<AuthProbe />)).toThrow("useAuth debe usarse dentro de AuthProvider");
  });

  it("starts unauthenticated without stored session", () => {
    localStorage.clear();
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    expect(screen.getByTestId("authenticated")).toHaveTextContent("no");
  });

  it("applyLoginSession stores profile and enables admin modules", async () => {
    localStorage.setItem("token", "demo-token");
    let setSessionFn: ((profile: UserProfile) => void) | undefined;

    function SessionWriter() {
      const auth = useAuth();
      setSessionFn = auth.setSession;
      return <AuthProbe />;
    }

    render(
      <AuthProvider>
        <SessionWriter />
      </AuthProvider>,
    );

    await act(async () => {
      applyLoginSession(
        {
          accessToken: "demo-token",
          userId: 1,
          username: "admin_colegio",
          email: "admin@colegio.cl",
          roles: ["ADMINISTRADOR"],
        },
        setSessionFn!,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("yes");
    });
    expect(screen.getByTestId("dashboard")).toHaveTextContent("Panel de Administración");
    expect(screen.getByTestId("can-students")).toHaveTextContent("yes");
    expect(JSON.parse(localStorage.getItem("userProfile") ?? "{}").username).toBe("admin_colegio");
  });

  it("clearSession removes token and profile", async () => {
    localStorage.setItem("token", "demo-token");
    localStorage.setItem("userProfile", JSON.stringify({ username: "demo", roles: ["DOCENTE"] }));

    function ClearButton() {
      const auth = useAuth();
      return <button onClick={auth.clearSession}>clear</button>;
    }

    render(
      <AuthProvider>
        <ClearButton />
        <AuthProbe />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "clear" }));

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("userProfile")).toBeNull();
    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("no");
    });
  });
});
