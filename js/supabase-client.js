const CFG = window.INNOV_CONFIG || {};
const SETUP_MISSING =
  !CFG.SUPABASE_URL ||
  !CFG.SUPABASE_ANON_KEY ||
  CFG.SUPABASE_URL.includes("TU-PROYECTO") ||
  CFG.SUPABASE_ANON_KEY.includes("TU_ANON");

const sb = SETUP_MISSING ? null : window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

const SESSION_KEY = "innov_ia_play_session_v1";
const FAV_KEY = "innov_ia_play_favorites_v1";

function $(q, root=document){ return root.querySelector(q); }
function $all(q, root=document){ return [...root.querySelectorAll(q)]; }
function escapeHtml(str){
  return String(str ?? "").replace(/[&<>"']/g, s => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[s]));
}
function msg(el, text, type=""){
  if(!el) return;
  el.innerHTML = text ? `<div class="alert ${type}">${text}</div>` : "";
}
function requireSetup(target){
  if(!SETUP_MISSING) return false;
  msg(target, "⚠️ Falta configurar Supabase en <b>js/config.js</b>. Coloca tu Project URL, anon key y Edge Function URL.", "warn");
  return true;
}
function setSession(session){
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
function getSession(){
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch(e){ return null; }
}
function clearSession(){
  localStorage.removeItem(SESSION_KEY);
}
function getFavs(){
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); }
  catch(e){ return []; }
}
function saveFavs(ids){
  localStorage.setItem(FAV_KEY, JSON.stringify([...new Set(ids)]));
}
function isFav(id){ return getFavs().includes(id); }
function toggleFav(id){
  const favs = getFavs();
  if(favs.includes(id)) saveFavs(favs.filter(x => x !== id));
  else saveFavs([...favs, id]);
}
function gradientFromText(text){
  let hash = 0;
  for(let i=0;i<String(text).length;i++) hash = String(text).charCodeAt(i) + ((hash << 5) - hash);
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 64) % 360;
  return `linear-gradient(135deg, hsl(${h1} 78% 28%), hsl(${h2} 72% 15%))`;
}
function posterStyle(m){
  if(m.poster_url) return `background-image:linear-gradient(180deg,rgba(255,255,255,.06),rgba(0,0,0,.28)),url('${String(m.poster_url).replace(/'/g,"%27")}')`;
  return `background:${gradientFromText(m.title || "INNOV IA")}`;
}
function bgVar(m, name="--hero-bg"){
  if(m.banner_url) return `${name}:url('${String(m.banner_url).replace(/'/g,"%27")}')`;
  return `${name}:${gradientFromText((m.title || "INNOV IA") + "banner")}`;
}
function movieMeta(m){
  return `
    <span class="badge blue">${escapeHtml(m.kind || "Película")}</span>
    <span class="badge">${escapeHtml(m.release_year || "2026")}</span>
    <span class="badge">${escapeHtml(m.duration || "HD")}</span>
    <span class="badge">${escapeHtml(m.quality || "HD")}</span>
    ${m.is_premiere ? '<span class="badge red">Estreno</span>' : ''}
  `;
}
function bindMobileMenu(){
  const btn = $("#mobileToggle");
  const menu = $("#mobileMenu");
  if(btn && menu) btn.addEventListener("click", () => menu.classList.toggle("show"));
}
function guardNoAccess(){
  const s = getSession();
  if(!s || !s.session_id || !s.session_token){
    location.href = "index.html";
    return false;
  }
  return true;
}
function copyText(text){
  return navigator.clipboard?.writeText(text).catch(()=>false);
}
function normalizeCode(code){
  return String(code || "").trim().replace(/\s+/g,"").toUpperCase();
}
function randomCode(){
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "INNOV-";
  for(let i=0;i<10;i++){
    if(i===5) out += "-";
    out += chars[Math.floor(Math.random()*chars.length)];
  }
  return out;
}
function todayPlus(days){
  const d = new Date();
  d.setDate(d.getDate()+days);
  return d.toISOString().slice(0,10);
}