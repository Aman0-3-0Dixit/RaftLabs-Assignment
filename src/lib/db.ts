import { PrismaClient } from "@prisma/client";
import { PrismaOrderRepository } from "@/lib/repositories/prisma-repository";
import type { OrderRepository } from "@/lib/repositories/types";

// Standard Next.js pattern: stash the client on `globalThis` in dev so hot
// reloading doesn't spawn a new PrismaClient (and a new connection pool)
// on every file save.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Lazily constructed rather than instantiated at module load. Next.js
// imports route modules during the build's "collecting page data" step
// (and on cold starts) purely to analyze them — constructing the client
// eagerly would mean that step (or a cold start) fails the moment the
// database is briefly unreachable, even for requests that never touch it.
let _repository: OrderRepository | undefined;

export function getRepository(): OrderRepository {
  if (!_repository) {
    const prisma =
      globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
      });
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
    _repository = new PrismaOrderRepository(prisma);
  }
  return _repository;
}
