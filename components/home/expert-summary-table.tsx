import type { Request, Profile } from "@/types"

interface ExpertSummaryTableProps {
  experts: Profile[]
  requests: Request[]
}

export default function ExpertSummaryTable({ experts, requests }: ExpertSummaryTableProps) {
  console.log('ExpertSummaryTable received experts:', experts)
  console.log('ExpertSummaryTable received requests:', requests)

  // Calculate summary for each expert
  const expertSummaries = experts.map(expert => {
    const expertRequests = requests.filter(r => {
      // Handle potential string values in IDs
      const expertId = typeof expert.id === 'string' ? parseInt(expert.id) : expert.id
      const requestExpertId = typeof r.expert_id === 'string' ? parseInt(r.expert_id) : r.expert_id
      return expertId === requestExpertId
    })
    console.log(`Requests for expert ${expert.email}:`, expertRequests)
    const total = expertRequests.length
    const notStarted = expertRequests.filter(r => !r.started_at && !r.finished_at).length
    const inProgress = expertRequests.filter(r => r.started_at && !r.finished_at).length
    const completed = expertRequests.filter(r => r.finished_at).length
    // Count unassigned requests matching expert's specialty
    const notAccepted = requests.filter(r => !r.expert_id && r.tag === expert.specialty).length

    return {
      expert,
      total,
      notAccepted,
      notStarted,
      inProgress,
      completed
    }
  })

  console.log('Calculated expert summaries:', expertSummaries)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left">Expert</th>
            <th className="px-4 py-2 text-left">Total</th>
            <th className="px-4 py-2 text-left">Not Accepted</th>
            <th className="px-4 py-2 text-left">Not Started</th>
            <th className="px-4 py-2 text-left">In Progress</th>
            <th className="px-4 py-2 text-left">Completed</th>
          </tr>
        </thead>
        <tbody>
          {expertSummaries.map(summary => (
            <tr key={summary.expert.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">{summary.expert.email}</td>
              <td className="px-4 py-2">{summary.total}</td>
              <td className="px-4 py-2">{summary.notAccepted}</td>
              <td className="px-4 py-2">{summary.notStarted}</td>
              <td className="px-4 py-2">{summary.inProgress}</td>
              <td className="px-4 py-2">{summary.completed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 