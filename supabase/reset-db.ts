import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'
import pkg from 'pg'
const { Client } = pkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env.local") })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
if (!process.env.SUPABASE_DB_PASSWORD) throw new Error('SUPABASE_DB_PASSWORD is required')

// Create Supabase client for checking results
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

// Extract database URL from Supabase URL
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/(?:https?:\/\/)?([^.]+)/)?.[1] ?? ''
console.log('Project ref:', projectRef)

// Direct connection string format from Supabase docs
const dbUrl = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`

// Update the client configuration to match working pattern
const client = new Client({ 
  connectionString: dbUrl
})

// Validation functions
async function validateSupabaseUrl(url: string) {
  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format')
  }
  
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (response.status !== 401 && response.status !== 404 && !response.ok) {
      throw new Error(`Unexpected response: ${response.status}`)
    }
    console.log('✓ Supabase URL is valid and reachable')
  } catch (error) {
    throw new Error(`Could not connect to Supabase URL: ${error}`)
  }
}

async function validateServiceRoleKey(url: string, key: string) {
  if (!key.startsWith('eyJ')) {
    throw new Error('Invalid SUPABASE_SERVICE_ROLE_KEY format')
  }
  
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    })
    
    if (response.status === 401) {
      throw new Error('Service role key authentication failed')
    }
    console.log('✓ Service role key is valid')
  } catch (error) {
    throw new Error(`Service role key check failed: ${error}`)
  }
}

async function validateDbPassword(url: string, password: string) {
  const client = new Client({ 
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  })
  
  try {
    console.log('Attempting database connection...')
    await client.connect()
    const result = await client.query('SELECT version()')
    await client.end()
    if (!result.rows[0].version) {
      throw new Error('Could not get database version')
    }
    console.log('✓ Database password is valid and connection successful')
  } catch (error: any) {
    await client.end().catch(() => {})
    if (error.message.includes('password authentication failed')) {
      throw new Error('Database password is incorrect')
    }
    throw new Error(`Database connection failed: ${error.message}`)
  }
}

async function validateEnvironmentVariables() {
  console.log("\nValidating environment variables...")
  
  console.log("\nChecking NEXT_PUBLIC_SUPABASE_URL...")
  await validateSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!)
  console.log("✓ NEXT_PUBLIC_SUPABASE_URL is confirmed valid:", process.env.NEXT_PUBLIC_SUPABASE_URL)
  
  console.log("\nChecking SUPABASE_SERVICE_ROLE_KEY...")
  await validateServiceRoleKey(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  console.log("✓ SUPABASE_SERVICE_ROLE_KEY is confirmed valid:", process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(0, 10) + "..." + process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(-10))
  
  console.log("\nChecking SUPABASE_DB_PASSWORD...")
  await validateDbPassword(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_DB_PASSWORD!)
  console.log("✓ SUPABASE_DB_PASSWORD is confirmed valid:", "*".repeat(process.env.SUPABASE_DB_PASSWORD!.length))
  
  console.log("\n✓ All environment variables validated successfully!")
}

async function resetDatabase() {
  console.log("Starting database reset...")
  
  const client = new Client({ 
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  })
  
  try {
    await client.connect()
    console.log("Connected to database")

    // First transaction: Schema reset
    await client.query('BEGIN')
    try {
      console.log("Clearing public schema...")
      await client.query('DROP SCHEMA IF EXISTS public CASCADE;')
      await client.query('CREATE SCHEMA public;')
      await client.query('GRANT ALL ON SCHEMA public TO postgres;')
      await client.query('GRANT ALL ON SCHEMA public TO public;')
      await client.query('COMMIT')
      console.log("Public schema cleared")
    } catch (error) {
      await client.query('ROLLBACK')
      console.error("Error clearing schema:", error)
      throw error
    }

    // Second transaction: Migrations
    await client.query('BEGIN')
    try {
      // Get all migration files and sort them
      const migrationsDir = path.resolve(__dirname, "migrations")
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort((a, b) => a.localeCompare(b))

      // Run each migration file in order
      for (const migrationFile of migrationFiles) {
        console.log(`Running migration: ${migrationFile}...`)
        const migrationPath = path.resolve(migrationsDir, migrationFile)
        const migration = fs.readFileSync(migrationPath, "utf8")
        await client.query(migration)
        console.log(`Migration ${migrationFile} completed successfully`)
      }

      await client.query('COMMIT')
      console.log("All migrations completed successfully!")

    } catch (error) {
      await client.query('ROLLBACK')
      console.error("Error during migration:", error)
      throw error
    }

  } catch (error) {
    console.error("Database error:", error)
    throw error
  } finally {
    try {
      await client.end()
    } catch (error) {
      console.error("Error closing database connection:", error)
    }
  }
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
}

async function main() {
  try {
    await validateEnvironmentVariables()
    await resetDatabase()
    await checkTables()
  } catch (error) {
    console.error("Fatal error:", error)
    process.exit(1)
  }
}

// Run if this is the main module (ESM version)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error("Uncaught error in main:", error)
    process.exit(1)
  })
} 