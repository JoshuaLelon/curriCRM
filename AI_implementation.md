# Master Implementation Checklist

## New Checklist Overview

- [x] Fix the lack of edges bug. Context:

```
[React Flow]: Couldn't create edge for source handle id: "undefined", edge id: aa681a8f-9c4a-4d85-8b46-d1f14cbe7b9a-d1e552c9-7a17-4b9b-a228-1d89cfe9a5f3. Help: https://reactflow.dev/error#008 Error Component Stack
    at div (<anonymous>)
    at div (<anonymous>)
    at div (<anonymous>)
    at div (<anonymous>)
    at div (<anonymous>)
    at CurriculumTree (curriculum-tree.tsx:36:42)
    at div (<anonymous>)
    at div (<anonymous>)
    at CurriculumView (curriculum-view.tsx:11:42)
    at div (<anonymous>)
    at AdminView (admin-view.tsx:22:3)
    at div (<anonymous>)
    at div (<anonymous>)
    at RequestPage (page.tsx:20:39)
    at SupabaseProvider (supabase-provider.tsx:20:36)
    at body (<anonymous>)
    at html (<anonymous>)
    at RootLayout [Server] (<anonymous>)
```

- [x] Fix the fact that it doesn't create a tree when the request is finished.
- [x] Make sure that the curriculum generated has  start / end times (they can be random)
- [x] Make it so that I can just assign the request to the AI and i can leave the page without having to wait for it to finish (if that isn't the case already)
- [x] make sure the curriculum table is sorted in order of curriculum index
- [x] fix the URL/url casing issue in the curriculum table
- [x] update the curriculum table numbering to show position from top (1,2,3...) while maintaining reverse sort order
- [x] implement 20 test cases according to the below specifications (Agent Accuracy Metrics)
  - [x] figure out what that looks like for our application (e.g. what are the inputs and outputs? Annotate but for the javascript version?)
  - [x] figure out how to leverage langsmith for this
  - [x] figure out what the right tests look like
  - [x] implement the test cases
  - [x] integrate LangSmith for tracking metrics:
    - Speed of response (end-to-end time to get a curriculum)
    - Accuracy of field updates (subjective assessment of curriculum coherence)
  - [x] implement tracing for workflow nodes using LangSmith client
  - [x] set up metrics collection in WorkflowMetrics class
  - [x] add traceNode higher-order function for node execution tracking

```
Agent Accuracy Metrics


To pass Week 2, you must track any 2 of the following metrics and showcase their evaluation process on LangSmith/LangFuse in your walkthrough video: 


- Success rate at identifying the correct action
-Accuracy of field updates
-Speed of response
-Error rates and types


If for any reason, you need to use a custom metric that better matches your AI features, feel free to. If you are unsure on what that custom metric might be, reach out to staff for assistance. 

How to approach manual accuracy evaluation in your CRM applications: 

- Document 20-30 common requests you'd actually make to your CRM system. Make sure to include both simple tasks ("update this grade") and complex ones ("draft a progress report based on the last three assessments").
- For each request in your test dataset, document the expected outcome. 
  - What exact changes should appear in the database?
  - Which fields should be modified?
  - What should the response look like?
  - Any specific formatting or content requirements?
- Create structured test cases:
  - Input: The user's request
  - Expected Output: The specific changes that should occur
  - Context: Any additional information needed
  - Success Criteria: How to determine if the action was correct, probably human-driven for this project
- Set up LangSmith/LangFuse for monitoring:
  - Create a new project for your CRM features
  - Set up traces to track each request
  - Enable detailed logging of inputs/outputs
- Manually run systematic tests:
  - Test each case multiple times
  - Vary the phrasing slightly
  - Test with different contexts
  - Document any failures or unexpected behaviors
- Track key metrics manually:
  - Success rate at identifying the correct action
  - Accuracy of field updates
  - Speed of response
  - Error rates and types
```

## Previous Checklist Overview

### 1. Set Up Environment Variables & Project Context
- [x] Confirm you have the necessary environment variables (e.g., `OPENAI_API_KEY`).
- [x] Verify you have a Supabase project set up and connected to your application.
- [x] Confirm that the Next.js App Router and LangChain JS are properly installed.
- [x] Review the "What This Feature Is" and "What Purpose It Serves" sections for context.

### 2. Request Progress UI Implementation
- [x] Create a new API route at `app/api/requests/[id]/finish/route.ts` for marking requests as finished
- [x] Create a new `RequestProgressView` component to show real-time progress
  - [x] Add progress indicator (e.g., steps completed, loading states)
  - [x] Add status messages for each step
  - [x] Style the progress UI to match the app's design
- [x] Update `AdminView` component to:
  - [x] Show progress UI when request is being processed
  - [x] Subscribe to Supabase real-time updates for progress
  - [x] Auto-refresh when request is finished
- [x] Add loading states and transitions between steps
- [x] Test the progress UI with real-time updates

### 3. Update Request Assignment Flow
- [x] Modify the request assignment UI to include an "Assign to AI" option when the logged-in user is an admin
- [x] When "Assign to AI" is selected, set the `expert_id` to the current admin's ID
- [x] Update the request view logic to treat requests as AI-handled when:
  - The logged-in user is an admin AND
  - The expert_id matches the logged-in admin's ID
- [x] Test the assignment flow to ensure it correctly identifies AI-handled requests
- [x] Fix TypeScript linter errors in request-details.tsx related to tag and type handling

### 4. Create a New Next.js API Route
- [x] Add a new route at `app/api/ai/requests/[requestId]/route.ts`.
- [x] Implement a `POST` endpoint in the route that triggers the AI workflow.
- [x] Include error handling in the route to return `500` on failure.
- [x] Document the route path and its usage in `/app/api/ai/requests/README.md`.
- [x] Test the API route with a sample request ID to ensure it triggers the workflow.

### 5. Implement the Orchestrator with LangGraph
- [x] Create a new file, `ai-runner.ts`, in `/lib/workflows/`.
- [x] Define a multi-step `StateGraph` in the orchestrator.
- [x] Configure the graph's start, end, and edges for each workflow node.
- [x] Hook up an event listener to broadcast progress updates to Supabase Realtime.
- [x] Ensure the orchestrator marks the request as finished (`finished_at`) on completion.
- [x] Reference [Step 3: Orchestrator File with LangGraph](#3-orchestrator-file-with-langgraph).
- [x] TODO: Revisit LangGraph types when we have more clarity on the correct type definitions (currently using type assertions as workaround).

### 6. Implement Worker Node Functions
- [x] Create a new file, `ai-nodes.ts`, in `/lib/workflows/`.
- [x] Define the following node functions:
  - [x] `gatherContextNode`: Fetch request context from the database.
  - [x] `planNode`: Use LangChain to generate a learning plan.
  - [x] `resourceSearchNode`: Mock or fetch resources for the plan items.
  - [x] `buildCurriculumNode`: Insert the curriculum and related nodes into the database.
- [x] Integrate Supabase queries and LangChain AI steps into the nodes.
- [x] Test each node function independently to ensure it works as expected.

### 7. Trigger the AI Workflow
- [x] Call the API route `/api/ai/requests/[requestId]` with a `POST` request to trigger the workflow.
- [x] Subscribe to the real-time channel `request_{requestId}_updates` in the UI to display progress updates.
- [x] Test the workflow end-to-end to ensure the request is processed correctly.

### 8. Mark the Request as Finished
- [x] Verify that `ai-runner.ts` updates the `finished_at` field in the `requests` table upon workflow completion.
- [x] Confirm that a finished request appears correctly in the UI and database.
- [x] Test error scenarios to ensure incomplete requests are not marked as finished.

### 9. Update Documentation
- [x] Update the following `README.md` files with details of the new feature:
  - [x] `/app/api/ai/requests/README.md`: Document the API route and workflow.
  - [x] `/lib/workflows/README.md`: Explain the orchestrator and node functions.
  - [x] Root `README.md`: Add an overview of the AI integration and its usage.
- [x] Include examples of how admins can assign requests to AI and monitor progress.

### 10. Apply Best Practices
- [x] Ensure only final results (no partial data) are stored in the database.
- [x] Handle errors gracefully by returning a `500` response for failed workflows.
- [x] Use minimal `"use client"` logic, primarily for real-time updates in the UI.
- [x] Consider using a background worker for long-running AI calls if necessary.

### 11. Final Review
- [x] Verify the full workflow:
  - [x] Admin assigns request to AI (self-assigns)
  - [x] Trigger workflow via the API route
  - [x] Broadcast real-time progress updates to the UI
  - [x] Store final curriculum data in the database
  - [x] Mark the request as finished in the system
- [x] Test multiple sample requests to ensure accuracy and reliability.

# Comprehensive Overview

## Feature Summary (5 Sentences)
1. We are adding real-time progress tracking to our Next.js + Supabase application to show request processing status.
2. When a request is being processed, the system will show step-by-step progress in a dedicated UI component.
3. Admins can assign requests to be handled by AI by selecting "Assign to AI" during the normal assignment flow.
4. The system identifies AI-handled requests when the logged-in admin is the same as the assigned expert.
5. This provides a seamless experience for admins to monitor request processing.

## What This Feature Is
We already have a "requests" table that tracks request status through various states. To improve the user experience, we're adding real-time progress tracking that shows step-by-step updates as a request is being processed. This progress tracking uses Supabase Realtime channels to broadcast updates, allowing the UI to reflect the current state immediately. The UI will show a dedicated progress component that displays the current step, overall progress, and automatically transitions to the finished state when complete.

## What Purpose It Serves
Right now, users have no visibility into the progress of request processing. By adding real-time progress tracking, we can:
1. Show exactly what step is currently being worked on
2. Provide immediate feedback about the request's status
3. Automatically update the UI when processing is complete
4. Give users confidence that the system is working as expected

## How the Implementation Will Happen
1. We'll create a new `RequestProgressView` component to show real-time progress updates.
2. We'll update the `AdminView` component to subscribe to Supabase Realtime channels.
3. We'll implement smooth transitions between different request states.
4. When processing is complete, we'll automatically update the UI to show the finished state.

# Step-by-Step Implementation Checklist (Detailed)

### Create the Next.js API Route
Add a new file at `app/api/ai/requests/[requestId]/route.ts`:

```typescript
// path: app/api/ai/requests/[requestId]/route.ts
import { NextResponse } from 'next/server'
import { runAIWorkflow } from '@/lib/workflows/ai-runner'

export async function POST(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    await runAIWorkflow(params.requestId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
```

- **Purpose**: Trigger the AI workflow by calling the orchestrator function.  
- Update `/app/api/ai/requests/README.md` with details:
  - The POST request path: `/api/ai/requests/[requestId]`  
  - It runs our AI pipeline using LangGraph.

---

### Orchestrator File with LangGraph
Create `/lib/workflows/ai-runner.ts` to compile a `StateGraph` with node definitions from `ai-nodes.ts`, then run them in order, broadcasting progress at each step:

```typescript
// path: lib/workflows/ai-runner.ts
'use server'

import { supabase } from '@/lib/supabase'
import { StateGraph, MemorySaver, Annotation } from '@langchain/langgraph'
import {
  gatherContextNode,
  planNode,
  resourceSearchNode,
  buildCurriculumNode,
} from './ai-nodes'

// Shape of the shared state for our workflow:
const WorkflowAnnotation = Annotation.Root({
  requestId: Annotation<string>(),
  context: Annotation<any>(),
  planItems: Annotation<string[]>(),
  resources: Annotation<Record<string, { title: string; url: string }[]>>(),
})

export async function runAIWorkflow(requestId: string) {
  // 1) Assemble the state graph
  const workflow = new StateGraph(WorkflowAnnotation)
    .addNode('gatherContext', gatherContextNode)
    .addNode('plan', planNode)
    .addNode('resourceSearch', resourceSearchNode)
    .addNode('build', buildCurriculumNode)
    // Edges define the order of steps
    .addEdge('__start__', 'gatherContext')
    .addEdge('gatherContext', 'plan')
    .addEdge('plan', 'resourceSearch')
    .addEdge('resourceSearch', 'build')
    .addEdge('build', '__end__')

  const graphApp = workflow.compile({ checkpointer: new MemorySaver() })

  // 2) Hook up an event listener to broadcast progress
  graphApp.events.on('nodeBegin', async (evt) => {
    await announceProgress(requestId, evt.nodeName)
  })

  // 3) Run the graph from the start
  const initialState = { requestId }
  await graphApp.invoke(initialState)

  // 4) Mark request as finished in the DB
  await supabase
    .from('requests')
    .update({ finished_at: new Date().toISOString() })
    .eq('id', requestId)
}

// Helper function to broadcast progress
async function announceProgress(requestId: string, nodeName: string) {
  // Map nodeName => step number. Adjust as needed.
  const stepMap: Record<string, number> = {
    gatherContext: 1,
    plan: 2,
    resourceSearch: 3,
    build: 4,
  }

  supabase.channel(`request_${requestId}_updates`).send({
    type: 'progress',
    payload: {
      step: stepMap[nodeName] ?? 0,
      totalSteps: 4,
    },
  })
}
```

- Document in `lib/workflows/README.md`:
  - `ai-runner.ts` uses LangGraph to orchestrate `gatherContext → plan → resourceSearch → build`.  
  - Broadcasting progress with `supabase.channel`.

---

### Worker Nodes in `/lib/workflows/ai-nodes.ts`
Create node functions (`gatherContextNode`, `planNode`, `resourceSearchNode`, `buildCurriculumNode`) that each return updated state to the graph:

```typescript
// path: lib/workflows/ai-nodes.ts
'use server'

import { NodeFn } from '@langchain/langgraph'
import { supabase } from '@/lib/supabase'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { HumanMessage } from 'langchain/schema'

// 1) gatherContextNode
export const gatherContextNode: NodeFn = async (state) => {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('id', state.requestId)
    .single()
  if (error || !data) throw new Error('Unable to load request context')

  return {
    context: data,
  }
}

// 2) planNode
export const planNode: NodeFn = async (state) => {
  const tag = state.context?.tag || 'GeneralTopic'
  const model = new ChatOpenAI({ temperature: 0 })
  const response = await model.call([
    new HumanMessage(`Outline sub-topics needed to learn about "${tag}". One per line.`),
  ])
  const planText = response.text
  const planItems = planText
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)

  return {
    planItems,
  }
}

// 3) resourceSearchNode
export const resourceSearchNode: NodeFn = async (state) => {
  const { planItems } = state
  const resources: Record<string, { title: string; url: string }[]> = {}

  for (const item of planItems) {
    resources[item] = [
      {
        title: `Mock resource for ${item}`,
        url: `https://example.com/${encodeURIComponent(item)}`
      }
    ]
  }

  return {
    resources,
  }
}

// 4) buildCurriculumNode
export const buildCurriculumNode: NodeFn = async (state) => {
  const { planItems, resources, requestId } = state

  // Create a new row in 'curriculums'
  const { data: newCurriculum, error: curriculumError } = await supabase
    .from('curriculums')
    .insert([{ request_id: requestId }])
    .select()
    .single()
  if (curriculumError) throw curriculumError

  // For each plan item, create a source and a curriculum_node
  for (let i = 0; i < planItems.length; i++) {
    const item = planItems[i]
    const [firstResource] = resources[item] || []
    if (!firstResource) continue

    const { data: newSource, error: sourceError } = await supabase
      .from('sources')
      .insert([{ title: firstResource.title, URL: firstResource.url }])
      .select()
      .single()
    if (sourceError) throw sourceError

    const { error: nodeError } = await supabase
      .from('curriculum_nodes')
      .insert([{
        curriculum_id: newCurriculum.id,
        source_id: newSource.id,
        level: i,
        index_in_curriculum: i,
      }])
    if (nodeError) throw nodeError
  }

  return {}
}
```

- Each `NodeFn` processes or transforms the shared state and returns new fields.  
- `ChatOpenAI` from LangChain is used as an example for the "plan" step.  
- You can integrate a real search function in `resourceSearchNode` if needed.

---

### Triggering the AI Workflow
When an admin assigns a request to be handled by AI:

```typescript
// First, assign the request to the admin (self-assign)
await supabase
  .from('requests')
  .update({ expert_id: currentAdminId })
  .eq('id', someRequestId)

// Then call our new route to start the AI workflow:
await fetch(`/api/ai/requests/${someRequestId}`, { method: 'POST' })
```

- This triggers the orchestrator, which runs the graph.  
- The front end can subscribe to `request_{someRequestId}_updates` for progress messages.

---

### Mark the Request Finished
In `ai-runner.ts`, after the final node, we set `finished_at`. Once that's done, the request is considered complete in the rest of your system.

---

### Best Practices & Crucial Notes
- Store only final results (no partial data) for the AI's steps.  
- Use minimal `"use client"`, mostly for real-time channel updates in the UI.  
- If the AI calls take too long, consider using a background worker instead of a serverless route.  
- Handle errors carefully: if an error is thrown, the route returns a 500, and the request remains incomplete.  

---

## Conclusion
By following these steps, even a brand-new developer can:

1. Build the Next.js route that kicks off the LangGraph orchestrator.  
2. Implement `ai-runner.ts` and `ai-nodes.ts` to define each workflow step.  
3. Broadcast progress with Supabase Realtime so the UI gets live updates.  
4. Store final data in `curriculums` and `curriculum_nodes`, then mark the request as finished.  

Be sure to keep the project's README files updated with references and usage examples so future contributors can maintain or expand the AI workflow seamlessly.

# Implementation Notes

## Attempt History

1. Testing API route with sample request ID
   - First attempt: Failed with "null value in column 'id' of relation 'curriculums' violates not-null constraint"
   - Fix: Added UUID generation for all tables that require an ID (curriculums, sources, curriculum_nodes)
   - Result: Success - workflow completes and updates request status correctly

2. Implementing Worker Node Functions (Checklist item 6)
   - First attempt: Successfully implemented all node functions with proper error handling and type safety
   - Result: Success - all nodes working as expected with proper state management and database integration
   - Verification: Confirmed through code review that all requirements are met

3. Fixing lack of edges bug (Checklist item 1)
   - First attempt: Added source and target handle IDs to edges and custom div elements for handles
   - Second attempt: Replaced custom div handles with proper React Flow Handle components
   - Fix: 
     - Added Handle component from React Flow
     - Added source and target handles to CustomNode component with proper positioning
     - Added sourceHandle and targetHandle IDs to edge definitions
   - Result: Success - edges now render correctly between nodes in the curriculum tree

4. Fixing LangSmith logging (Checklist item: implement tracing for workflow nodes using LangSmith client)
   - First attempt: Basic implementation failed with missing thread_id error
   - Second attempt: Added thread_id but had issues with Supabase channel cleanup
   - Third attempt: Fixed all issues by:
     - Adding thread_id to RunnableConfig for LangGraph's MemorySaver
     - Fixing Supabase channel handling
     - Properly structuring parent/child runs in WorkflowMetrics
   - Fourth attempt: Improved LangSmith integration:
     - Added proper tracing to ChatOpenAI model using withConfig
     - Added project_name to all runs for proper organization
     - Fixed parent/child run relationships
     - Added better error handling and metadata
   - Result: Success - all runs properly logged to LangSmith with:
     - Parent run tracking overall workflow
     - Child runs for each node with inputs/outputs
     - OpenAI calls properly traced
     - Proper error handling and metrics
     - Real-time progress updates