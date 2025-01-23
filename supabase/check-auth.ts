import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAuthUsers() {
  console.log('Checking auth users...')
  console.log('Using URL:', supabaseUrl)
  
  const expectedEmails = [
    'joshua.mitchell@g.austincc.edu',
    'joshua.mitchell@gauntletai.com',
    'jlelonmitchell@gmail.com'
  ]

  const { data: users, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('Error fetching auth users:', error)
    process.exit(1)
  }

  console.log('\nAPI Response:', JSON.stringify(users, null, 2))
  
  if (!users.users || !Array.isArray(users.users)) {
    console.error('Unexpected API response format:', users)
    process.exit(1)
  }

  console.log('\nFound auth users:')
  users.users.forEach(user => {
    console.log(`- ${user.email} (id: ${user.id})`)
  })

  const missingEmails = expectedEmails.filter(email => 
    !users.users.some(user => user.email === email)
  )

  if (missingEmails.length > 0) {
    console.error('\nMissing expected users:', missingEmails)
    process.exit(1)
  }

  console.log('\nAll expected auth users found!')
}

// Run the check
checkAuthUsers().catch(error => {
  console.error('Error:', error)
  process.exit(1)
}) 