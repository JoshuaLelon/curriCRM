import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const seedUsers = [
  { email: 'joshua.mitchell@g.austincc.edu' },
  { email: 'joshua.mitchell@gauntletai.com' },
  { email: 'jlelonmitchell@gmail.com' }
];

export async function createSeedUsersWithAuth() {
  console.log('Creating auth users...');
  
  for (const { email } of seedUsers) {
    try {
      await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      console.log(`Created auth user: ${email}`);
    } catch (error: any) {
      // Skip if user already exists
      if (error.message?.includes('User already registered')) {
        console.log(`User already exists: ${email}`);
        continue;
      }
      throw error;
    }
  }
  
  console.log('Finished creating auth users');
}

// Allow running directly
if (require.main === module) {
  createSeedUsersWithAuth().catch(console.error);
} 