import { describe, expect, it } from "vitest";
import {
  cleanRut,
  formatRutDisplay,
  isValidRut,
  normalizeRut,
  validateRutField,
} from "./formatRut";

describe("formatRut", () => {
  it("cleanRut removes formatting characters", () => {
    expect(cleanRut("12.345.678-5")).toBe("123456785");
  });

  it("isValidRut accepts a valid Chilean RUT", () => {
    expect(isValidRut("12.345.678-5")).toBe(true);
  });

  it("isValidRut rejects invalid check digit", () => {
    expect(isValidRut("12.345.678-0")).toBe(false);
  });

  it("normalizeRut formats body with dots", () => {
    expect(normalizeRut("123456785")).toBe("12.345.678-5");
  });

  it("validateRutField returns error for empty value", () => {
    expect(validateRutField("")).toBe("El RUT es obligatorio");
  });

  it("validateRutField returns null for valid RUT", () => {
    expect(validateRutField("12.345.678-5")).toBeNull();
  });

  it("formatRutDisplay uses non-breaking hyphen", () => {
    expect(formatRutDisplay("12.345.678-5")).toContain("\u2011");
  });
});
