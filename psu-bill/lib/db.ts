// lib/db.ts
import { Pool } from "pg";

export const pgPool = new Pool({
  user: "psubill",
  host: "localhost",
  database: "psubill",
  password: "jkl#$*",
  port: 5432,
});

pgPool.on("error", (err) => {
  console.error("PG Pool Error:", err);
});
