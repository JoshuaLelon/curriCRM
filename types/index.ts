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

export interface Request {
  id: string
  created_at: string
  accepted_at: string | null
  started_at: string | null
  finished_at: string | null
  source_id: string | null
  start_time: number | null
  end_time: number | null
  content_type: ContentType
  tag: Tag
  student_id: number
  expert_id: number | null
  
  // Joined fields
  source?: Source | null
  student?: Profile
  expert?: Profile
}

export interface Message {
  id: number
  request_id: string
  content: string
  created_at: string
  sender_id: number
  
  // Joined fields
  sender?: Profile
}

export interface Curriculum {
  id: string
  created_at: string
  updated_at: string
  request_id: string
}

export interface CurriculumNode {
  id: string
  curriculum_id: string
  source_id: string
  created_at: string
  start_time: number
  end_time: number
  level: number
  index_in_curriculum: number
  
  // Joined fields
  source?: Source
} 