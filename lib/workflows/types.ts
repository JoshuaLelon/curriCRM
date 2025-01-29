import { StateGraph, StateGraphArgs } from '@langchain/langgraph'
import { WorkflowMetrics } from '@/lib/langsmith'

export interface WorkflowState {
  requestId: string
  context: any
  planItems: string[]
  resources: Record<string, { title: string; URL: string }[]>
  __metrics?: WorkflowMetrics
}

export type WorkflowStateUpdate = Partial<WorkflowState>

export const graphState: StateGraphArgs<WorkflowState>["channels"] = {
  requestId: {
    value: (x: string, y?: string) => y ?? x,
    default: () => "",
  },
  context: {
    value: (x: any, y?: any) => y ?? x,
    default: () => null,
  },
  planItems: {
    value: (x: string[], y: string[]) => y,
    default: () => [],
  },
  resources: {
    value: (x: Record<string, { title: string; URL: string }[]>, y: Record<string, { title: string; URL: string }[]>) => y,
    default: () => ({}),
  },
  __metrics: {
    value: (x: WorkflowMetrics | undefined, y?: WorkflowMetrics) => y ?? x,
    default: () => undefined,
  }
}

export interface WorkflowEvent {
  nodeName: string
  state: WorkflowState
}

export type NodeFunction = (state: WorkflowState) => Promise<WorkflowStateUpdate>

export type WorkflowGraph = StateGraph<WorkflowState, WorkflowStateUpdate> 