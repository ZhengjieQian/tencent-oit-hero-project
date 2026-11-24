import { newDb } from "pg-mem";
import { initializeDatabase, seedDemoData } from "../../src/db/database.js";

export async function createTestDatabase() {
  const memory = newDb({ autoCreateForeignKeyIndices: true, noAstCoverageCheck: true });
  const Pool = memory.adapters.createPg().Pool;
  const db = new Pool();
  await initializeDatabase(db);
  await seedDemoData(db);
  return { db, memory };
}
