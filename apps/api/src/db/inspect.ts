import { createDatabase, initializeDatabase } from "./database.js";

const db = createDatabase();
try {
  await initializeDatabase(db);
  const tenants = await db.query("SELECT id, name, status FROM tenants ORDER BY lower(name)");
  console.table(tenants.rows);
} finally {
  await db.end();
}
