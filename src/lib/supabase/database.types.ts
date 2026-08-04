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
export type TripStatus =
  | "idea"
  | "planning"
  | "ready"
  | "active"
  | "completed"
  | "archived";
export type ContinentCode =
  | "africa"
  | "antarctica"
  | "asia"
  | "europe"
  | "north_america"
  | "south_america"
  | "oceania";
export type TripCoverKind = "gradient" | "upload" | "remote";
export type TripCoverVariant = "violet" | "ocean" | "sunset" | "forest";

export type TripRow = {
  archived_at: string | null;
  cities: string[];
  continent: string | null;
  countries: string[];
  cover_attribution: string | null;
  cover_kind: TripCoverKind;
  cover_storage_path: string | null;
  cover_url: string | null;
  cover_variant: TripCoverVariant;
  created_at: string;
  created_by: string;
  currency: string;
  description: string | null;
  end_date: string | null;
  id: string;
  name: string;
  start_date: string | null;
  status: TripStatus;
  timezone: string;
  updated_at: string;
};

export type TripDestinationRow = {
  city: string | null;
  continent: ContinentCode | null;
  continent_overridden: boolean;
  country_code: string | null;
  country_name: string | null;
  created_at: string;
  id: string;
  is_primary: boolean;
  sort_order: number;
  trip_id: string;
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
      trip_destinations: {
        Row: TripDestinationRow;
        Insert: {
          city?: string | null;
          continent?: ContinentCode | null;
          continent_overridden?: boolean;
          country_code?: string | null;
          country_name?: string | null;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          sort_order?: number;
          trip_id: string;
          updated_at?: string;
        };
        Update: Partial<TripDestinationRow>;
        Relationships: [];
      };
      trips: {
        Row: TripRow;
        Insert: {
          archived_at?: string | null;
          cities?: string[];
          continent?: string | null;
          countries?: string[];
          cover_attribution?: string | null;
          cover_kind?: TripCoverKind;
          cover_storage_path?: string | null;
          cover_url?: string | null;
          cover_variant?: TripCoverVariant;
          created_at?: string;
          created_by: string;
          currency?: string;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          name: string;
          start_date?: string | null;
          status?: TripStatus;
          timezone?: string;
          updated_at?: string;
        };
        Update: Partial<TripRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_private_trip: {
        Args: {
          destination_city?: string | null;
          destination_continent?: ContinentCode | null;
          destination_continent_overridden?: boolean;
          destination_country_code: string;
          destination_country_name: string;
          trip_cover_variant?: string;
          trip_currency?: string;
          trip_description?: string | null;
          trip_end_date?: string | null;
          trip_name: string;
          trip_start_date?: string | null;
          trip_status?: TripStatus;
          trip_timezone?: string;
        };
        Returns: string;
      };
      trip_role: {
        Args: { target_trip_id: string };
        Returns: TripMemberRole | null;
      };
    };
    Enums: {
      continent_code: ContinentCode;
      trip_cover_kind: TripCoverKind;
      trip_member_role: TripMemberRole;
      trip_status: TripStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
