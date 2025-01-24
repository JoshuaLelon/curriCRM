export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: number
          user_id: string
          email: string | null
          created_at: string
          specialty: 'math' | 'software' | 'ai' | null
          is_admin: boolean
        }
        Insert: {
          id?: number
          user_id: string
          email?: string | null
          created_at?: string
          specialty?: 'math' | 'software' | 'ai' | null
          is_admin?: boolean
        }
        Update: {
          id?: number
          user_id?: string
          email?: string | null
          created_at?: string
          specialty?: 'math' | 'software' | 'ai' | null
          is_admin?: boolean
        }
      }
      sources: {
        Row: {
          id: string
          created_at: string
          title: string | null
          URL: string | null
          created_by: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          title?: string | null
          URL?: string | null
          created_by?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string | null
          URL?: string | null
          created_by?: number | null
        }
      }
      requests: {
        Row: {
          id: string
          created_at: string
          accepted_at: string | null
          started_at: string | null
          finished_at: string | null
          source_id: string | null
          start_time: number | null
          end_time: number | null
          content_type: 'tutorial' | 'explanation' | 'how_to_guide' | 'reference'
          tag: 'math' | 'software' | 'ai'
          student_id: number | null
          expert_id: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          accepted_at?: string | null
          started_at?: string | null
          finished_at?: string | null
          source_id?: string | null
          start_time?: number | null
          end_time?: number | null
          content_type: 'tutorial' | 'explanation' | 'how_to_guide' | 'reference'
          tag: 'math' | 'software' | 'ai'
          student_id?: number | null
          expert_id?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          accepted_at?: string | null
          started_at?: string | null
          finished_at?: string | null
          source_id?: string | null
          start_time?: number | null
          end_time?: number | null
          content_type?: 'tutorial' | 'explanation' | 'how_to_guide' | 'reference'
          tag?: 'math' | 'software' | 'ai'
          student_id?: number | null
          expert_id?: number | null
        }
      }
      curriculums: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          request_id: string
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          request_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          request_id?: string
        }
      }
      curriculum_nodes: {
        Row: {
          id: string
          curriculum_id: string
          source_id: string | null
          created_at: string
          start_time: number | null
          end_time: number | null
          level: number | null
          index_in_curriculum: number | null
        }
        Insert: {
          id: string
          curriculum_id: string
          source_id?: string | null
          created_at?: string
          start_time?: number | null
          end_time?: number | null
          level?: number | null
          index_in_curriculum?: number | null
        }
        Update: {
          id?: string
          curriculum_id?: string
          source_id?: string | null
          created_at?: string
          start_time?: number | null
          end_time?: number | null
          level?: number | null
          index_in_curriculum?: number | null
        }
      }
      messages: {
        Row: {
          id: number
          request_id: string
          content: string | null
          created_at: string
          sender_id: number | null
        }
        Insert: {
          id: number
          request_id: string
          content?: string | null
          created_at?: string
          sender_id?: number | null
        }
        Update: {
          id?: number
          request_id?: string
          content?: string | null
          created_at?: string
          sender_id?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_auth_schema: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_service_role_permissions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_auth_user: {
        Args: { user_email: string }
        Returns: Json
      }
      create_seed_auth_user: {
        Args: {
          user_email: string
          is_admin?: boolean
          user_specialty?: 'math' | 'software' | 'ai' | null
        }
        Returns: string
      }
      create_seed_user: {
        Args: { username: string; password: string }
        Returns: void
      }
      drop_and_recreate_schema: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: Record<string, unknown>
      }
      run_sql: {
        Args: { sql: string }
        Returns: void
      }
      seed_initial_data: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
    }
    Enums: {
      content_type: 'tutorial' | 'explanation' | 'how_to_guide' | 'reference'
      tag: 'math' | 'software' | 'ai'
    }
  }
} 