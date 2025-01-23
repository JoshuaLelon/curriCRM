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

async function checkTables() {
  console.log('Checking seeded tables...\n')

  // Check sources
  const { data: sources, error: sourcesError } = await supabase
    .from('sources')
    .select('*')
  
  if (sourcesError) {
    console.error('Error fetching sources:', sourcesError)
    process.exit(1)
  }
  console.log('Sources:', sources.length)
  console.log(sources)

  // Check requests
  const { data: requests, error: requestsError } = await supabase
    .from('requests')
    .select('*')
  
  if (requestsError) {
    console.error('Error fetching requests:', requestsError)
    process.exit(1)
  }
  console.log('\nRequests:', requests.length)
  console.log(requests)

  // Check curriculums
  const { data: curriculums, error: curriculumsError } = await supabase
    .from('curriculums')
    .select('*')
  
  if (curriculumsError) {
    console.error('Error fetching curriculums:', curriculumsError)
    process.exit(1)
  }
  console.log('\nCurriculums:', curriculums.length)
  console.log(curriculums)

  // Check curriculum nodes
  const { data: nodes, error: nodesError } = await supabase
    .from('curriculum_nodes')
    .select('*')
  
  if (nodesError) {
    console.error('Error fetching curriculum nodes:', nodesError)
    process.exit(1)
  }
  console.log('\nCurriculum Nodes:', nodes.length)
  console.log(nodes)

  // Check messages
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
  
  if (messagesError) {
    console.error('Error fetching messages:', messagesError)
    process.exit(1)
  }
  console.log('\nMessages:', messages.length)
  console.log(messages)

  // Verify expected counts
  const expectedCounts = {
    sources: 4,
    requests: 4,
    curriculums: 2,
    curriculum_nodes: 6,
    messages: 9
  }

  let hasError = false
  
  if (sources.length !== expectedCounts.sources) {
    console.error(`\nError: Expected ${expectedCounts.sources} sources, found ${sources.length}`)
    hasError = true
  }
  if (requests.length !== expectedCounts.requests) {
    console.error(`\nError: Expected ${expectedCounts.requests} requests, found ${requests.length}`)
    hasError = true
  }
  if (curriculums.length !== expectedCounts.curriculums) {
    console.error(`\nError: Expected ${expectedCounts.curriculums} curriculums, found ${curriculums.length}`)
    hasError = true
  }
  if (nodes.length !== expectedCounts.curriculum_nodes) {
    console.error(`\nError: Expected ${expectedCounts.curriculum_nodes} curriculum nodes, found ${nodes.length}`)
    hasError = true
  }
  if (messages.length !== expectedCounts.messages) {
    console.error(`\nError: Expected ${expectedCounts.messages} messages, found ${messages.length}`)
    hasError = true
  }

  if (hasError) {
    console.error('\nSeeding verification failed!')
    process.exit(1)
  }

  console.log('\nAll tables verified successfully!')
}

// Run the check
checkTables().catch(error => {
  console.error('Error:', error)
  process.exit(1)
}) 