import { Client } from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { createSeedUsersWithAuth } from "./seed-auth-users";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Create Supabase client with service role
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Handle both pooling and non-pooling URLs
const postgresUrl = (process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || '').replace('?sslmode=require', '');

async function resetDatabase() {
  console.log("Starting database reset...");
  const client = new Client({ 
    connectionString: postgresUrl,
    ssl: process.env.NODE_ENV === 'production' 
      ? {
          rejectUnauthorized: true
        }
      : {
          rejectUnauthorized: false
        }
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Start transaction
    await client.query('BEGIN');

    try {
      // Drop existing schema
      console.log("Clearing existing data...");
      await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
      await client.query('CREATE SCHEMA public;');
      console.log("Existing data cleared");

      // Run the initial schema migration
      console.log("Running initial schema migration...");
      const migrationPath = path.resolve(__dirname, "../supabase/migrations/initial_schema_and_policies.sql");
      const migration = fs.readFileSync(migrationPath, "utf8");
      await client.query(migration);
      console.log("Database migration completed");

      // Commit schema changes
      await client.query('COMMIT');
      
      // Create auth users with passwords first
      console.log("Creating auth users...");
      try {
        await createSeedUsersWithAuth();
        console.log("Auth users created");
      } catch (error) {
        console.error("Error creating auth users:", error);
        throw error;
      }

      // Start new transaction for seed data
      await client.query('BEGIN');

      // Run the seed SQL file
      console.log("Running seed SQL file...");
      const seedPath = path.resolve(__dirname, "../supabase/seed.sql");
      const seed = fs.readFileSync(seedPath, "utf8");
      await client.query(seed);
      console.log("Database SQL seeding completed");

      // Commit seed data
      await client.query('COMMIT');

    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw error;
    }

    // Close pg client before using supabase client
    await client.end();

    console.log("Database reset and seeding completed successfully!");

  } catch (error) {
    console.error("Error in database reset:", error);
    throw error;
  } finally {
    // Ensure client is closed even if an error occurs
    try {
      await client.end();
    } catch (error) {
      console.error("Error closing database connection:", error);
    }
  }
}

// Only run if this is the main module
if (require.main === module) {
  resetDatabase().catch(console.error);
} 