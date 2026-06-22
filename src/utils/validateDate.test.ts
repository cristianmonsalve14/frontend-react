import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  validateNotFutureDateField,
  validatePositiveIntField,
  validateWeightField,
} from "./validateDate";

describe("validateDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-20T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("validateNotFutureDateField accepts past dates", () => {
    expect(validateNotFutureDateField("2026-06-01")).toBeNull();
  });

  it("validateNotFutureDateField rejects future dates", () => {
    expect(validateNotFutureDateField("2026-12-31")).toMatch(/futura/);
  });

  it("validatePositiveIntField requires a value", () => {
    expect(validatePositiveIntField("", "Número de lista")).toMatch(/obligatorio/);
  });

  it("validatePositiveIntField enforces minimum", () => {
    expect(validatePositiveIntField("0", "Número de lista")).toMatch(/al menos 1/);
  });

  it("validatePositiveIntField enforces maximum", () => {
    expect(validatePositiveIntField("50", "Número de lista", 1, 45)).toMatch(/superar 45/);
  });

  it("validateWeightField accepts values between 0 and 100", () => {
    expect(validateWeightField("30")).toBeNull();
  });

  it("validateWeightField rejects out-of-range values", () => {
    expect(validateWeightField("150")).toMatch(/entre 0 y 100/);
  });
});
