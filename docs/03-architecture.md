# 03 — Arquitectura

## Stack (todo gratuito)
- **Next.js** (App Router, última versión estable; verifica con `npm view next version`) + **TypeScript estricto** + **Tailwind CSS** (+ componentes accesibles propios o shadcn/ui).
- **Neon Postgres (plan Free)** + **Drizzle ORM** (`drizzle-kit` para migraciones). Driver `@neondatabase/serverless`.
- **Auth.js (NextAuth v5)** con proveedor Google, sesión JWT que solo lleva `userId`; callback `signIn` aplica allowlist y upsert; el rol se consulta en BD.
- **Contentful (Community/Free)** solo como **almacén de imágenes/GIFs** (Content Management API desde el servidor). La URL pública (`images.ctfassets.net`) se guarda en Neon.
- **Zod** (validación), **Recharts** (gráficas), **date-fns / date-fns-tz** (fechas, `America/Bogota`).
- **Pruebas:** Vitest + **PGlite** (`@electric-sql/pglite` con `drizzle-orm/pglite`, Postgres en memoria, gratis) para unit/integración; **Playwright** para e2e.
- **Hosting:** Vercel **Hobby**. CI opcional: GitHub Actions (lint+typecheck+test, < 5 min).
- Gestor: npm. Sin analítica ni scripts de terceros.

## Estructura sugerida
```
src/
  app/                      # rutas (ver docs/01), route handlers en app/api
  components/               # ui/, session/, charts/, trainer/, library/
  lib/
    auth/                   # config Auth.js, requireUser, requireRole, assertCanAccessAthlete
    db/                     # schema.ts, client.ts, migrate/seed, queries por dominio
    progression/            # evaluateProgression (puro), e1rm, tests
    contentful/             # assets.ts (server-only): upload, publish, delete
    validation/             # esquemas Zod compartidos
    time.ts                 # helpers America/Bogota
  messages/es.ts            # todos los textos de UI
drizzle/                    # migraciones generadas
scripts/                    # seed.ts, smoke-contentful.ts, smoke-prod.ts
tests/                      # unit/, integration/, e2e/
public/                     # manifest, iconos PWA, service worker
```

## Patrones obligatorios
- **Capa de acceso a datos única** (`lib/db/queries/*`) que recibe siempre el `actor` y valida permisos con los helpers de `lib/auth`. Ninguna página/acción consulta tablas "a pelo" sin pasar por esa capa.
- **Server Actions / Route Handlers**: `1) requireUser 2) parse con Zod 3) autorización por BR 4) operación en transacción 5) revalidar caché`. Errores tipados `{ ok:false, code, message_es }`; nunca filtrar trazas ni mensajes de la BD al cliente.
- **IDOR**: todo recurso con `athlete_id` se verifica contra el actor (dueño, entrenador `active`, o admin).
- Módulos `server-only` para todo lo que use secretos (`contentful`, `db`, `auth`).
- Fechas en UTC en BD, presentación `America/Bogota`.
- Textos de UI solo en `src/messages/es.ts` (preparado para i18n futuro).

## Pipeline de imágenes (Contentful como librería de assets)
1. Entrenador sube archivo en el gestor de media del ejercicio → `POST /api/exercises/[id]/media` (multipart).
2. Servidor: `requireRole(trainer|admin)` + permiso sobre el ejercicio; valida tamaño ≤ 5 MB, tipo permitido por **magic bytes**, dimensiones mínimas, máx. 6 por ejercicio.
3. CMA: crear *upload* → crear *asset* (título = nombre del ejercicio + id, `fileName` saneado) → *process* → esperar `processed` (timeout 20 s) → *publish*.
4. Guardar fila `exercise_media` con `url` (`https://images.ctfassets.net/...`), `contentful_asset_id`, dimensiones, tamaño, `alt`.
5. Reemplazar = subir nuevo + borrar anterior. Quitar = borrar fila + `unpublish`/`delete` del asset (best effort).
6. Fallback: registrar URL manual con host `images.ctfassets.net` (BR-E8).
7. Render: `next/image` con `images.unoptimized = true` (evita consumo de la optimización de imágenes de Vercel); para imágenes estáticas pedir tamaño a Contentful (`?w=640&fm=webp`); **los GIF nunca llevan parámetros de transformación** (preservar animación). `loading="lazy"`, `alt` siempre.

## Variables de entorno
| Variable | Dónde | Descripción |
|---|---|---|
| `DATABASE_URL` | Vercel Prod, `.env.local` | Neon, cadena **pooled** |
| `DATABASE_URL_UNPOOLED` | `.secrets/`, local | Neon directa, para migraciones/seed |
| `AUTH_SECRET` | Vercel Prod, local | Aleatorio (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Vercel Prod, local | Cliente OAuth |
| `AUTH_TRUST_HOST` | Vercel Prod | `true` |
| `ALLOWED_EMAILS` | Vercel Prod | `tomasgz2006@gmail.com,ivannacc07@gmail.com` |
| `SEED_ADMIN_EMAIL`, `SEED_ATHLETE_EMAIL` | local/seed | Defaults del doc 04 |
| `CONTENTFUL_SPACE_ID`, `CONTENTFUL_ENVIRONMENT`, `CONTENTFUL_MANAGEMENT_TOKEN` | Vercel Prod, local | Solo servidor |
| `E2E_TEST_MODE` | **solo local/CI** | Habilita login de prueba. **Prohibido en Vercel** |
Mantener `.env.example` (sin valores reales) y validar variables al arrancar con Zod (fallar rápido con mensaje claro).

## Seguridad
- Login de prueba para Playwright: proveedor Credentials registrado **solo si** `E2E_TEST_MODE==='true'` **y** no existe `process.env.VERCEL`; además, el arranque lanza error si ambas condiciones se contradicen. Test de QA verifica que en producción `/api/auth/providers` lista únicamente Google.
- Headers (en `next.config` o `middleware`): `Content-Security-Policy` (self; `img-src 'self' data: https://images.ctfassets.net`; sin scripts de terceros), `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`.
- Cookies de sesión `httpOnly`, `secure`, `sameSite=lax` (defaults de Auth.js en prod).
- Rate limit simple en subida de media (p. ej. 20/hora por usuario, en memoria/BD) — evitar abuso aunque el registro sea cerrado.
- `npm audit --omit=dev` sin vulnerabilidades altas/críticas abiertas.

## PWA
`manifest.webmanifest` (nombre GymTrack, `display: standalone`, iconos 192/512 + maskable, `theme_color`), service worker mínimo que cachea el shell estático (sin cachear respuestas autenticadas). Persistir el borrador de la sesión activa en `localStorage` para sobrevivir recargas; la cola de reintentos offline es P1.

## Región y rendimiento
Alinear la región de las funciones de Vercel con la de Neon (`vercel.json` → `"regions": ["<región>"]` si el plan Hobby lo permite). Consultas con índices; páginas de progreso agregan en SQL, no en el cliente.

## Health y diagnóstico
`GET /api/health` → `{status:"ok", db:"ok"|"error", version}` (sin datos sensibles). `/admin/diagnostico` (admin): BD, Contentful (ping CMA al space), nº de emails en allowlist, versión/commit, entorno.
