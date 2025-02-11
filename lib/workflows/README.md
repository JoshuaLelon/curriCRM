# AI Workflow Implementation

This directory contains the LangGraph-based workflow implementation for AI-powered curriculum generation.

## Files

- `ai-runner.ts`: Main workflow orchestrator using LangGraph's `StateGraph`
- `ai-nodes.ts`: Individual node functions for each step of the workflow
- `types.ts`: TypeScript types and state definitions

## Workflow Overview

The workflow is implemented as a directed graph with the following nodes:

1. `gatherContext`: Fetches request details from the database
2. `plan`: Uses GPT-3.5-turbo to generate a learning plan
3. `resourceSearch`: Finds or generates resources for each topic, with dynamic resource allocation:
   - Uses GPT-3.5-turbo to rate each topic's complexity (1-5)
   - Allocates resources based on complexity:
     - Simple topics (1): 1 resource
     - Complex topics (5): 5 resources
     - Other topics: Resources match complexity rating
   - Searches for high-quality video resources using Tavily API
4. `build`: Creates the curriculum structure in the database

```mermaid
graph LR
  start[Start] --> gather[Gather Context]
  gather --> plan[Plan]
  plan --> search[Resource Search]
  search --> build[Build]
  build --> end[End]
```

## State Management

The workflow state is managed using LangGraph's `Annotation` system:

```typescript
const WorkflowAnnotation = Annotation.Root({
  requestId: Annotation<string>(),
  context: Annotation<any>({
    value: (x: any) => x,
    default: () => null,
  }),
  planItems: Annotation<string[]>({
    value: (x: string[]) => x,
    default: () => [],
  }),
  resources: Annotation<Record<string, { title: string; url: string }[]>>({
    value: (x) => x,
    default: () => ({}),
  }),
})
```

## Progress Updates

The workflow broadcasts progress updates via Supabase Realtime. Each node's execution triggers a progress update with the current step number and total steps.

Example:
```typescript
await supabase.channel(`request_${requestId}_updates`).send({
  type: 'broadcast',
  event: 'progress',
  payload: {
    step: currentStep,
    totalSteps: 4,
  },
})
```

## Error Handling

- Each node function includes error handling for database operations
- The workflow orchestrator catches and logs errors
- Failed workflows are not marked as complete
- Errors are propagated to the API route which returns a 500 status

## Usage

To trigger the workflow:

```typescript
import { runAIWorkflow } from '@/lib/workflows/ai-runner'

// Start the workflow for a request
await runAIWorkflow(requestId)
```

## Database Schema

The workflow interacts with the following tables:
- `requests`: Stores request status and metadata
- `curriculums`: Stores generated curriculums
- `curriculum_nodes`: Stores curriculum structure
- `sources`: Stores learning resources

See the database migrations for detailed schema information.

## Realtime Channel Persistence

We removed the auto-cleanup (removeChannel) so that the client can subscribe to progress updates more reliably. This prevents the channel from closing before the UI can receive each broadcast.

The channel will remain open during the entire workflow process, allowing the frontend to:
1. Subscribe to the channel when the component mounts
2. Receive all progress updates as they happen
3. Show the progress indicator for each stage

The channel is automatically cleaned up when:
- The workflow completes
- The component unmounts
- The client disconnects 