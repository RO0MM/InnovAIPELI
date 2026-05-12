let ADMIN_MOVIES = [];
let CURRENT_TAB = "movies";

const loginPane = $("#loginAdmin");
const adminPane = $("#adminApp");
const adminMsg = $("#adminMsg");

if(requireSetup(adminMsg)){
  loginPane.classList.remove("hidden");
} else {
  bootAdmin();
}

async function bootAdmin(){
  const { data } = await sb.auth.getUser();
  if(data?.user){
    showAdmin();
  }else{
    showLogin();
  }
}

function showLogin(){
  loginPane.classList.remove("hidden");
  adminPane.classList.add("hidden");
}

async function showAdmin(){
  loginPane.classList.add("hidden");
  adminPane.classList.remove("hidden");
  await loadAdminData();
  renderMoviesTable();
  renderMoviePicker();
  renderCodesTable();
}

$("#adminLoginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg(adminMsg, "Iniciando sesión...", "");
  const email = $("#adminEmail").value.trim();
  const password = $("#adminPassword").value;

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if(error){
    msg(adminMsg, `⚠️ ${escapeHtml(error.message)}`, "err");
    return;
  }
  msg(adminMsg, "✅ Sesión iniciada.", "ok");
  showAdmin();
});

$("#adminLogout")?.addEventListener("click", async () => {
  await sb.auth.signOut();
  location.reload();
});

$all("[data-tab]").forEach(btn => {
  btn.addEventListener("click", () => setTab(btn.dataset.tab));
});

function setTab(tab){
  CURRENT_TAB = tab;
  $all("[data-tab]").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  $("#tabMovies").classList.toggle("hidden", tab !== "movies");
  $("#tabCodes").classList.toggle("hidden", tab !== "codes");
  $("#tabHelp").classList.toggle("hidden", tab !== "help");

  const title = {
    movies:["Películas","Gestiona catálogo, posters, estrenos y links protegidos."],
    codes:["Códigos","Crea accesos con vencimiento y permisos por película."],
    help:["Supabase","Pasos rápidos y estado de conexión."]
  }[tab];

  $("#adminTitle").textContent = title[0];
  $("#adminSubtitle").textContent = title[1];
}

async function loadAdminData(){
  const { data, error } = await sb
    .from("movies")
    .select("id,title,description,poster_url,banner_url,category,kind,release_year,duration,quality,is_premiere,is_featured,is_active,created_at,updated_at")
    .order("created_at", { ascending:false });

  if(error){
    msg($("#adminGlobalMsg"), `⚠️ No se pudo leer películas. Verifica que tu usuario esté en app_admins y que ejecutaste el SQL. ${escapeHtml(error.message)}`, "err");
    ADMIN_MOVIES = [];
    return;
  }

  ADMIN_MOVIES = data || [];
  msg($("#adminGlobalMsg"), "", "");
}

function openMovieForm(id=""){
  const m = ADMIN_MOVIES.find(x => x.id === id);
  $("#movieFormPanel").classList.remove("hidden");
  $("#movieFormTitle").textContent = m ? "Editar película" : "Nueva película";
  $("#movieId").value = m?.id || "";
  $("#mTitle").value = m?.title || "";
  $("#mCategory").value = m?.category || "Estrenos";
  $("#mKind").value = m?.kind || "Película";
  $("#mYear").value = m?.release_year || "2026";
  $("#mDuration").value = m?.duration || "1h 30m";
  $("#mQuality").value = m?.quality || "HD";
  $("#mPoster").value = m?.poster_url || "";
  $("#mBanner").value = m?.banner_url || "";
  $("#mDescription").value = m?.description || "";
  $("#mTrailer").value = "";
  $("#mVideo").value = "";
  $("#mPremiere").checked = !!m?.is_premiere;
  $("#mFeatured").checked = !!m?.is_featured;
  $("#mActive").checked = m ? m.is_active !== false : true;
  scrollTo({top:0, behavior:"smooth"});
}
function closeMovieForm(){
  $("#movieForm").reset();
  $("#movieId").value = "";
  $("#movieFormPanel").classList.add("hidden");
}
$("#openMovieFormBtn")?.addEventListener("click", () => openMovieForm());

$("#movieForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = $("#movieId").value || null;

  const payload = {
    p_id: id,
    p_title: $("#mTitle").value.trim(),
    p_description: $("#mDescription").value.trim(),
    p_poster_url: $("#mPoster").value.trim(),
    p_banner_url: $("#mBanner").value.trim(),
    p_category: $("#mCategory").value.trim() || "General",
    p_kind: $("#mKind").value,
    p_release_year: $("#mYear").value.trim(),
    p_duration: $("#mDuration").value.trim(),
    p_quality: $("#mQuality").value,
    p_is_premiere: $("#mPremiere").checked,
    p_is_featured: $("#mFeatured").checked,
    p_is_active: $("#mActive").checked,
    p_trailer_url: $("#mTrailer").value.trim() || null,
    p_video_url: $("#mVideo").value.trim() || null
  };

  const fn = id ? "admin_update_movie" : "admin_create_movie";
  const { error } = await sb.rpc(fn, payload);
  if(error){
    alert("Error al guardar: " + error.message);
    return;
  }

  closeMovieForm();
  await loadAdminData();
  renderMoviesTable();
  renderMoviePicker();
});

function renderMoviesTable(){
  $("#movieCount").textContent = `${ADMIN_MOVIES.length} registros`;
  if(!ADMIN_MOVIES.length){
    $("#moviesTable").innerHTML = `<div class="empty">No hay películas todavía.</div>`;
    return;
  }

  $("#moviesTable").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Poster</th><th>Título</th><th>Categoría</th><th>Tipo</th><th>Estado</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${ADMIN_MOVIES.map(m => `
          <tr>
            <td><div class="miniPoster" style="${posterStyle(m)}">${escapeHtml((m.title||"").slice(0,7))}</div></td>
            <td><b>${escapeHtml(m.title)}</b><br><span class="small muted">${escapeHtml(m.release_year || "")} · ${escapeHtml(m.quality || "")}</span></td>
            <td>${escapeHtml(m.category || "")}</td>
            <td>${escapeHtml(m.kind || "")}</td>
            <td>
              ${m.is_active ? '<span class="ok">Activo</span>' : '<span class="danger">Inactivo</span>'}
              ${m.is_premiere ? '<br><span class="warn">Estreno</span>' : ''}
              ${m.is_featured ? '<br><span class="ok">Destacado</span>' : ''}
              <br><span class="small muted">Links protegidos</span>
            </td>
            <td>
              <div class="actions">
                <button class="btn dark smallBtn" onclick="openMovieForm('${m.id}')">Editar</button>
                <button class="btn gold smallBtn" onclick="toggleMovie('${m.id}', ${!m.is_active})">${m.is_active ? "Ocultar" : "Activar"}</button>
                <button class="btn dangerBtn smallBtn" onclick="deleteMovie('${m.id}')">Eliminar</button>
              </div>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

async function toggleMovie(id, state){
  const { error } = await sb.from("movies").update({ is_active: state }).eq("id", id);
  if(error) return alert(error.message);
  await loadAdminData();
  renderMoviesTable();
  renderMoviePicker();
}
async function deleteMovie(id){
  if(!confirm("¿Eliminar esta película?")) return;
  const { error } = await sb.from("movies").delete().eq("id", id);
  if(error) return alert(error.message);
  await loadAdminData();
  renderMoviesTable();
  renderMoviePicker();
}

function renderMoviePicker(){
  const box = $("#moviePicker");
  if(!box) return;
  if(!ADMIN_MOVIES.length){
    box.innerHTML = `<div class="small muted">Primero agrega películas.</div>`;
    return;
  }
  box.innerHTML = ADMIN_MOVIES.map(m => `
    <label class="pickItem">
      <input type="checkbox" class="pickMovie" value="${m.id}">
      <span>${escapeHtml(m.title)}</span>
    </label>
  `).join("");
  toggleMoviePicker();
}
function toggleMoviePicker(){
  $("#moviePickerWrap").classList.toggle("hidden", $("#cAllMovies").checked);
}
$("#cAllMovies")?.addEventListener("change", toggleMoviePicker);
$("#generateCodeBtn")?.addEventListener("click", () => $("#cCode").value = randomCode());

function clearCodeForm(){
  $("#codeForm").reset();
  $("#cCode").value = randomCode();
  $("#cExpires").value = todayPlus(30);
  $("#cMaxUses").value = 1;
  $("#cAllMovies").checked = true;
  $("#cActive").checked = true;
  $all(".pickMovie").forEach(x => x.checked = false);
  toggleMoviePicker();
}
$("#clearCodeBtn")?.addEventListener("click", clearCodeForm);

$("#codeForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const code = normalizeCode($("#cCode").value);
  const movieIds = $("#cAllMovies").checked ? [] : $all(".pickMovie:checked").map(x => x.value);

  if(!code) return alert("Genera o escribe un código.");
  if(!$("#cAllMovies").checked && !movieIds.length) return alert("Selecciona al menos una película o marca 'todas'.");

  const { data, error } = await sb.rpc("admin_create_access_code", {
    p_code: code,
    p_note: $("#cNote").value.trim(),
    p_expires_at: $("#cExpires").value ? new Date($("#cExpires").value + "T23:59:59").toISOString() : null,
    p_max_uses: Number($("#cMaxUses").value || 1),
    p_is_active: $("#cActive").checked,
    p_all_movies: $("#cAllMovies").checked,
    p_movie_ids: movieIds
  });

  if(error){
    alert("Error al crear código: " + error.message);
    return;
  }

  $("#codeResult").classList.remove("hidden");
  $("#createdCode").textContent = code;
  await copyText(code);
  clearCodeForm();
  renderCodesTable();
});

$("#copyCreatedCode")?.addEventListener("click", () => copyText($("#createdCode").textContent));

async function renderCodesTable(){
  const { data, error } = await sb
    .from("access_codes")
    .select("id,code_hint,note,expires_at,max_uses,used_count,is_active,all_movies,created_at")
    .order("created_at", {ascending:false});

  if(error){
    $("#codesTable").innerHTML = `<div class="empty">No se pudo cargar códigos: ${escapeHtml(error.message)}</div>`;
    return;
  }

  $("#codeCount").textContent = `${data?.length || 0} códigos`;

  if(!data?.length){
    $("#codesTable").innerHTML = `<div class="empty">No hay códigos creados.</div>`;
    return;
  }

  $("#codesTable").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Código</th><th>Nota</th><th>Vence</th><th>Usos</th><th>Permiso</th><th>Estado</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(c => `
          <tr>
            <td><b>${escapeHtml(c.code_hint || "****")}</b><br><span class="small muted">Hash protegido</span></td>
            <td>${escapeHtml(c.note || "")}</td>
            <td>${escapeHtml(c.expires_at ? new Date(c.expires_at).toLocaleString() : "Sin fecha")}</td>
            <td>${Number(c.used_count || 0)} / ${Number(c.max_uses || 1)}</td>
            <td>${c.all_movies ? "Todas" : "Seleccionadas"}</td>
            <td>${c.is_active ? '<span class="ok">Activo</span>' : '<span class="danger">Inactivo</span>'}</td>
            <td>
              <div class="actions">
                <button class="btn gold smallBtn" onclick="toggleCode('${c.id}', ${!c.is_active})">${c.is_active ? "Desactivar" : "Activar"}</button>
                <button class="btn dangerBtn smallBtn" onclick="deleteCode('${c.id}')">Eliminar</button>
              </div>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}
async function toggleCode(id, state){
  const { error } = await sb.from("access_codes").update({ is_active: state }).eq("id", id);
  if(error) return alert(error.message);
  renderCodesTable();
}
async function deleteCode(id){
  if(!confirm("¿Eliminar este código?")) return;
  const { error } = await sb.from("access_codes").delete().eq("id", id);
  if(error) return alert(error.message);
  renderCodesTable();
}

clearCodeForm();