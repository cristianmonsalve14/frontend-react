import { describe, expect, it } from "vitest";
import { isValidPhone, normalizePhone, validatePhoneField } from "./validatePhone";

describe("validatePhone", () => {
  it("normalizePhone strips country prefix 56", () => {
    expect(normalizePhone("+56 9 1234 5678")).toBe("912345678");
  });

  it("isValidPhone accepts 9-digit mobile", () => {
    expect(isValidPhone("912345678")).toBe(true);
  });

  it("isValidPhone rejects too short numbers", () => {
    expect(isValidPhone("12345")).toBe(false);
  });

  it("validatePhoneField requires phone when required", () => {
    expect(validatePhoneField("", true)).toBe("El teléfono es obligatorio");
  });

  it("validatePhoneField allows empty when optional", () => {
    expect(validatePhoneField("", false)).toBeNull();
  });

  it("validatePhoneField returns null for valid phone", () => {
    expect(validatePhoneField("912345678")).toBeNull();
  });
});
