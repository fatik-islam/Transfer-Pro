/**
 * Transfer Pro now uses InsForge for runtime reads and writes.
 * This stub remains only as a migration marker so older imports fail loudly if reintroduced.
 */
export function prismaRuntimeRemoved(): never {
  throw new Error("Prisma runtime access has been removed. Use lib/insforge.ts and lib/repository.ts.");
}
