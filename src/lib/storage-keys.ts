/** Centralized localStorage keys and defaults — single source of truth. */

export const STORAGE_KEYS = {
  CLIENT_ID: "grover_gang_client_id",
  CAMERA_LABEL: "grover_gang_camera_label",
  OBS_WS_IP: "grover_gang_obs_ws_ip",
  OBS_WS_PORT: "grover_gang_obs_ws_port",
  OBS_WS_PASSWORD: "grover_gang_obs_ws_password",
  OBS_WS_TUNNEL_URL: "grover_gang_obs_ws_tunnel_url",
  STREAM_START: "grover_gang_stream_start",
  /** Cached overlay config received via OBS BroadcastCustomEvent */
  OBS_CONFIG_CACHE: "grover_gang_obs_config",
} as const;

export const OBS_DEFAULTS = {
  IP: "localhost",
  PORT: "4455",
} as const;

export const BROADCAST_CHANNELS = {
  ALERTS: "grover-gang-alerts",
  COUNTDOWN: "grover-gang-countdown",
} as const;
