import { config } from 'dotenv'

// Load environment variables from .env.test if it exists
config({ path: '.env.test' })

// Set default environment variables for testing
process.env.LANGSMITH_API_URL = process.env.LANGSMITH_API_URL || 'https://api.smith.langchain.com'
process.env.LANGSMITH_API_KEY = process.env.LANGSMITH_API_KEY || 'test-key'
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key'

// Global test timeout
jest.setTimeout(30000) // 30 seconds 