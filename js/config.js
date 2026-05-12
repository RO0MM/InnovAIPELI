// INNOV IA PLAY - Configuración Supabase
// 1) Crea tu proyecto en Supabase.
// 2) Copia Project URL y anon/public key.
// 3) Reemplaza estos valores.
// IMPORTANTE: nunca pongas service_role aquí. Ese secreto solo va en Edge Functions.

window.INNOV_CONFIG = {
  APP_NAME: "INNOV IA PLAY",
  SUPABASE_URL: "https://TU-PROYECTO.supabase.co",
  SUPABASE_ANON_KEY: "TU_ANON_PUBLIC_KEY",
  EDGE_PLAYBACK_URL: "https://TU-PROYECTO.supabase.co/functions/v1/playback-url"
};