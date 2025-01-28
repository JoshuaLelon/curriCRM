declare module '@/lib/supabase' {
  import { SupabaseClient } from '@supabase/supabase-js'
  export const supabase: SupabaseClient
}

declare module '@/lib/workflows/ai-runner' {
  export function runAIWorkflow(requestId: string): Promise<void>
}

declare module '@/lib/workflows/ai-nodes' {
  import type { WorkflowState } from '@/lib/workflows/types'
  
  type NodeFunction = (state: WorkflowState) => Promise<Partial<WorkflowState>>
  
  export const gatherContextNode: NodeFunction
  export const planNode: NodeFunction
  export const resourceSearchNode: NodeFunction
  export const buildCurriculumNode: NodeFunction
} 