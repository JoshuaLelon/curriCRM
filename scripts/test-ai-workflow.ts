import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function main() {
  // Create a test request
  const { data: request, error: requestError } = await supabase
    .from('requests')
    .insert([
      {
        tag: 'software',
        content_type: 'tutorial',
      }
    ])
    .select()
    .single()

  if (requestError) {
    console.error('Error creating request:', requestError)
    process.exit(1)
  }

  console.log('Created test request:', request)

  // Call the AI workflow API
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/api/ai/requests/${request.id}`
  console.log('Calling API:', url)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
    })

    console.log('Response status:', response.status)
    const text = await response.text()
    console.log('Response text:', text)

    try {
      const result = JSON.parse(text)
      console.log('API response:', result)
    } catch (e) {
      console.error('Failed to parse JSON response:', e)
    }
  } catch (e) {
    console.error('Network error:', e)
    process.exit(1)
  }

  // Wait for a bit to see if the request gets processed
  console.log('Waiting 5 seconds...')
  await new Promise(resolve => setTimeout(resolve, 5000))

  // Check if request was processed
  const { data: updatedRequest, error: checkError } = await supabase
    .from('requests')
    .select('*')
    .eq('id', request.id)
    .single()

  if (checkError) {
    console.error('Error checking request:', checkError)
    process.exit(1)
  }

  console.log('Final request state:', updatedRequest)
}

main().catch(console.error) 