"use client"

import { useCallback, useMemo } from "react"
import ReactFlow, {
  Node,
  Edge,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "reactflow"
import "reactflow/dist/style.css"
import type { CurriculumNode } from "@/types/request"

interface CurriculumTreeProps {
  nodes: CurriculumNode[]
}

// Define node types outside of component to prevent recreation
const nodeTypes = {}
const edgeTypes = {}

export default function CurriculumTree({ nodes }: CurriculumTreeProps) {
  // Transform curriculum nodes into React Flow nodes and edges
  const getNodesAndEdges = useCallback(() => {
    const flowNodes: Node[] = []
    const flowEdges: Edge[] = []
    const levelWidths: number[] = []
    const nodesByLevel: { [key: number]: number } = {}

    // First pass: count nodes per level and find max index for each level
    nodes.forEach((node) => {
      nodesByLevel[node.level] = (nodesByLevel[node.level] || 0) + 1
      levelWidths[node.level] = Math.max(levelWidths[node.level] || 0, node.index_in_curriculum)
    })

    // Sort nodes by index to ensure depth-first order
    const sortedNodes = [...nodes].sort((a, b) => a.index_in_curriculum - b.index_in_curriculum)

    // Second pass: create nodes with positions
    sortedNodes.forEach((node) => {
      const level = node.level
      const xSpacing = 300 // Horizontal spacing between branches
      const ySpacing = 100 // Vertical spacing between levels
      
      // Calculate x position based on the index
      // Nodes with sequential indices should be vertically aligned
      const branchIndex = Math.floor(node.index_in_curriculum / 4) // Assuming max depth of 4
      const x = branchIndex * xSpacing

      // Y position is simply based on level
      const y = level * ySpacing

      const nodeData = {
        title: node.source?.title || "Untitled",
        URL: node.source?.URL || "#",
      }

      flowNodes.push({
        id: node.id.toString(),
        position: { x, y },
        data: nodeData,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: {
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "10px",
          width: 200,
        },
      })

      // Create edges based on level and index relationships
      const possibleChildren = sortedNodes.filter(child => 
        child.level === level + 1 && // Next level
        Math.floor(child.index_in_curriculum / 4) === Math.floor(node.index_in_curriculum / 4) // Same branch
      )

      possibleChildren.forEach(child => {
        flowEdges.push({
          id: `${node.id}-${child.id}`,
          source: node.id.toString(),
          target: child.id.toString(),
          type: "smoothstep",
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: { stroke: "#999" },
        })
      })
    })

    return { nodes: flowNodes, edges: flowEdges }
  }, [nodes])

  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => getNodesAndEdges(), [getNodesAndEdges])
  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  return (
    <div className="h-[400px] border rounded-lg">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
      />
    </div>
  )
} 