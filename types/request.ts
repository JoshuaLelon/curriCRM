export type RequestStatus = "not_accepted" | "not_started" | "in_progress" | "finished"
export type UserRole = "student" | "expert" | "admin"
export type Tag = 'math' | 'software' | 'ai'
export type ContentType = 'tutorial' | 'explanation' | 'how_to_guide' | 'reference'

export interface Profile {
  id: number
  user_id: string
  email: string
  specialty: Tag | null
  is_admin: boolean
  created_at: string
}

export interface Source {
  id: string
  title: string
  URL: string
  created_by: number
  created_at: string
}

export interface Message {
  id: number
  content: string
  created_at: string
  request_id: string
  sender_id: number
  sender?: Profile
}

export interface CurriculumNode {
  id: string
  curriculum_id: string
  source_id: string
  start_time: number
  end_time: number
  level: number
  index_in_curriculum: number
  created_at: string
  source?: Source
}

export interface Request {
  id: string
  student_id: number
  expert_id: number | null
  source_id: string | null
  content_type: ContentType
  tag: Tag
  created_at: string
  accepted_at: string | null
  started_at: string | null
  finished_at: string | null
  start_time: number | null
  end_time: number | null
  source?: Source | null
  expert?: Profile | null
  student?: Profile
  curriculum?: {
    id: string
    curriculum_nodes: CurriculumNode[]
  }
  messages?: Message[]
} 