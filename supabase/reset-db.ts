import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'
import { createSeedUsersWithAuth } from './seed-auth-users.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env.local") })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Add process exit handler
process.on('exit', (code) => {
  console.log(`Process exiting with code: ${code}`)
})

// Add unhandled promise rejection handler
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error)
  process.exit(1)
})

// Add uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  process.exit(1)
})

async function executeSql(sql: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: sql
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(`SQL execution failed: ${JSON.stringify(error)}`)
  }

  return await response.json()
}

async function resetDatabase() {
  console.log("Starting database reset...")
  
  try {
    // Clear existing data
    console.log("Clearing existing data...")
    await executeSql('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;')
    console.log("Existing data cleared successfully")

    // Run the initial schema migration
    console.log("Running initial schema migration...")
    const migrationPath = path.resolve(__dirname, "migrations/initial_schema_and_policies.sql")
    console.log("Migration path:", migrationPath)
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at: ${migrationPath}`)
    }
    const migration = fs.readFileSync(migrationPath, "utf8")
    await executeSql(migration)
    console.log("Database migration completed successfully")
    
    // Create auth users with passwords first
    console.log("Creating auth users...")
    try {
      await createSeedUsersWithAuth()
      console.log("Auth users created successfully")
    } catch (error) {
      console.error("Error creating auth users:", error)
      throw error
    }

    // Run the seed SQL file
    console.log("Running seed SQL file...")
    const seedPath = path.resolve(__dirname, "seed.sql")
    console.log("Seed path:", seedPath)
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Seed file not found at: ${seedPath}`)
    }
    const seed = fs.readFileSync(seedPath, "utf8")
    await executeSql(seed)
    console.log("Database seeding completed successfully")

    console.log("Database reset and seeding completed successfully!")

  } catch (error) {
    console.error("Error during database operations:", error)
    throw error
  }
}

// Test database connection using Supabase client
async function testConnection() {
  console.log("Testing connection via Supabase client...")
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error("Supabase client error:", error)
    throw error
  }

  console.log("Supabase connection successful:", data)
  return data
}

async function checkTables() {
  console.log("\nChecking profiles table:")
  const { data: profiles, error: profilesError } = await supabaseClient
    .from('profiles')
    .select('*')
  
  if (profilesError) {
    console.error("Error fetching profiles:", profilesError)
  } else {
    console.log("Profiles:", profiles)
  }

  console.log("\nChecking user_roles table:")
  const { data: roles, error: rolesError } = await supabaseClient
    .from('user_roles')
    .select('*')
  
  if (rolesError) {
    console.error("Error fetching user_roles:", rolesError)
  } else {
    console.log("User Roles:", roles)
  }
}

async function main() {
  try {
    await testConnection()
    await resetDatabase()
    console.log("Database reset completed successfully")
    await checkTables()
  } catch (error) {
    console.error("Fatal error:", error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error("Uncaught error in main:", error)
  process.exit(1)
}) 