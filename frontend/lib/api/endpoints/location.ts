import { authFetch } from '../auth-fetch';

export interface LocationAutocompleteItem {
  id: string;
  label: string;
  secondary_label?: string;
  latitude: number;
  longitude: number;
  type: string;
  country?: string;
  country_code?: string;
  state?: string;
  city?: string;
  postcode?: string;
  confidence?: number;
}

export interface ResolvedLocation {
  id: string;
  display_name: string;
  formatted_address?: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  region?: string;
  city?: string;
  district?: string;
  postcode?: string;
  type: string;
  confidence: number;
  provider: string;
  provider_place_id?: string;
  timezone?: string;
  metadata?: Record<string, any>;
}

export interface Coordinate {
  latitude: number;
  longitude: number;
  id?: string;
}

export interface RouteResult {
  distance_meters: number;
  duration_seconds: number;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  legs: Array<{
    distance_meters: number;
    duration_seconds: number;
    steps?: any[];
  }>;
  mode: string;
  provider: string;
  route_hash?: string;
}

export interface RouteMatrixResult {
  cells: Array<{
    source_id: string;
    target_id: string;
    distance_meters: number;
    duration_seconds: number;
    status: string;
  }>;
  sources_count: number;
  targets_count: number;
  provider: string;
}

export interface PlaceItem {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  formatted_address?: string;
  distance_meters?: number;
}

export const locationApi = {
  autocomplete: (q: string, country?: string, limit = 5, lat?: number, lng?: number) => {
    const params = new URLSearchParams({ q, limit: String(limit) });
    if (country) params.append('country', country);
    if (lat !== undefined && lng !== undefined) {
      params.append('lat', String(lat));
      params.append('lng', String(lng));
    }
    return authFetch<LocationAutocompleteItem[]>(`/api/v1/location/autocomplete?${params.toString()}`);
  },

  resolve: (data: { query: string; latitude?: number; longitude?: number; resultType?: string; providerResultId?: string }) =>
    authFetch<ResolvedLocation>('/api/v1/location/resolve', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reverse: (latitude: number, longitude: number, accuracy?: number) =>
    authFetch<ResolvedLocation>('/api/v1/location/reverse', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, accuracy }),
    }),

  calculateRoute: (origin: Coordinate, destination: Coordinate, mode = 'drive', waypoints?: Coordinate[]) =>
    authFetch<RouteResult>('/api/v1/location/route', {
      method: 'POST',
      body: JSON.stringify({ origin, destination, mode, waypoints }),
    }),

  routeMatrix: (sources: Coordinate[], targets: Coordinate[], mode = 'drive') =>
    authFetch<RouteMatrixResult>('/api/v1/location/route-matrix', {
      method: 'POST',
      body: JSON.stringify({ sources, targets, mode }),
    }),

  getPlaces: (lat: number, lng: number, radius = 5000, categories?: string, limit = 20) => {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius: String(radius),
      limit: String(limit),
    });
    if (categories) params.append('categories', categories);
    return authFetch<PlaceItem[]>(`/api/v1/location/places?${params.toString()}`);
  },

  getPlaceDetails: (providerPlaceId: string) =>
    authFetch<Record<string, any>>(`/api/v1/location/place/${providerPlaceId}`),

  getWorkspaceLocations: (workspaceId: string) =>
    authFetch<any[]>(`/api/v1/location/workspaces/${workspaceId}/locations`),

  setWorkspaceLocation: (workspaceId: string, data: { location: ResolvedLocation; label?: string; type?: string; isPrimary?: boolean }) =>
    authFetch<any>(`/api/v1/location/workspaces/${workspaceId}/locations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
