import { PlaceAutocomplete } from "./place-autocomplete";

export function PlaceSearch({
  configured,
  mapAccessToken,
  tripId,
}: {
  configured: boolean;
  mapAccessToken: string | null;
  tripId: string;
}) {
  return <PlaceAutocomplete configured={configured} context={{ kind: "saved", tripId }} mapAccessToken={mapAccessToken} />;
}
