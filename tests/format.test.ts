import { describe, expect, it } from "vitest";
import { beijingDateTimeLocalToDate, toDateTimeLocalValue } from "@/lib/format";

describe("Beijing time helpers", () => {
  it("formats UTC dates as datetime-local values in Asia/Shanghai", () => {
    expect(toDateTimeLocalValue(new Date("2026-06-11T09:30:00.000Z"))).toBe("2026-06-11T17:30");
  });

  it("parses admin datetime-local input as Beijing time", () => {
    expect(beijingDateTimeLocalToDate("2026-06-11T17:30").toISOString()).toBe("2026-06-11T09:30:00.000Z");
  });
});
