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

async function checkAuthSchema() {
  console.log('Checking auth schema...');

  try {
    // Check if auth schema exists and list tables
    const { data: schemaInfo, error: schemaError } = await supabase.rpc('check_auth_schema', {});

    if (schemaError) {
      console.error('Error checking schema:', schemaError);
      return;
    }

    console.log('Schema check result:', schemaInfo);

    // Check service role permissions
    const { data: permissionInfo, error: permError } = await supabase.rpc('check_service_role_permissions', {});

    if (permError) {
      console.error('Error checking permissions:', permError);
      return;
    }

    console.log('\nPermission check result:', permissionInfo);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the check
checkAuthSchema().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 