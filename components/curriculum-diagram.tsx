"use client"

interface CurriculumNode {
  id: string
  source: {
    id: string
    title: string
    url: string
  }
  startTime: number
  endTime: number
  level: number
  index: number
}

interface CurriculumDiagramProps {
  nodes: CurriculumNode[]
}

export default function CurriculumDiagram({ nodes }: CurriculumDiagramProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center space-y-4">
        {nodes.map((node, index) => (
          <div key={node.id} className="flex items-center space-x-2">
            <div className="bg-[#E6F4FF] p-2 rounded">{`Source ${String.fromCharCode(65 + index)}`}</div>
            {index < nodes.length - 1 && (
              <div className="flex items-center">
                <span className="text-2xl">→</span>
                {index === 1 && <div className="ml-2 bg-[#E6F4FF] p-2 rounded">Attention is all...</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

