import { describe, expect, it } from "vitest";
import { isValidCedula, normalizeCedula } from "./cedula";

describe("normalizeCedula", () => {
  it("strips thousands dots and spaces", () => {
    expect(normalizeCedula("1.035.467.890")).toBe("1035467890");
    expect(normalizeCedula(" 71 234 567 ")).toBe("71234567");
  });
});

describe("isValidCedula", () => {
  it("accepts 6 to 10 digit documents", () => {
    expect(isValidCedula("123456")).toBe(true);
    expect(isValidCedula("1035467890")).toBe(true);
    expect(isValidCedula("1.035.467.890")).toBe(true);
  });

  it("rejects out-of-range lengths", () => {
    expect(isValidCedula("12345")).toBe(false);
    expect(isValidCedula("12345678901")).toBe(false);
    expect(isValidCedula("")).toBe(false);
  });

  it("rejects non-numeric content", () => {
    expect(isValidCedula("103546789a")).toBe(false);
    expect(isValidCedula("CC1035467")).toBe(false);
  });
});
