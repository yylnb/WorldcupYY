import { BetPick, Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { decimalToCents, payoutFor, winningPick } from "@/lib/betting";

describe("betting helpers", () => {
  it("detects home, draw, and away winners from 90-minute scores", () => {
    expect(winningPick(2, 1)).toBe(BetPick.HOME);
    expect(winningPick(1, 1)).toBe(BetPick.DRAW);
    expect(winningPick(0, 3)).toBe(BetPick.AWAY);
  });

  it("converts decimal odds to cents", () => {
    expect(decimalToCents(new Prisma.Decimal("1.80"))).toBe(180n);
    expect(decimalToCents(new Prisma.Decimal("2.5"))).toBe(250n);
    expect(decimalToCents(new Prisma.Decimal("10"))).toBe(1000n);
  });

  it("floors payouts for virtual coin settlement", () => {
    expect(payoutFor(100n, new Prisma.Decimal("1.80"))).toBe(180n);
    expect(payoutFor(333n, new Prisma.Decimal("2.35"))).toBe(782n);
  });
});
