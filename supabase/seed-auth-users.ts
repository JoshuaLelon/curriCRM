import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const seedUsers = [
  'joshua.mitchell@g.austincc.edu',
  'joshua.mitchell@gauntletai.com',
  'jlelonmitchell@gmail.com'
];

async function createUsers() {
  console.log('Creating auth users...');
  console.log('Using URL:', supabaseUrl);
  
  for (const email of seedUsers) {
    try {
      // Create user via RPC
      const { data: userData, error: userError } = await supabase.rpc('create_auth_user', {
        user_email: email
      });

      if (userError) {
        if (userError.message.includes('duplicate key value')) {
          console.log(`User already exists: ${email}`);
          continue;
        }
        console.error(`Error creating user ${email}:`, userError);
        continue;
      }

      console.log(`Created user: ${email}`, userData);

    } catch (error) {
      console.error(`Error processing ${email}:`, error);
    }
  }

  // Verify users
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  console.log('\nAll users in database:', users);
}

// Run the creation
createUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 