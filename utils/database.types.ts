export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          specialty: "math" | "software" | "ai" | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          specialty?: "math" | "software" | "ai" | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          specialty?: "math" | "software" | "ai" | null
          created_at?: string
        }
      }
      sources: {
        Row: {
          id: string
          url: string
          title: string
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          url: string
          title: string
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          url?: string
          title?: string
          created_at?: string
          created_by?: string
        }
      }
      requests: {
        Row: {
          id: string
          student_id: string
          expert_id: string
          source_id: string
          start_time: number
          end_time: number
          status: "not_accepted" | "not_started" | "in_progress" | "finished"
          type: "tutorial" | "explanation" | "how_to_guide" | "reference"
          tag: "math" | "software" | "ai"
          created_at: string
          accepted_at: string | null
          started_at: string | null
          finished_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          expert_id: string
          source_id: string
          start_time: number
          end_time: number
          status?: "not_accepted" | "not_started" | "in_progress" | "finished"
          type: "tutorial" | "explanation" | "how_to_guide" | "reference"
          tag: "math" | "software" | "ai"
          created_at?: string
          accepted_at?: string | null
          started_at?: string | null
          finished_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          expert_id?: string
          source_id?: string
          start_time?: number
          end_time?: number
          status?: "not_accepted" | "not_started" | "in_progress" | "finished"
          type?: "tutorial" | "explanation" | "how_to_guide" | "reference"
          tag?: "math" | "software" | "ai"
          created_at?: string
          accepted_at?: string | null
          started_at?: string | null
          finished_at?: string | null
        }
      }
      curriculums: {
        Row: {
          id: string
          request_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          request_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          request_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      curriculum_nodes: {
        Row: {
          id: string
          curriculum_id: string
          source_id: string
          start_time: number
          end_time: number
          level: number
          index_in_curriculum: number
          created_at: string
        }
        Insert: {
          id?: string
          curriculum_id: string
          source_id: string
          start_time: number
          end_time: number
          level: number
          index_in_curriculum: number
          created_at?: string
        }
        Update: {
          id?: string
          curriculum_id?: string
          source_id?: string
          start_time?: number
          end_time?: number
          level?: number
          index_in_curriculum?: number
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          request_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
      }
    }
  }
}

