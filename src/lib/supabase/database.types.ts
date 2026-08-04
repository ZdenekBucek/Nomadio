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
export type TripShareResult = "added" | "already_member" | "user_not_found";
export type TripMemberRoleUpdateResult = "updated" | "no_change" | "member_not_found";
export type TripMemberRemovalResult = "removed" | "member_not_found";
export type TripDestinationMoveResult = "moved" | "boundary";
export type TripDestinationRemovalResult =
  | "removed"
  | "last_destination"
  | "primary_destination";
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

export type TripMemberProfileRow = Omit<TripMemberRow, "trip_id"> & {
  avatar_url: string | null;
  display_name: string | null;
  email: string | null;
};

export type TripTravelerRow = {
  avatar_url: string | null;
  contact: string | null;
  created_at: string;
  created_by: string;
  display_name: string;
  id: string;
  sort_order: number;
  trip_id: string;
  updated_at: string;
  user_id: string | null;
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
      trip_travelers: {
        Row: TripTravelerRow;
        Insert: {
          avatar_url?: string | null;
          contact?: string | null;
          created_at?: string;
          created_by: string;
          display_name: string;
          id?: string;
          sort_order?: number;
          trip_id: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: Partial<TripTravelerRow>;
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
      add_trip_member_by_email: {
        Args: {
          target_email: string;
          target_role: TripMemberRole;
          target_trip_id: string;
        };
        Returns: TripShareResult;
      };
      add_trip_destination: {
        Args: {
          destination_city: string | null;
          destination_continent: ContinentCode;
          destination_continent_overridden: boolean;
          destination_country_code: string;
          destination_country_name: string;
          target_trip_id: string;
        };
        Returns: string;
      };
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
          traveler_names?: string[];
        };
        Returns: string;
      };
      list_trip_members: {
        Args: { target_trip_id: string };
        Returns: TripMemberProfileRow[];
      };
      move_trip_destination: {
        Args: {
          direction: number;
          target_destination_id: string;
        };
        Returns: TripDestinationMoveResult;
      };
      remove_trip_destination: {
        Args: { target_destination_id: string };
        Returns: TripDestinationRemovalResult;
      };
      remove_trip_member: {
        Args: {
          target_trip_id: string;
          target_user_id: string;
        };
        Returns: TripMemberRemovalResult;
      };
      trip_role: {
        Args: { target_trip_id: string };
        Returns: TripMemberRole | null;
      };
      set_primary_trip_destination: {
        Args: { target_destination_id: string };
        Returns: "updated" | "no_change";
      };
      update_trip_destination: {
        Args: {
          destination_city: string | null;
          destination_continent: ContinentCode;
          destination_continent_overridden: boolean;
          destination_country_code: string;
          destination_country_name: string;
          target_destination_id: string;
        };
        Returns: "updated";
      };
      update_trip_settings: {
        Args: {
          target_trip_id: string;
          trip_cover_variant: string;
          trip_currency: string;
          trip_description: string | null;
          trip_end_date: string | null;
          trip_name: string;
          trip_start_date: string | null;
          trip_status: TripStatus;
          trip_timezone: string;
        };
        Returns: "updated" | "not_found";
      };
      update_trip_member_role: {
        Args: {
          target_role: TripMemberRole;
          target_trip_id: string;
          target_user_id: string;
        };
        Returns: TripMemberRoleUpdateResult;
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
