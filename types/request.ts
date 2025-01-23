export type RequestStatus = "not_accepted" | "not_started" | "in_progress" | "finished"

export type UserRole = "student" | "expert" | "admin"

export interface Source {
  id: string
  title: string
  URL: string
  created_by: string
}

export interface Message {
  id: string
  content: string
  created_at: string
  request_id: string
  sender_id: string
  sender: {
    id: string
    email: string
  }
}

export interface CurriculumNode {
  id: string
  curriculum_id: string
  source_id: string
  start_time: number
  end_time: number
  level: number
  index_in_curriculum: number
  source: Source
}

export interface Request {
  id: string
  student_id: string
  expert_id: string | null
  source_id: string
  content_type: string
  tag: string
  created_at: string
  accepted_at: string | null
  started_at: string | null
  finished_at: string | null
  source: Source | null
  expert: {
    id: string
    email: string
  } | null
  student: {
    id: string
    email: string
  }
  curriculum?: {
    id: string
    curriculum_nodes: CurriculumNode[]
  }
  messages?: Message[]
} 