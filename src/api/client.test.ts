import { beforeEach, describe, expect, it } from "vitest";
import { apiUrl, getAuthHeaders, getJsonAuthHeaders } from "./client";

describe("api client", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("apiUrl keeps leading slash on relative paths", () => {
    expect(apiUrl("/auth/login")).toBe("/auth/login");
  });

  it("apiUrl normalizes paths without slash", () => {
    expect(apiUrl("students")).toBe("/students");
  });

  it("getAuthHeaders throws when token is missing", () => {
    expect(() => getAuthHeaders()).toThrow("No hay token de autenticación");
  });

  it("getAuthHeaders returns bearer token headers", () => {
    localStorage.setItem("token", "jwt-demo");
    expect(getAuthHeaders()).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer jwt-demo",
    });
    expect(getJsonAuthHeaders()).toEqual(getAuthHeaders());
  });
});
