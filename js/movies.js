async function openCinema(m, type = "video") {
  const s = getSession();

  $("#cinemaTitle").textContent = `${m.title}${type === "trailer" ? " — Tráiler" : ""}`;
  $("#player").src = "";
  $("#cinema").classList.add("show");
  document.body.classList.add("lock");
  $("#playerStatus").textContent = "Preparando reproducción segura...";

  try {
    if (!CFG.EDGE_PLAYBACK_URL) {
      throw new Error("No está configurado EDGE_PLAYBACK_URL.");
    }

    if (!s?.session_id || !s?.session_token) {
      throw new Error("Sesión inválida. Vuelve a ingresar el código.");
    }

    const res = await fetch(CFG.EDGE_PLAYBACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": CFG.SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        session_id: s.session_id,
        session_token: s.session_token,
        movie_id: m.id,
        kind: type
      })
    });

    const raw = await res.text();

    let out = null;

    try {
      out = raw ? JSON.parse(raw) : null;
    } catch (jsonError) {
      throw new Error(raw || "La función no devolvió JSON válido.");
    }

    if (!res.ok || !out?.ok) {
      throw new Error(out?.message || "No autorizado.");
    }

    if (!out.url) {
      throw new Error("La función no devolvió URL de reproducción.");
    }

    $("#playerStatus").textContent = "";
    $("#player").src = out.url;

  } catch (err) {
    console.error("Error al reproducir:", err);
    $("#playerStatus").innerHTML = `⚠️ ${escapeHtml(err.message || "No se pudo reproducir.")}`;
  }
}
