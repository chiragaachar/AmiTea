// Keep the SQL Editor entry point identical to the single initial migration.
import { copyFileSync } from "node:fs";
copyFileSync("supabase/migrations/202610100001_initial.sql", "supabase/schema.sql");
