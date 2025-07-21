import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          preferred_area: string | null
          user_type: "champion" | "worker" | "admin"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          preferred_area?: string | null
          user_type: "champion" | "worker" | "admin"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          preferred_area?: string | null
          user_type?: "champion" | "worker" | "admin"
          updated_at?: string
        }
      }
      bag_collections: {
        Row: {
          id: string
          champion_id: string
          location_lat: number
          location_lng: number
          location_name: string
          bag_count: number
          area_cleaned: string
          notes: string | null
          collected: boolean
          collected_by: string | null
          collected_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          champion_id: string
          location_lat: number
          location_lng: number
          location_name: string
          bag_count: number
          area_cleaned: string
          notes?: string | null
          collected?: boolean
          collected_by?: string | null
          collected_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          champion_id?: string
          location_lat?: number
          location_lng?: number
          location_name?: string
          bag_count?: number
          area_cleaned?: string
          notes?: string | null
          collected?: boolean
          collected_by?: string | null
          collected_at?: string | null
        }
      }
      supply_requests: {
        Row: {
          id: string
          champion_id: string
          request_type: "bags" | "gloves" | "both"
          quantity: number
          notes: string | null
          status: "pending" | "approved" | "delivered"
          created_at: string
        }
        Insert: {
          id?: string
          champion_id: string
          request_type: "bags" | "gloves" | "both"
          quantity: number
          notes?: string | null
          status?: "pending" | "approved" | "delivered"
          created_at?: string
        }
        Update: {
          id?: string
          champion_id?: string
          request_type?: "bags" | "gloves" | "both"
          quantity?: number
          notes?: string | null
          status?: "pending" | "approved" | "delivered"
        }
      }
    }
  }
}
