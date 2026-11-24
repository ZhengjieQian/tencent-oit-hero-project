import { createApp } from "./app.js";
import { createDatabase, initializeDatabase, seedDemoData } from "./db/database.js";

const db = createDatabase();
await initializeDatabase(db);
await seedDemoData(db);
const port = Number(process.env.PORT ?? 3001);
const app = createApp(db);
const server = app.listen(port, "127.0.0.1", () =>
  console.log(`API listening on http://localhost:${port}`),
);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () =>
    server.close(() => {
      void db.end().then(() => process.exit(0));
    }),
  );
}
