const form = $("#accessForm");
const codeInput = $("#accessCode");
const statusBox = $("#statusBox");

if(requireSetup(statusBox)){
  // Modo informativo solamente
} else {
  const existing = getSession();
  if(existing?.session_id && existing?.session_token){
    // No redirige solo; deja al usuario decidir.
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg(statusBox, "Validando código...", "");
    const code = normalizeCode(codeInput.value);

    if(!code){
      msg(statusBox, "Escribe tu código de acceso.", "err");
      return;
    }

    const { data, error } = await sb.rpc("redeem_access_code", { p_code: code });

    if(error || !data?.ok){
      msg(statusBox, `⚠️ ${escapeHtml(error?.message || data?.message || "Código inválido.")}`, "err");
      return;
    }

    setSession({
      session_id: data.session_id,
      session_token: data.session_token,
      expires_at: data.expires_at,
      code_hint: data.code_hint
    });

    msg(statusBox, "✅ Código válido. Entrando a INNOV IA PLAY...", "ok");
    setTimeout(() => location.href = "movies.html", 500);
  });
}