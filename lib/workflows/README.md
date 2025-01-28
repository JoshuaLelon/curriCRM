# AI Workflow Implementation

This directory contains the LangGraph-based workflow implementation for AI-powered curriculum generation.

## Files

- `ai-runner.ts`: Main workflow orchestrator using LangGraph's `StateGraph`
- `ai-nodes.ts`: Individual node functions for each step of the workflow
- `types.ts`: TypeScript types and state definitions

## Workflow Overview

The workflow is implemented as a directed graph with the following nodes:

1. `gatherContext`: Fetches request details from the database
2. `plan`: Uses GPT-4 to generate a learning plan
3. `resourceSearch`: Finds or generates resources for each topic
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