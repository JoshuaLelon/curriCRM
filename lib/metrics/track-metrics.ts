import fs from 'fs'
import path from 'path'

interface WorkflowMetricsRow {
  timestamp: string
  request_id: string
  tag: string
  level: string
  total_duration_ms: number
  gather_context_ms: number
  plan_ms: number
  resource_search_ms: number
  build_ms: number
  num_plan_items: number
  success: boolean
}

export async function trackWorkflowMetrics(metrics: any) {
  const row: WorkflowMetricsRow = {
    timestamp: new Date().toISOString(),
    request_id: metrics.requestId,
    tag: metrics.context?.tag || '',
    level: metrics.context?.level || '',
    total_duration_ms: metrics.totalDuration,
    gather_context_ms: metrics.nodeTimings.gatherContext?.duration || 0,
    plan_ms: metrics.nodeTimings.plan?.duration || 0,
    resource_search_ms: metrics.nodeTimings.resourceSearch?.duration || 0,
    build_ms: metrics.nodeTimings.build?.duration || 0,
    num_plan_items: metrics.planItems?.length || 0,
    success: metrics.success || false
  }

  const csvLine = [
    row.timestamp,
    row.request_id,
    `"${row.tag}"`,
    row.level,
    row.total_duration_ms,
    row.gather_context_ms,
    row.plan_ms,
    row.resource_search_ms,
    row.build_ms,
    row.num_plan_items,
    row.success
  ].join(',') + '\n'

  const metricsPath = path.join(process.cwd(), 'lib', 'metrics', 'workflow-metrics.csv')
  
  // Create directory if it doesn't exist
  const dir = path.dirname(metricsPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Append to CSV file
  await fs.promises.appendFile(metricsPath, csvLine)
} 