"use client"

import { useCallback, useMemo } from "react"
import ReactFlow, {
  Node,
  Edge,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
  Handle,
} from "reactflow"
import "reactflow/dist/style.css"
import type { CurriculumNode } from "@/types/request"

interface CurriculumTreeProps {
  nodes: CurriculumNode[]
}

// Define node types outside of component to prevent recreation
function CustomNode({ data }: { data: { title: string; URL: string } }) {
  return (
    <div 
      className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50"
      onClick={() => window.open(data.URL, '_blank')}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-handle"
        style={{ background: '#555' }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-handle"
        style={{ background: '#555' }}
      />
      <p className="text-sm font-medium text-gray-900 truncate">{data.title}</p>
    </div>
  );
}

// Define node and edge types outside component to prevent recreation on each render
const nodeTypes = {
  custom: CustomNode
} as const;

const edgeTypes = {} as const;

export default function CurriculumTree({ nodes }: CurriculumTreeProps) {
  // Transform curriculum nodes into React Flow nodes and edges
  const getNodesAndEdges = useCallback(() => {
    const flowNodes: Node[] = nodes.map((node, index) => ({
      id: node.id,
      type: 'custom',
      position: { x: index * 200, y: node.level * 100 },
      data: {
        title: node.source?.title || 'Untitled',
        URL: node.source?.URL || '#'
      }
    }))

    // Create edges between nodes based on their levels
    const flowEdges: Edge[] = []
    for (let i = 0; i < nodes.length - 1; i++) {
      const currentNode = nodes[i]
      const nextNode = nodes[i + 1]
      
      if (nextNode.level > currentNode.level) {
        flowEdges.push({
          id: `${currentNode.id}-${nextNode.id}`,
          source: currentNode.id,
          target: nextNode.id,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        })
      }
    }

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