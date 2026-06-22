import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Login from "./Login";
import { AuthProvider } from "./auth/AuthContext";
import { login } from "./api/auth";

vi.mock("./api/auth", () => ({
  login: vi.fn(),
}));

function renderLogin() {
  return render(
    <AuthProvider>
      <Login />
    </AuthProvider>,
  );
}

describe("Login", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(login).mockReset();
  });

  it("renders login form", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("Ingresa tu usuario")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ingresa tu contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeInTheDocument();
  });

  it("shows validation error when fields are empty", async () => {
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(await screen.findByText(/usuario y contraseña/i)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("calls login API with credentials", async () => {
    vi.mocked(login).mockResolvedValue({
      accessToken: "demo-token",
      userId: 1,
      username: "prof_castillo",
      email: "prof@colegio.cl",
      roles: ["DOCENTE"],
    });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("Ingresa tu usuario"), {
      target: { value: "prof_castillo" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ingresa tu contraseña"), {
      target: { value: "test1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("prof_castillo", "test1234");
    });
    expect(JSON.parse(localStorage.getItem("userProfile") ?? "{}").username).toBe("prof_castillo");
  });

  it("shows API error message on failed login", async () => {
    vi.mocked(login).mockRejectedValue(new Error("Credenciales incorrectas"));

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("Ingresa tu usuario"), {
      target: { value: "bad_user" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ingresa tu contraseña"), {
      target: { value: "bad_pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByText(/Credenciales incorrectas/)).toBeInTheDocument();
  });
});
