import { Client } from 'langsmith'

// Create LangSmith client
export const client = new Client({
  apiUrl: process.env.LANGCHAIN_ENDPOINT,
  apiKey: process.env.LANGCHAIN_API_KEY
}) 