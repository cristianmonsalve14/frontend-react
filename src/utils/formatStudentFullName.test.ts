import { describe, expect, it } from "vitest";
import { formatStudentFirstNames, formatStudentFullName } from "./formatStudentFullName";

describe("formatStudentFullName", () => {
  const student = {
    firstName: "Juan",
    secondName: "Carlos",
    lastName: "Pérez",
    motherLastName: "González",
  };

  it("joins all name parts", () => {
    expect(formatStudentFullName(student)).toBe("Juan Carlos Pérez González");
  });

  it("omits empty optional names", () => {
    expect(
      formatStudentFullName({
        ...student,
        secondName: "",
        motherLastName: "",
      }),
    ).toBe("Juan Pérez");
  });

  it("formats first names only", () => {
    expect(formatStudentFirstNames(student)).toBe("Juan Carlos");
  });
});
