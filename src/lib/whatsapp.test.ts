import { describe, expect, it } from "vitest";
import { parseWhatsApp } from "./whatsapp";
import { isOlder, yearRange } from "./categories";

describe("parseWhatsApp", () => {
  it("reads iPhone format", () => {
    const m = parseWhatsApp("[8/10/22, 9:41:05 AM] Maya Chen: Dr. Alvarez is great\n[8/10/22, 9:42:00 AM] Jo: +1");
    expect(m).toEqual([
      { sender: "Maya Chen", date: "2022-08-10", text: "Dr. Alvarez is great" },
      { sender: "Jo", date: "2022-08-10", text: "+1" },
    ]);
  });
  it("reads Android day-first format with multiline", () => {
    const m = parseWhatsApp("25/12/2023, 14:05 - Sam: Love Primary\nfor basics");
    expect(m).toEqual([{ sender: "Sam", date: "2023-12-25", text: "Love Primary\nfor basics" }]);
  });
});

describe("board rules", () => {
  it("marks mentions over 2 years old as older", () => {
    const now = new Date("2026-11-10");
    expect(isOlder("2024-11-01", now)).toBe(true);
    expect(isOlder("2025-01-01", now)).toBe(false);
  });
  it("formats the year range", () => {
    expect(yearRange("2022-01-01", "2026-03-01")).toBe("Mentioned 2022 to 2026");
  });
});
