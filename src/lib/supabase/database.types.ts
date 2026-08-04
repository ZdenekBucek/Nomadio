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

export type TripMemberRole = "owner" | "editor" | "viewer";

export type TripRow = {
  cities: string[];
  continent: string | null;
  countries: string[];
  cover_url: string | null;
  created_at: string;
  created_by: string;
  currency: string;
  end_date: string | null;
  id: string;
  name: string;
  start_date: string | null;
  updated_at: string;
};

export type TripMemberRow = {
  created_at: string;
  role: TripMemberRole;
  trip_id: string;
  user_id: string;
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
      trip_members: {
        Row: TripMemberRow;
        Insert: {
          created_at?: string;
          role: TripMemberRole;
          trip_id: string;
          user_id: string;
        };
        Update: Partial<TripMemberRow>;
        Relationships: [];
      };
      trips: {
        Row: TripRow;
        Insert: {
          cities?: string[];
          continent?: string | null;
          countries?: string[];
          cover_url?: string | null;
          created_at?: string;
          created_by: string;
          currency?: string;
          end_date?: string | null;
          id?: string;
          name: string;
          start_date?: string | null;
          updated_at?: string;
        };
        Update: Partial<TripRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      trip_role: {
        Args: { target_trip_id: string };
        Returns: TripMemberRole | null;
      };
    };
    Enums: {
      trip_member_role: TripMemberRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
