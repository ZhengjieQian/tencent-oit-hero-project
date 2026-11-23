import { createDatabase } from "./database.js";

const db = createDatabase();
try {
  const tenants = db
    .prepare(
      "SELECT id, name, status FROM tenants ORDER BY name COLLATE NOCASE",
    )
    .all();
  console.table(tenants);
} finally {
  db.close();
}
