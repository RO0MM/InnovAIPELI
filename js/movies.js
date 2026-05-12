let MOVIES = [];
let FILTERED = [];
let CURRENT = null;

const content = $("#content");
const searchInput = $("#searchInput");
const hero = {
  bg: $("#heroBg"),
  title: $("#heroTitle"),
  desc: $("#heroDesc"),
  meta: $("#heroMeta"),
  kicker: $("#heroKicker"),
  play: $("#heroPlay"),
  trailer: $("#heroTrailer"),
  info: $("#heroInfo")
};

bindMobileMenu();

if(!guardNoAccess()){
  // redirect
} else if(!requireSetup($("#loadStatus"))){
  bootMovies();
}

$("#logoutBtn")?.addEventListener("click", () => {
  clearSession();
  location.href = "index.html";
});
$("#logoutBtnMob")?.addEventListener("click", () => {
  clearSession();
  location.href = "index.html";
});

async function bootMovies(){
  msg($("#loadStatus"), "Cargando catálogo permitido...", "");
  const s = getSession();
  const { data, error } = await sb.rpc("list_movies_for_session", {
    p_session_id: s.session_id,
    p_session_token: s.session_token
  });

  if(error){
    msg($("#loadStatus"), "⚠️ No se pudo cargar el catálogo. El código puede estar vencido o la configuración RLS no está lista.", "err");
    return;
  }

  MOVIES = data || [];
  FILTERED = MOVIES.slice();

  if(!MOVIES.length){
    renderEmpty("Tu código no tiene películas asignadas.");
    return;
  }

  msg($("#loadStatus"), "", "");
  renderHero(featured(FILTERED));
  renderSections(FILTERED);
}

function featured(list){
  return list.find(m => m.is_featured) || list.find(m => m.is_premiere) || list[0];
}

function renderHero(m){
  if(!m) return;
  CURRENT = m;
  hero.bg.setAttribute("style", bgVar(m,"--hero-bg"));
  hero.title.textContent = m.title;
  hero.desc.textContent = m.description || "Contenido disponible para tu código de acceso.";
  hero.meta.innerHTML = movieMeta(m);
  hero.kicker.textContent = m.is_premiere ? "Estreno destacado" : "Recomendado para ti";
  hero.play.onclick = () => openCinema(m, "video");
  hero.trailer.onclick = () => openCinema(m, "trailer");
  hero.info.onclick = () => openDetail(m);
}

function card(m){
  return `
    <article class="card">
      <div class="poster" style="${posterStyle(m)}">
        <div class="posterTitle">${escapeHtml(m.title)}</div>
      </div>
      <div class="cardBody">
        <h3>${escapeHtml(m.title)}</h3>
        <div class="cardMeta">
          <span>${escapeHtml(m.release_year || "")}</span>
          <span>${escapeHtml(m.quality || "HD")}</span>
          ${m.is_premiere ? "<span>Estreno</span>" : ""}
        </div>
        <div class="cardActions">
          <button class="btn accent smallBtn" onclick="openById('${m.id}','video')">Ver</button>
          <button class="btn dark icon" onclick="openDetailById('${m.id}')">ⓘ</button>
          <button class="btn dark icon" onclick="favAndRefresh('${m.id}')">${isFav(m.id) ? "★" : "☆"}</button>
        </div>
      </div>
    </article>
  `;
}

function renderSections(list){
  if(!list.length){
    renderEmpty("No se encontraron resultados.");
    return;
  }

  const premieres = list.filter(m => m.is_premiere);
  const favs = list.filter(m => isFav(m.id));
  const cats = [...new Set(list.map(m => m.category || "General"))];

  let html = "";

  if(premieres.length){
    html += `
      <section class="section" id="estrenos">
        <div class="sectionHead">
          <h2>🔥 Estrenos</h2>
          <span class="small muted">${premieres.length} títulos</span>
        </div>
        <div class="rowCards">${premieres.map(card).join("")}</div>
      </section>
    `;
  }

  if(favs.length){
    html += `
      <section class="section" id="favoritos">
        <div class="sectionHead">
          <h2>⭐ Mis favoritos</h2>
          <span class="small muted">${favs.length} guardados en este equipo</span>
        </div>
        <div class="rowCards">${favs.map(card).join("")}</div>
      </section>
    `;
  }

  html += `
    <section class="section" id="todo">
      <div class="sectionHead">
        <h2>🎬 Todo el catálogo</h2>
        <span class="small muted">${list.length} disponibles</span>
      </div>
      <div class="gridCards">${list.map(card).join("")}</div>
    </section>
  `;

  cats.forEach(cat => {
    const row = list.filter(m => (m.category || "General") === cat);
    html += `
      <section class="section" id="${escapeHtml(cat).toLowerCase()}">
        <div class="sectionHead">
          <h2>${escapeHtml(cat)}</h2>
          <span class="small muted">${row.length} títulos</span>
        </div>
        <div class="rowCards">${row.map(card).join("")}</div>
      </section>
    `;
  });

  content.innerHTML = html;
}

function renderEmpty(text){
  content.innerHTML = `<section class="section"><div class="empty">${escapeHtml(text)}</div></section>`;
}

function filterByKind(kind){
  $all("[data-kind]").forEach(x => x.classList.toggle("active", x.dataset.kind === kind));
  if(kind === "all") FILTERED = MOVIES.slice();
  else if(kind === "favorites") FILTERED = MOVIES.filter(m => isFav(m.id));
  else FILTERED = MOVIES.filter(m => String(m.kind || "").toLowerCase() === kind);
  const q = searchInput.value.trim().toLowerCase();
  if(q) FILTERED = FILTERED.filter(matchSearch(q));
  renderHero(featured(FILTERED));
  renderSections(FILTERED);
}

function matchSearch(q){
  return (m) => [m.title,m.description,m.category,m.kind,m.release_year,m.quality]
    .join(" ").toLowerCase().includes(q);
}

searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  FILTERED = q ? MOVIES.filter(matchSearch(q)) : MOVIES.slice();
  renderHero(featured(FILTERED));
  renderSections(FILTERED);
});

function openById(id, type){
  const m = MOVIES.find(x => x.id === id);
  if(m) openCinema(m, type);
}

async function openCinema(m, type="video"){
  const s = getSession();
  $("#cinemaTitle").textContent = `${m.title}${type === "trailer" ? " — Tráiler" : ""}`;
  $("#player").src = "";
  $("#cinema").classList.add("show");
  document.body.classList.add("lock");
  $("#playerStatus").textContent = "Preparando reproducción segura...";

  try{
    const { data: authData } = await sb.auth.getSession();
    const anonToken = authData?.session?.access_token || CFG.SUPABASE_ANON_KEY;

    const res = await fetch(CFG.EDGE_PLAYBACK_URL, {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${anonToken}`,
        "apikey": CFG.SUPABASE_ANON_KEY
      },
      body:JSON.stringify({
        session_id: s.session_id,
        session_token: s.session_token,
        movie_id: m.id,
        kind: type
      })
    });

    const out = await res.json();
    if(!res.ok || !out.ok) throw new Error(out.message || "No autorizado.");

    $("#playerStatus").textContent = "";
    $("#player").src = out.url;
  }catch(err){
    $("#playerStatus").innerHTML = `⚠️ ${escapeHtml(err.message || "No se pudo reproducir.")}`;
  }
}

function closeCinema(){
  $("#player").src = "";
  $("#cinema").classList.remove("show");
  document.body.classList.remove("lock");
}
function fullscreenVideo(){
  const box = $("#videoBox");
  if(box.requestFullscreen) box.requestFullscreen();
}

function openDetailById(id){
  const m = MOVIES.find(x => x.id === id);
  if(m) openDetail(m);
}
function openDetail(m){
  $("#detailBanner").setAttribute("style", bgVar(m,"--detail-bg"));
  $("#detailTitle").textContent = m.title;
  $("#detailMeta").innerHTML = movieMeta(m);
  $("#detailDesc").textContent = m.description || "";
  $("#detailPlay").onclick = () => { closeDetail(); openCinema(m,"video"); };
  $("#detailTrailer").onclick = () => { closeDetail(); openCinema(m,"trailer"); };
  $("#detailFav").textContent = isFav(m.id) ? "★ Favorito" : "☆ Favorito";
  $("#detailFav").onclick = () => { toggleFav(m.id); openDetail(m); renderSections(FILTERED); };
  $("#detailModal").classList.add("show");
  document.body.classList.add("lock");
}
function closeDetail(){
  $("#detailModal").classList.remove("show");
  document.body.classList.remove("lock");
}
function favAndRefresh(id){
  toggleFav(id);
  renderSections(FILTERED);
}

document.addEventListener("keydown", e => {
  if(e.key === "Escape"){
    closeCinema();
    closeDetail();
  }
});
