export interface VehicleBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GpsLocation {
  lat: number;
  lng: number;
  accuracy_meters: number;
}

export interface EvidenceFile {
  id: number;
  event_id: string;
  evidence_type: string;
  mime_type: string;
  url: string;
}

export interface EventDetail {
  event_id: string;
  device_id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  roi_id: string;
  track_id: string;
  vehicle_class: string;
  vehicle_box: VehicleBox;
  confidence: number;
  gps_location: GpsLocation | null;
  review_status: string;
  operator_note: string;
  created_at: string;
  reviewed_at: string | null;
  evidence_files: EvidenceFile[];
}

export interface EventListItem {
  event_id: string;
  device_id: string;
  start_time: string;
  duration_seconds: number;
  vehicle_class: string;
  confidence: number;
  review_status: string;
  thumbnail_url: string;
}

export interface EventListResponse {
  items: EventListItem[];
  total: number;
}

export interface OverviewStats {
  total_events_today: number;
  pending_review_count: number;
  confirmed_count: number;
  rejected_count: number;
  online_device_count: number;
  recent_events: EventListItem[];
}

export interface DeviceInfo {
  device_id: string;
  device_name: string;
  app_version: string;
  model_version: string;
  registered_at: string;
  last_seen_at: string;
  battery_level: number;
  thermal_state: string;
  fps: number;
  pending_upload_count: number;
  is_online: boolean;
}
