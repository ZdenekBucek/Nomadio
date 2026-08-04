export type ProfileRow = {
  avatar_url: string | null;
  created_at: string;
  default_currency: string;
  display_name: string | null;
  email: string | null;
  id: string;
  locale: string;
  timezone: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          default_currency?: string;
          display_name?: string | null;
          email?: string | null;
          id: string;
          locale?: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
