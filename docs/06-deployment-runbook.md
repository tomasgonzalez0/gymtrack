# 06 — Runbook de despliegue

Ejecutado por el agente `gymtrack-deployer`. Cada paso es **idempotente** (si el recurso ya existe y es tuyo, reutilízalo). Aplica `docs/05-cost-guard.md` antes de cada paso de aprovisionamiento. Nunca imprimas secretos: pásalos por stdin/variables y guárdalos solo en `.secrets/` (gitignored) o en Vercel.

## D0. Preflight
- `git remote -v`, `git status`, `node -v`, `npm -v`; `npm run test:all` y `npm run build` en verde (QA = PASS).
- Herramientas: MCP (Google Cloud, Vercel, Neon, Contentful) y CLI (`gcloud`, `vercel`, `gh`). Si falta algo, usa el fallback indicado en cada paso. Registrar en `docs/state/DEPLOYMENT.md` (sin secretos).
- Verificar `git push` a `origin main`. Si falla por credenciales → *human gate H0* (el usuario autentica `gh auth login`/credenciales y avisa).

## D1. Neon (plan Free)
1. Inventario: organización/plan, proyectos existentes. Si ya existe `gymtrack`, reutiliza; si el plan no es Free → STOP.
2. Crear proyecto `gymtrack` (región gratuita más cercana a Colombia: `aws-sa-east-1` si está disponible en Free; si no, `aws-us-east-1`), BD `neondb`/por defecto.
3. Obtener cadena pooled y directa → `.secrets/prod.env` (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`).
4. `DATABASE_URL_UNPOOLED=… npm run db:migrate` y luego `npm run db:seed`. Verificar con SQL de solo lectura (tablas, 35+ ejercicios, 2 usuarios, 1 vínculo `active`).

## D2. Contentful (solo verificación; el token es human gate)
1. Inventario: organización/plan y spaces. Debe ser plan gratuito/Community; si no hay space y crear uno puede facturar → STOP y pedir al usuario crearlo.
2. Obtener `CONTENTFUL_SPACE_ID` y confirmar entorno `master`.
3. Cuando exista el token (H2): `npm run smoke:contentful` sube un PNG de 1×1, lo publica, comprueba que la URL responde 200 y lo elimina.

## D3. Vercel (Hobby)
1. Inventario: cuenta/equipo y plan (debe ser Hobby/personal), proyectos existentes.
2. Crear proyecto `gymtrack` enlazado al repo `tomasgonzalez0/gymtrack` (rama `main`, framework Next.js). Fallback: `vercel link` + `vercel --prod`. **No** instalar integraciones del Marketplace.
3. `vercel.json`: región alineada con Neon si Hobby lo permite.
4. Variables de entorno (**solo Production**): `DATABASE_URL`, `AUTH_SECRET` (generado aquí con `openssl rand -base64 32`), `AUTH_TRUST_HOST=true`, `ALLOWED_EMAILS`, `CONTENTFUL_SPACE_ID`, `CONTENTFUL_ENVIRONMENT=master`. (`AUTH_GOOGLE_*` y `CONTENTFUL_MANAGEMENT_TOKEN` llegan tras los human gates.)
5. Primer despliegue a producción → anotar la URL (`https://gymtrack*.vercel.app`) en `DEPLOYMENT.md`. El build NO debe requerir acceso a la BD.

## D4. Google Cloud (OAuth)
- Inventario (solo lectura): `gcloud auth list`, `gcloud projects list`, ¿hay facturación vinculada? Preferir un proyecto existente del usuario usado para OAuth personal; si no, crear `gymtrack-<sufijo>` **sin** facturación.
- No habilites ninguna API. Crear el cliente OAuth web **no es automatizable de forma fiable con gcloud/MCP** → human gate H1.

## Human gates (consolidar en UN mensaje)
**H1 — Cliente OAuth de Google** (≈3 min). Codex imprime esto con la URL real:
1. console.cloud.google.com → proyecto indicado → *Google Auth Platform* (o *APIs & Services → OAuth consent screen*).
2. Configurar: tipo **Externo**, nombre **GymTrack**, correo de soporte `tomasgz2006@gmail.com`, ámbitos por defecto (`openid`, `email`, `profile`), estado **Testing** con usuarios de prueba `tomasgz2006@gmail.com` e `ivannacc07@gmail.com` (o publicar "In production": con ámbitos básicos no requiere verificación).
3. *Clients / Credentials → Create client → Web application* "GymTrack Web".
   - Orígenes JS autorizados: `http://localhost:3000` y `https://<URL-PROD>`
   - URIs de redirección: `http://localhost:3000/api/auth/callback/google` y `https://<URL-PROD>/api/auth/callback/google`
4. Guardar en `.secrets/google-oauth.env`:
   ```
   AUTH_GOOGLE_ID=...
   AUTH_GOOGLE_SECRET=...
   ```
**H2 — Token de Contentful**: Contentful → Settings → API keys → *Content management tokens* → *Generate personal token* ("gymtrack-cma") → guardar en `.secrets/contentful.env`:
```
CONTENTFUL_MANAGEMENT_TOKEN=...
```
(opcional: `CONTENTFUL_SPACE_ID=...` si el agente no pudo obtenerlo).
**H3 — Login real** (fase E): iniciar sesión con ambas cuentas y recorrer el checklist `HUMAN-UAT` de `docs/07-qa-plan.md`.

Protocolo: el agente espera, detecta los archivos en `.secrets/`, los sube a Vercel (`vercel env add … production` con stdin o el MCP), **borra el contenido de pantalla/logs**, y continúa. Nunca los commitea.

## D5. Redespliegue y verificación en producción
1. Redesplegar producción con las variables completas.
2. `npm run smoke:contentful` (con token) y `npm run smoke:prod -- <URL>`:
   - `GET /api/health` → 200 `{status:"ok",db:"ok"}`
   - `GET /login` → 200; `GET /hoy` sin sesión → 302/307 a `/login`
   - `GET /api/auth/providers` → solo `google` (no `credentials`)
   - `manifest.webmanifest` 200 y válido; headers de seguridad presentes
   - El HTML no contiene valores de ninguna variable secreta
3. Auditoría de costos → `docs/state/COST_AUDIT.md`.

## D6. Cierre
`README.md` (qué es, stack, cómo correr local, variables, despliegue, roadmap P2), `docs/USER_GUIDE.md` (ver `08-user-guide-outline.md`), `DEPLOYMENT.md` final (URL, proyecto/ids no sensibles, cómo redeplegar y hacer rollback), commit, push, tag `v1.0.0`.

## Rollback
- Aplicación: Vercel → promover despliegue anterior (MCP o `vercel rollback`).
- Datos: migraciones aditivas; ante un error, *fix-forward*. Neon Free conserva ventana corta de historial: restaurar solo si es imprescindible y desde el panel de Neon.

## Blockers conocidos y qué hacer
| Situación | Acción |
|---|---|
| Plan de Neon/Contentful/Vercel no es gratuito | STOP, registrar, informar |
| `gcloud` pide habilitar billing | STOP, no habilitar |
| No hay `git push` | H0 |
| Sin Contentful space gratuito | Pedir al usuario crearlo (Community) |
| Dominio `gymtrack.vercel.app` ocupado | Usar el que Vercel asigne y actualizar URIs de OAuth |
