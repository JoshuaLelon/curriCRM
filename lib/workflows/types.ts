import { Annotation } from '@langchain/langgraph'

// Define our workflow state structure
export const WorkflowAnnotation = Annotation.Root({
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
    value: (x: Record<string, { title: string; url: string }[]>) => x,
    default: () => ({}),
  }),
})

// Export the state type for use in other files
export type WorkflowState = typeof WorkflowAnnotation.State

// Export the update type for use in node functions
export type WorkflowStateUpdate = typeof WorkflowAnnotation.Update

export interface WorkflowEvent {
  nodeName: string
  state: WorkflowState
}

export type NodeFunction = (state: WorkflowState) => Promise<WorkflowStateUpdate>

export type WorkflowGraph = StateGraph<WorkflowState, WorkflowStateUpdate> 