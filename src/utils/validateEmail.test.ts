import { describe, expect, it } from "vitest";
import { isValidEmail, validateEmailField } from "./validateEmail";

describe("validateEmail", () => {
  it("accepts a standard email", () => {
    expect(isValidEmail("alumno@colegio.cl")).toBe(true);
  });

  it("rejects email without domain", () => {
    expect(isValidEmail("alumno@")).toBe(false);
  });

  it("validateEmailField requires a value", () => {
    expect(validateEmailField("")).toBe("El email es obligatorio");
  });

  it("validateEmailField returns null for valid email", () => {
    expect(validateEmailField("docente@duoc.cl")).toBeNull();
  });
});
