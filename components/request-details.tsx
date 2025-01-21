"use client"

interface RequestDetailsProps {
  source: string
  tag: string
  requestType: string
  timeElapsed: string
  positionInLine: string | null
  status: string
  expertAssigned: string
}

export default function RequestDetails({
  source,
  tag,
  requestType,
  timeElapsed,
  positionInLine,
  status,
  expertAssigned,
}: RequestDetailsProps) {
  return (
    <div className="bg-[#E6F4FF] p-4 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <div className="text-sm font-medium">Source</div>
        <div>{source}</div>
      </div>
      <div>
        <div className="text-sm font-medium">Tag</div>
        <div>{tag}</div>
      </div>
      <div>
        <div className="text-sm font-medium">Request Type</div>
        <div>{requestType}</div>
      </div>
      <div>
        <div className="text-sm font-medium">Time Elapsed</div>
        <div>{timeElapsed}</div>
      </div>
      <div>
        <div className="text-sm font-medium">Position in Line</div>
        <div>{positionInLine || "N/A"}</div>
      </div>
      <div>
        <div className="text-sm font-medium">Status</div>
        <div>{status}</div>
      </div>
      <div>
        <div className="text-sm font-medium">Expert Assigned</div>
        <div>{expertAssigned}</div>
      </div>
    </div>
  )
}

