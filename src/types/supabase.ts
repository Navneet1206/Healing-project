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
      users: {
        Row: {
          id: string
          email: string
          phone: string
          role: 'user' | 'professional' | 'admin'
          email_verified: boolean
          phone_verified: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          phone: string
          role: 'user' | 'professional' | 'admin'
          email_verified?: boolean
          phone_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string
          role?: 'user' | 'professional' | 'admin'
          email_verified?: boolean
          phone_verified?: boolean
          created_at?: string
        }
      }
      professionals: {
        Row: {
          id: string
          user_id: string
          name: string
          specialization: string
          bio: string
          hourly_rate: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          specialization: string
          bio: string
          hourly_rate: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          specialization?: string
          bio?: string
          hourly_rate?: number
          created_at?: string
        }
      }
      availability: {
        Row: {
          id: string
          professional_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available: boolean
        }
        Insert: {
          id?: string
          professional_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available: boolean
        }
        Update: {
          id?: string
          professional_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_available?: boolean
        }
      }
      appointments: {
        Row: {
          id: string
          user_id: string
          professional_id: string
          date: string
          start_time: string
          end_time: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          professional_id: string
          date: string
          start_time: string
          end_time: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          professional_id?: string
          date?: string
          start_time?: string
          end_time?: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_id?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          appointment_id: string
          user_id: string
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method: string
          transaction_id: string
          created_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          user_id: string
          amount: number
          currency: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method: string
          transaction_id: string
          created_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          user_id?: string
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method?: string
          transaction_id?: string
          created_at?: string
        }
      }
    }
  }
}