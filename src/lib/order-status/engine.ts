/**
 * Order status engine.
 *
 * Design note: order status is NOT advanced by a background timer or cron
 * job. Vercel's Hobby-tier cron only runs once a day, and a setTimeout
 * living inside a serverless function invocation isn't guaranteed to
 * survive between requests. Instead, status is treated as a pure function
 * of elapsed time: every read recomputes what status the order *should*
 * be at right now, given how long it's been sitting in its current state,
 * and persists that if it has changed. There is nothing to keep alive in
 * the background — the database just caches the last computed value.
 *
 * The transition graph also isn't a straight line. Most steps are
 * automatic and time-driven, a couple are probabilistic branches (an order
 * can get delayed, a delivery can fail), and cancellation is intentionally
 * left out of the automatic graph entirely — it only ever happens through
 * an explicit action, because a real system should not silently make that
 * call on a timer.
 */

export type OrderStatus =
  | "RECEIVED"
  | "CONFIRMED"
  | "PREPARING"
  | "DELAYED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED_DELIVERY";

export interface OrderStatusSnapshot {
  status: OrderStatus;
  statusChangedAt: Date;
  nextEligibleAt: Date;
}

interface Branch {
  to: OrderStatus;
  /** Cumulative probability upper bound in [0, 1), checked in array order. */
  upTo: number;
}

interface AutoNext {
  branches: Branch[];
}

interface TransitionDef {
  /** How long (in seconds) the order typically stays in this state. */
  durationSeconds: number;
  /** Automatic outgoing transitions. Absent = terminal or manual-only. */
  autoNext?: AutoNext;
}

/** A status with no `autoNext` never advances on its own. */
export const TRANSITIONS: Record<OrderStatus, TransitionDef> = {
  RECEIVED: {
    durationSeconds: 4,
    autoNext: { branches: [{ to: "CONFIRMED", upTo: 1 }] },
  },
  CONFIRMED: {
    durationSeconds: 4,
    autoNext: { branches: [{ to: "PREPARING", upTo: 1 }] },
  },
  PREPARING: {
    durationSeconds: 6,
    autoNext: {
      // 85% straight to delivery, 15% the kitchen falls behind.
      branches: [
        { to: "OUT_FOR_DELIVERY", upTo: 0.85 },
        { to: "DELAYED", upTo: 1 },
      ],
    },
  },
  DELAYED: {
    durationSeconds: 5,
    autoNext: { branches: [{ to: "PREPARING", upTo: 1 }] },
  },
  OUT_FOR_DELIVERY: {
    durationSeconds: 8,
    autoNext: {
      // 90% delivered, 10% a failed drop-off that needs human follow-up.
      branches: [
        { to: "DELIVERED", upTo: 0.9 },
        { to: "FAILED_DELIVERY", upTo: 1 },
      ],
    },
  },
  DELIVERED: { durationSeconds: 0 },
  CANCELLED: { durationSeconds: 0 },
  FAILED_DELIVERY: { durationSeconds: 0 },
};

export function isTerminal(status: OrderStatus): boolean {
  return !TRANSITIONS[status].autoNext;
}

function pickBranch(branches: Branch[], roll: number): OrderStatus {
  for (const branch of branches) {
    if (roll < branch.upTo) return branch.to;
  }
  return branches[branches.length - 1].to;
}

/**
 * Recomputes the order's status as of `now`, stepping through as many
 * automatic transitions as have become eligible (handles the case where
 * nobody checked the order for a while and it needs to "catch up" several
 * steps at once). Manual-only and terminal states never move.
 */
export function computeCurrentStatus(
  snapshot: OrderStatusSnapshot,
  now: Date,
  rng: () => number = Math.random
): OrderStatusSnapshot & { changed: boolean } {
  let current = snapshot;
  let changed = false;

  // Safety cap: never loop more than the number of known statuses, so a
  // modeling bug in the graph can't spin this into an infinite loop.
  const maxSteps = Object.keys(TRANSITIONS).length;

  for (let step = 0; step < maxSteps; step++) {
    const def = TRANSITIONS[current.status];
    if (!def.autoNext) break; // terminal or manual-only
    if (now < current.nextEligibleAt) break; // not due yet

    const nextStatus = pickBranch(def.autoNext.branches, rng());
    const changedAt = current.nextEligibleAt; // transition happened exactly when it became due
    const nextDef = TRANSITIONS[nextStatus];
    current = {
      status: nextStatus,
      statusChangedAt: changedAt,
      nextEligibleAt: new Date(changedAt.getTime() + nextDef.durationSeconds * 1000),
    };
    changed = true;
  }

  return { ...current, changed };
}

/** Statuses a human (customer, support, restaurant) can cancel from. */
export const CANCELLABLE_FROM: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  "RECEIVED",
  "CONFIRMED",
  "PREPARING",
  "DELAYED",
]);

export function canCancel(status: OrderStatus): boolean {
  return CANCELLABLE_FROM.has(status);
}
