export type ReviewStatus = 'pending' | 'confirmed' | 'rejected';

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

export interface EvidenceSummary {
  has_before: boolean;
  has_peak: boolean;
  has_after: boolean;
  has_video: boolean;
  image_count: number;
  video_count: number;
  is_complete: boolean;
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
  review_status: ReviewStatus;
  operator_note: string;
  created_at: string;
  reviewed_at: string | null;
  evidence_files: EvidenceFile[];
  review_history: ReviewHistoryItem[];
  evidence_summary?: EvidenceSummary;
  risk_level?: 'normal' | 'high';
  review_priority_reason?: string;
  previous_event_id?: string | null;
  next_event_id?: string | null;
}

export interface ReviewHistoryItem {
  id: number;
  event_id: string;
  operator_id: string;
  from_status: ReviewStatus;
  to_status: Exclude<ReviewStatus, 'pending'>;
  operator_note: string;
  reviewed_at: string;
}

export interface EventListItem {
  event_id: string;
  device_id: string;
  start_time: string;
  duration_seconds: number;
  vehicle_class: string;
  confidence: number;
  review_status: ReviewStatus;
  thumbnail_url: string;
  risk_level?: 'normal' | 'high';
  review_priority_reason?: string;
}

export interface EventListResponse {
  items: EventListItem[];
  total: number;
}

export interface BulkReviewResponse {
  requested_count: number;
  updated_count: number;
  missing_event_ids: string[];
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

export interface DeviceIssue {
  severity: 'info' | 'warning' | 'critical';
  code?: string;
  message: string;
  next_action: string;
}

export interface DeviceDetail extends DeviceInfo {
  seconds_since_seen: number;
  issues: DeviceIssue[];
  metric_history: DeviceMetricSnapshot[];
  recent_events: EventListItem[];
}

export interface DeviceMetricSnapshot {
  id: number;
  recorded_at: string;
  battery_level: number;
  thermal_state: string;
  fps: number;
  pending_upload_count: number;
}

export interface SystemIssue {
  severity: 'info' | 'warning' | 'critical';
  code: string;
  message: string;
  next_action: string;
}

export interface SystemStatus {
  status: 'ready' | 'critical';
  server_time: string;
  backend: { status: string };
  database: { status: string; path: string };
  evidence: {
    status: string;
    dir: string;
    file_count: number;
    usage_bytes: number;
    free_bytes: number;
  };
  devices: {
    total: number;
    online: number;
    pending_upload_count: number;
  };
  events: {
    pending_review_count: number;
    latest_event_at: string | null;
  };
  issues: SystemIssue[];
}

export interface RuntimeSettings {
  review_mode: 'manual' | 'strict';
  online_window_seconds: number;
  evidence_retention_days: number;
  require_complete_evidence: boolean;
  device_access_mode: 'open' | 'token';
  updated_at: string;
}

export type RuntimeSettingsUpdate = Omit<RuntimeSettings, 'updated_at'>;
