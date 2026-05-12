INNOV IA PLAY - V1 Supabase
===========================

Archivos principales
--------------------
- index.html        -> Página pública, pide código de acceso. NO muestra admin.
- movies.html       -> Catálogo estilo streaming + modo cine.
- admin.html        -> Panel administrador separado con Supabase Auth.
- assets/style.css  -> Diseño INNOV IA.
- js/config.js      -> Configuración Supabase.
- js/*.js           -> Lógica pública/admin.
- supabase/01_schema.sql
- supabase/02_make_admin.sql
- supabase/03_seed_demo.sql
- supabase/functions/playback-url/index.ts

Qué hace
--------
- Admin agrega películas, series, posters, banners, tráiler y link de película.
- Los links NO quedan en el HTML.
- Los links se envían a Supabase y se guardan cifrados con pgcrypto.
- El cliente entra con código de acceso.
- El código se guarda como hash, no como texto plano.
- Puedes limitar código por fecha, cantidad de usos y películas permitidas.
- Al reproducir, movies.html pide permiso a la Edge Function playback-url.
- La Edge Function valida sesión y devuelve el enlace preview para el iframe.

Advertencia realista
--------------------
Google Drive no ofrece DRM real. Esta versión evita que el link esté en el HTML o en tablas públicas,
pero si alguien avanzado reproduce el video puede intentar ver tráfico de red del navegador.
Para seguridad tipo Netflix real se necesitaría DRM/streaming especializado.

PASOS SUPABASE
==============

1) Crear proyecto
-----------------
Crea un proyecto en Supabase.

2) Ejecutar schema
------------------
Abre Supabase > SQL Editor.
Abre el archivo:
  supabase/01_schema.sql

Antes de ejecutarlo, reemplaza:
  CAMBIA_ESTA_CLAVE_CRYPTO_LARGA
  CAMBIA_ESTE_FUNCTION_SECRET

Ejemplo:
  crypto_key: una clave larga de 32+ caracteres
  function_secret: otra clave larga de 32+ caracteres

Guarda el function_secret porque también irá en la Edge Function.

3) Crear usuario admin
----------------------
Supabase > Authentication > Users > Add user.
Crea tu email y contraseña.

Luego abre:
  supabase/02_make_admin.sql

Reemplaza:
  TU_CORREO_ADMIN@DOMINIO.COM

Ejecuta el SQL.

4) Configurar js/config.js
--------------------------
En Supabase > Project Settings > API:
- Copia Project URL.
- Copia anon/public key.

Edita:
  js/config.js

Coloca:
  SUPABASE_URL
  SUPABASE_ANON_KEY
  EDGE_PLAYBACK_URL

EDGE_PLAYBACK_URL normalmente es:
  https://TU-PROYECTO.supabase.co/functions/v1/playback-url

No pongas service_role en config.js.

5) Desplegar Edge Function
--------------------------
Instala Supabase CLI si no lo tienes.
En la carpeta del proyecto:

  supabase login
  supabase link --project-ref TU_PROJECT_REF
  supabase secrets set FUNCTION_SHARED_SECRET="EL_MISMO_SECRET_DEL_SQL"

Si tu entorno no expone automáticamente SUPABASE_SERVICE_ROLE_KEY, agrega también:

  supabase secrets set SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY"

Luego:

  supabase functions deploy playback-url

6) Probar admin
---------------
Abre:
  admin.html

Inicia sesión con el email y contraseña admin.
Agrega una película.

Si editas una película:
- Deja link tráiler y link película vacíos para conservar los links actuales.
- Rellénalos solo si quieres reemplazarlos.

7) Crear código
---------------
En admin.html > Códigos:
- Genera código.
- Selecciona vencimiento y usos.
- Permite todas las películas o algunas.
- Guarda.
- El código completo se muestra una sola vez y se copia.

8) Probar cliente
-----------------
Abre:
  index.html

Pega el código creado y entra al catálogo.

Subir a hosting
---------------
Puedes subir estos archivos a Vercel, Netlify, GitHub Pages o cualquier hosting estático.
No subas service_role ni secretos dentro del frontend.

Notas
-----
- El admin no está enlazado desde index.html ni movies.html.
- Aun así, admin.html existe como archivo; la verdadera protección es Supabase Auth + RLS.
- Usa contenido propio o con autorización.