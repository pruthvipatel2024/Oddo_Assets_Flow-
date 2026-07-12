import { Database, DatabaseCollections, INITIAL_DB, mapCollectionToTableName, getInsertQueryAndValues } from "./src/db";
import { Pool } from "pg";

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  console.log("Connecting directly to PostgreSQL to perform drops...");
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  const keys: (keyof DatabaseCollections)[] = [
    "departments",
    "categories",
    "roles",
    "users",
    "assets",
    "allocations",
    "transfers",
    "bookings",
    "maintenance",
    "audits",
    "logs",
    "notifications",
  ];

  try {
    console.log("Dropping all existing tables to align schema...");
    const drops = [
      "DROP TABLE IF EXISTS employees CASCADE",
      "DROP TABLE IF EXISTS allocations CASCADE",
      "DROP TABLE IF EXISTS transfers CASCADE",
      "DROP TABLE IF EXISTS bookings CASCADE",
      "DROP TABLE IF EXISTS maintenance CASCADE",
      "DROP TABLE IF EXISTS audits CASCADE",
      "DROP TABLE IF EXISTS logs CASCADE",
      "DROP TABLE IF EXISTS notifications CASCADE",
      "DROP TABLE IF EXISTS assets CASCADE",
      "DROP TABLE IF EXISTS users CASCADE",
      "DROP TABLE IF EXISTS roles CASCADE",
      "DROP TABLE IF EXISTS departments CASCADE",
      "DROP TABLE IF EXISTS categories CASCADE"
    ];
    for (const drop of drops) {
      await pool.query(drop);
    }
    console.log("All tables dropped successfully.");

    console.log("Initializing database class (will recreate tables with correct schema)...");
    await Database.initialize();

    console.log("INITIAL_DB keys:", Object.keys(INITIAL_DB));
    for (const key of keys) {
      const list = INITIAL_DB[key] || [];
      console.log(`INITIAL_DB[${key}] has ${list.length} items`);
    }

    // Let's do the reset manually with explicit try/catches!
    for (const key of keys) {
      const tableName = mapCollectionToTableName(key);
      console.log(`Clearing table ${tableName}...`);
      await pool.query(`DELETE FROM ${tableName}`);
      
      const seedList = INITIAL_DB[key] || [];
      console.log(`Inserting ${seedList.length} items into table ${tableName}...`);
      
      for (const item of seedList) {
        const { query, values } = getInsertQueryAndValues(key, item);
        try {
          await pool.query(query, values);
        } catch (queryErr: any) {
          console.error(`Error inserting into ${tableName}:`, queryErr.message);
          console.error(`Query: ${query}`);
          console.error(`Values:`, values);
          throw queryErr;
        }
      }
      console.log(`Finished table ${tableName}`);
    }

    console.log("Seeding complete! Double checking database row counts now:");
    for (const key of keys) {
      const res = await pool.query(`SELECT COUNT(*) FROM ${mapCollectionToTableName(key)}`);
      console.log(`Table ${key}: ${res.rows[0].count} rows`);
    }

  } catch (err: any) {
    console.error("Failed reset manually during query:", err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();
