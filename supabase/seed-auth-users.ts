import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

interface SeedUser {
  email: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

export const seedUsers: SeedUser[] = [
  { email: 'joshua.mitchell@g.austincc.edu' },
  { email: 'joshua.mitchell@gauntletai.com' },
  { email: 'jlelonmitchell@gmail.com' }
];

export async function createSeedUsersWithAuth(): Promise<void> {
  console.log('Creating auth users...');
  
  for (const { email } of seedUsers) {
    try {
      await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      console.log(`Created auth user: ${email}`);
    } catch (error: unknown) {
      // Skip if user already exists
      if (error instanceof Error && error.message?.includes('User already registered')) {
        console.log(`User already exists: ${email}`);
        continue;
      }
      throw error;
    }
  }
  
  console.log('Finished creating auth users');
}

// Allow running directly
if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:///').href) {
  createSeedUsersWithAuth().catch((error: unknown) => {
    console.error('Error seeding auth users:', error);
    process.exit(1);
  });
} 