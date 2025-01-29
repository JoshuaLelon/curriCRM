"use client"

import type { CurriculumNode } from "@/types/request"
import CurriculumTree from "@/components/curriculum-tree"
import CurriculumViewTable from "@/components/request/curriculum-view-table"

interface CurriculumViewProps {
  nodes: CurriculumNode[]
}

export default function CurriculumView({ nodes }: CurriculumViewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card">
        <div className="p-4 font-semibold">Curriculum Tree</div>
        <CurriculumTree nodes={nodes} />
      </div>
      
      <div className="rounded-lg border bg-card">
        <div className="p-4 font-semibold">Curriculum Details</div>
        <CurriculumViewTable nodes={nodes} />
      </div>
    </div>
  )
} 