export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      daily_progress_logs: {
        Row: {
          created_at: string
          id: string
          is_note_shared: boolean
          log_date: string
          note: string | null
          updated_at: string
          user_id: string
          value_added: number
          weekly_task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_note_shared?: boolean
          log_date?: string
          note?: string | null
          updated_at?: string
          user_id: string
          value_added: number
          weekly_task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_note_shared?: boolean
          log_date?: string
          note?: string | null
          updated_at?: string
          user_id?: string
          value_added?: number
          weekly_task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_progress_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_progress_logs_weekly_task_id_fkey"
            columns: ["weekly_task_id"]
            isOneToOne: false
            referencedRelation: "weekly_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          progress_pct: number
          status: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          progress_pct?: number
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          progress_pct?: number
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          invite_code: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          invite_code: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_goals: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          goal_id: string
          id: string
          month_start: string
          progress_pct: number
          status: string
          target_unit: string | null
          target_value: number | null
          title: string
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          goal_id: string
          id?: string
          month_start: string
          progress_pct?: number
          status?: string
          target_unit?: string | null
          target_value?: number | null
          title: string
          updated_at?: string
          user_id: string
          weight?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          goal_id?: string
          id?: string
          month_start?: string
          progress_pct?: number
          status?: string
          target_unit?: string | null
          target_value?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          timezone: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          timezone?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          timezone?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          consistency_score: number
          created_at: string
          discipline_score: number
          effort_score: number
          group_id: string
          id: string
          note: string | null
          ratee_id: string
          rater_id: string
          week_start: string
        }
        Insert: {
          consistency_score: number
          created_at?: string
          discipline_score: number
          effort_score: number
          group_id: string
          id?: string
          note?: string | null
          ratee_id: string
          rater_id: string
          week_start: string
        }
        Update: {
          consistency_score?: number
          created_at?: string
          discipline_score?: number
          effort_score?: number
          group_id?: string
          id?: string
          note?: string | null
          ratee_id?: string
          rater_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_ratee_id_fkey"
            columns: ["ratee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_goal_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rater_id: string
          rating: number
          updated_at: string
          weekly_task_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rater_id: string
          rating: number
          updated_at?: string
          weekly_task_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rater_id?: string
          rating?: number
          updated_at?: string
          weekly_task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_goal_ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_goal_ratings_weekly_task_id_fkey"
            columns: ["weekly_task_id"]
            isOneToOne: false
            referencedRelation: "weekly_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_tasks: {
        Row: {
          category: string | null
          created_at: string
          current_value: number
          description: string | null
          due_date: string | null
          goal_id: string | null
          group_id: string | null
          id: string
          monthly_goal_id: string | null
          priority: string
          progress: number
          reflection: string | null
          status: string
          target_unit: string | null
          target_value: number | null
          title: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_value?: number
          description?: string | null
          due_date?: string | null
          goal_id?: string | null
          group_id?: string | null
          id?: string
          monthly_goal_id?: string | null
          priority?: string
          progress?: number
          reflection?: string | null
          status?: string
          target_unit?: string | null
          target_value?: number | null
          title: string
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_value?: number
          description?: string | null
          due_date?: string | null
          goal_id?: string | null
          group_id?: string | null
          id?: string
          monthly_goal_id?: string | null
          priority?: string
          progress?: number
          reflection?: string | null
          status?: string
          target_unit?: string | null
          target_value?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_tasks_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_tasks_monthly_goal_id_fkey"
            columns: ["monthly_goal_id"]
            isOneToOne: false
            referencedRelation: "monthly_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_group_with_owner: {
        Args: { p_description?: string; p_name: string }
        Returns: Json
      }
      generate_invite_code: { Args: never; Returns: string }
      get_shared_progress_logs: {
        Args: { p_weekly_task_id: string }
        Returns: {
          created_at: string
          id: string
          is_note_shared: boolean
          log_date: string
          note: string
          value_added: number
        }[]
      }
      get_week_lock_time: { Args: { w: string }; Returns: string }
      is_group_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      is_group_owner: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      is_week_locked: { Args: { w: string }; Returns: boolean }
      join_group_by_invite: { Args: { p_invite_code: string }; Returns: string }
      recalculate_goal_progress: {
        Args: { p_goal_id: string }
        Returns: undefined
      }
      recalculate_monthly_goal_progress: {
        Args: { p_monthly_goal_id: string }
        Returns: undefined
      }
      recalculate_weekly_task_progress: {
        Args: { p_weekly_task_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
