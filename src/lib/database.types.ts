// Hand-written to match supabase/schema.sql. If you change the schema, update this file
// too (or later replace it with `supabase gen types typescript` output).

export type TaskPriority = "low" | "medium" | "high";

type NoRelationships = { Relationships: [] };

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          timezone: string;
          notify_time_1: string | null;
          notify_time_2: string | null;
          notify_time_3: string | null;
          notify_time_4: string | null;
          notifications_enabled: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      } & NoRelationships;
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          why: string | null;
          priority: TaskPriority;
          track_time: boolean;
          repeat_daily: boolean;
          scheduled_date: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tasks"]["Row"]> & {
          user_id: string;
          title: string;
          scheduled_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Row"]>;
      } & NoRelationships;
      task_sessions: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          started_at: string;
          ended_at: string | null;
          duration_seconds: number | null;
        };
        Insert: Partial<Database["public"]["Tables"]["task_sessions"]["Row"]> & {
          task_id: string;
          user_id: string;
          started_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["task_sessions"]["Row"]>;
      } & NoRelationships;
      streak_freezes: {
        Row: {
          id: string;
          user_id: string;
          date_used: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["streak_freezes"]["Row"]> & {
          user_id: string;
          date_used: string;
        };
        Update: Partial<Database["public"]["Tables"]["streak_freezes"]["Row"]>;
      } & NoRelationships;
      distractions: {
        Row: {
          id: string;
          user_id: string;
          occurred_at: string;
          note: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["distractions"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["distractions"]["Row"]>;
      } & NoRelationships;
      reflections: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          note: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reflections"]["Row"]> & {
          user_id: string;
          date: string;
          note: string;
        };
        Update: Partial<Database["public"]["Tables"]["reflections"]["Row"]>;
      } & NoRelationships;
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["push_subscriptions"]["Row"]> & {
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Row"]>;
      } & NoRelationships;
      subtasks: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          title: string;
          completed: boolean;
          position: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subtasks"]["Row"]> & {
          task_id: string;
          user_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["subtasks"]["Row"]>;
      } & NoRelationships;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskSession = Database["public"]["Tables"]["task_sessions"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Reflection = Database["public"]["Tables"]["reflections"]["Row"];
export type Distraction = Database["public"]["Tables"]["distractions"]["Row"];
export type Subtask = Database["public"]["Tables"]["subtasks"]["Row"];
