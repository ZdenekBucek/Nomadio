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
export type TripArchiveResult = "archived" | "already_archived";
export type TripRestoreResult = "restored" | "not_archived";
export type TripDeletionResult = "deleted" | "name_mismatch";
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
export type ItineraryDayStatus = "plan" | "confirmed" | "completed";
export type ItineraryItemType = "activity" | "transport" | "note";
export type PlaceCategory = "accommodation" | "sight" | "activity" | "food" | "transport" | "shopping" | "nature" | "charging" | "custom";

export type ItineraryDayRow = {
  city: string | null;
  created_at: string;
  created_by: string;
  day_date: string | null;
  id: string;
  is_reserve: boolean;
  name: string;
  sort_order: number | null;
  status: ItineraryDayStatus;
  trip_id: string;
  updated_at: string;
};

export type ItineraryItemRow = {
  created_at: string;
  created_by: string;
  day_id: string;
  end_time: string | null;
  id: string;
  item_type: ItineraryItemType;
  notes: string | null;
  place_id: string | null;
  sort_order: number;
  start_time: string | null;
  title: string;
  updated_at: string;
};

export type TripPlaceRow = {
  address: string | null;
  attribution: string | null;
  category: PlaceCategory;
  category_overridden: boolean;
  city: string | null;
  country_code: string | null;
  created_at: string;
  created_by: string;
  id: string;
  latitude: number | null;
  longitude: number | null;
  name: string;
  provider: string;
  provider_category: string | null;
  provider_place_id: string | null;
  trip_id: string;
  updated_at: string;
};

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
  status_before_archive: TripStatus | null;
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
      itinerary_days: {
        Row: ItineraryDayRow;
        Insert: {
          city?: string | null;
          created_at?: string;
          created_by: string;
          day_date?: string | null;
          id?: string;
          is_reserve?: boolean;
          name: string;
          sort_order?: number | null;
          status?: ItineraryDayStatus;
          trip_id: string;
          updated_at?: string;
        };
        Update: Partial<ItineraryDayRow>;
        Relationships: [];
      };
      itinerary_items: {
        Row: ItineraryItemRow;
        Insert: {
          created_at?: string;
          created_by: string;
          day_id: string;
          end_time?: string | null;
          id?: string;
          item_type: ItineraryItemType;
          notes?: string | null;
          place_id?: string | null;
          sort_order?: number;
          start_time?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: Partial<ItineraryItemRow>;
        Relationships: [];
      };
      trip_places: {
        Row: TripPlaceRow;
        Insert: {
          address?: string | null;
          attribution?: string | null;
          category: PlaceCategory;
          category_overridden?: boolean;
          city?: string | null;
          country_code?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          provider?: string;
          provider_category?: string | null;
          provider_place_id?: string | null;
          trip_id: string;
          updated_at?: string;
        };
        Update: Partial<TripPlaceRow>;
        Relationships: [];
      };
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
          status_before_archive?: TripStatus | null;
          timezone?: string;
          updated_at?: string;
        };
        Update: Partial<TripRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      add_place_to_itinerary_day: {
        Args: { item_end_time: string | null; item_notes: string | null; item_start_time: string | null; place_address: string | null; place_attribution: string | null; place_category: PlaceCategory; place_city: string | null; place_country_code: string | null; place_latitude: number | null; place_longitude: number | null; place_name: string; place_provider_category: string | null; source_provider: "geoapify" | "manual" | "mapbox"; source_provider_place_id: string | null; suggested_place_category: PlaceCategory; target_day_id: string; target_trip_id: string };
        Returns: string;
      };
      create_itinerary_day: {
        Args: { assigned_date: string | null; day_city: string | null; day_name: string; day_status: ItineraryDayStatus; reserve_day: boolean; target_trip_id: string };
        Returns: string;
      };
      create_itinerary_item: {
        Args: { item_end_time: string | null; item_notes: string | null; item_start_time: string | null; item_title: string; linked_place_id: string | null; new_item_type: ItineraryItemType; target_day_id: string };
        Returns: string;
      };
      create_manual_trip_place: {
        Args: { place_address: string | null; place_category: PlaceCategory; place_city: string | null; place_country_code: string | null; place_latitude: number | null; place_longitude: number | null; place_name: string; target_trip_id: string };
        Returns: string;
      };
      create_mapbox_trip_place: {
        Args: { place_address: string | null; place_category: PlaceCategory; place_city: string | null; place_country_code: string | null; place_latitude: number; place_longitude: number; place_name: string; place_provider_category: string; source_provider_place_id: string; target_trip_id: string };
        Returns: string;
      };
      create_external_trip_place: {
        Args: { place_address: string | null; place_attribution: string; place_category: PlaceCategory; place_city: string | null; place_country_code: string | null; place_latitude: number; place_longitude: number; place_name: string; place_provider_category: string; source_provider: "geoapify" | "mapbox"; source_provider_place_id: string; suggested_place_category: PlaceCategory; target_trip_id: string };
        Returns: string;
      };
      archive_trip: {
        Args: { target_trip_id: string };
        Returns: TripArchiveResult;
      };
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
      delete_trip: {
        Args: {
          confirmation_name: string;
          target_trip_id: string;
        };
        Returns: TripDeletionResult;
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
      move_undated_itinerary_day: {
        Args: { direction: number; target_day_id: string };
        Returns: "moved" | "boundary" | "dated";
      };
      move_itinerary_item: {
        Args: { direction: number; target_item_id: string };
        Returns: "moved" | "boundary";
      };
      move_itinerary_item_to_day: {
        Args: { target_day_id: string; target_item_id: string };
        Returns: "moved";
      };
      remove_itinerary_item: {
        Args: { target_item_id: string };
        Returns: "removed";
      };
      remove_trip_place: {
        Args: { target_place_id: string };
        Returns: "removed" | "in_use";
      };
      remove_itinerary_day: {
        Args: { target_day_id: string };
        Returns: "removed";
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
      restore_trip: {
        Args: { target_trip_id: string };
        Returns: TripRestoreResult;
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
      update_itinerary_day: {
        Args: { assigned_date: string | null; day_city: string | null; day_name: string; day_status: ItineraryDayStatus; reserve_day: boolean; target_day_id: string };
        Returns: "updated";
      };
      update_itinerary_item: {
        Args: { item_end_time: string | null; item_notes: string | null; item_start_time: string | null; item_title: string; linked_place_id: string | null; new_item_type: ItineraryItemType; target_item_id: string };
        Returns: "updated";
      };
      update_manual_trip_place: {
        Args: { place_address: string | null; place_category: PlaceCategory; place_city: string | null; place_country_code: string | null; place_latitude: number | null; place_longitude: number | null; place_name: string; target_place_id: string };
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
      itinerary_day_status: ItineraryDayStatus;
      itinerary_item_type: ItineraryItemType;
      place_category: PlaceCategory;
      continent_code: ContinentCode;
      trip_cover_kind: TripCoverKind;
      trip_member_role: TripMemberRole;
      trip_status: TripStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
