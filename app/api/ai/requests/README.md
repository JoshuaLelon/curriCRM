# AI Requests API

This directory contains the API routes for handling AI-powered curriculum generation requests.

## Routes

### `POST /api/ai/requests/[requestId]`

Triggers the AI workflow to generate a curriculum for a specific request.

#### Parameters
- `requestId` (UUID): The ID of the request to process

#### Response
```json
{
  "success": true
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

#### Progress Updates
The workflow broadcasts progress updates via Supabase Realtime on the channel `request_{requestId}_updates`. Subscribe to this channel to receive real-time progress updates.

Example progress update:
```json
{
  "type": "broadcast",
  "event": "progress",
  "payload": {
    "step": 1,
    "totalSteps": 4
  }
}
```

Steps:
1. Gather context from the request
2. Generate learning plan
3. Search for resources
4. Build curriculum structure

## Implementation Details

The API route triggers a LangGraph workflow that:
1. Fetches the request context from the database
2. Uses GPT-4 to generate a learning plan
3. Finds or generates resources for each topic
4. Creates the curriculum structure in the database

See `/lib/workflows/README.md` for more details about the workflow implementation. 