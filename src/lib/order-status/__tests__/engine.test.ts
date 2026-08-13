import { describe, it, expect } from "vitest";
import {
  computeCurrentStatus,
  TRANSITIONS,
  isTerminal,
  type OrderStatusSnapshot,
} from "../engine";

// A fixed rng lets us deterministically force either branch of a
// probabilistic transition (e.g. PREPARING -> OUT_FOR_DELIVERY vs DELAYED).
const always = (value: number) => () => value;

function snapshot(overrides: Partial<OrderStatusSnapshot> = {}): OrderStatusSnapshot {
  const base = new Date("2026-01-01T00:00:00.000Z");
  return {
    status: "RECEIVED",
    statusChangedAt: base,
    nextEligibleAt: new Date(base.getTime() + TRANSITIONS.RECEIVED!.durationSeconds * 1000),
    ...overrides,
  };
}

describe("computeCurrentStatus", () => {
  it("does not advance before the next eligible time", () => {
    const s = snapshot();
    const now = new Date(s.statusChangedAt.getTime() + 1000); // well before eligible
    const result = computeCurrentStatus(s, now, always(0));
    expect(result.status).toBe("RECEIVED");
    expect(result.changed).toBe(false);
  });

  it("advances exactly one step once the eligible time has passed", () => {
    const s = snapshot();
    const now = s.nextEligibleAt;
    const result = computeCurrentStatus(s, now, always(0));
    expect(result.status).toBe("CONFIRMED");
    expect(result.changed).toBe(true);
  });

  it("catches up multiple steps in one call if nobody read the order for a while", () => {
    const s = snapshot();
    // Far enough in the future to blow past several transitions at once.
    const now = new Date(s.statusChangedAt.getTime() + 1000 * 60 * 60);
    const result = computeCurrentStatus(s, now, always(0)); // rng=0 -> takes the "happy path" branch every time
    expect(result.status).toBe("DELIVERED");
    expect(result.changed).toBe(true);
  });

  it("takes the branch transition when rng lands in that range", () => {
    const s = snapshot({
      status: "PREPARING",
      statusChangedAt: new Date("2026-01-01T00:00:00.000Z"),
      nextEligibleAt: new Date(
        new Date("2026-01-01T00:00:00.000Z").getTime() +
          TRANSITIONS.PREPARING!.durationSeconds * 1000
      ),
    });
    const now = s.nextEligibleAt;
    // rng close to 1 should land in the low-probability DELAYED branch.
    const result = computeCurrentStatus(s, now, always(0.99));
    expect(result.status).toBe("DELAYED");
  });

  it("never moves a terminal status, no matter how much time passes", () => {
    const s = snapshot({
      status: "DELIVERED",
      statusChangedAt: new Date("2026-01-01T00:00:00.000Z"),
      nextEligibleAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const now = new Date("2030-01-01T00:00:00.000Z");
    const result = computeCurrentStatus(s, now, always(0));
    expect(result.status).toBe("DELIVERED");
    expect(result.changed).toBe(false);
  });

  it("never auto-advances a cancelled order", () => {
    const s = snapshot({ status: "CANCELLED" });
    const result = computeCurrentStatus(s, new Date("2030-01-01"), always(0));
    expect(result.status).toBe("CANCELLED");
    expect(isTerminal("CANCELLED")).toBe(true);
  });

  it("treats FAILED_DELIVERY as requiring manual follow-up, not auto-retry", () => {
    expect(isTerminal("FAILED_DELIVERY")).toBe(true);
  });
});

describe("TRANSITIONS graph", () => {
  it("only defines CANCELLED as reachable manually, never automatically", () => {
    for (const [, def] of Object.entries(TRANSITIONS)) {
      if (!def.autoNext) continue;
      const reachable = def.autoNext.branches.map((b) => b.to);
      expect(reachable).not.toContain("CANCELLED");
    }
  });
});
