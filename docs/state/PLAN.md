# PLAN — GymTrack

Fecha de planificación: 2026-10-25. Alcance comprometido: P0 completo; P1 condicionado a P0 verde; P2 solo roadmap.

## Arquitectura objetivo

Next.js App Router sirve UI móvil y handlers/actions. Toda entrada externa se valida con Zod y toda operación de dominio pasa por una capa de consultas que recibe un actor obtenido desde Auth.js. El JWT solo transporta `userId`; rol, estado y vínculos se consultan en Postgres en cada operación. Neon conserva datos transaccionales; Contentful almacena exclusivamente assets. El motor de progresión es puro. PGlite ejecuta las migraciones reales en integración y Playwright usa un proveedor de prueba imposible de activar en Vercel.

```text
src/
  app/
    (public)/login/  (app)/{hoy,sesion,rutina,ejercicios,progreso,historial,ajustes}/
    entrenador/  admin/diagnostico/  api/{auth,health,exercises}/
  components/{ui,layout,library,routine,session,charts,trainer}/
  lib/
    auth/{config,session,authorization}.ts
    db/{client,schema,seed,queries/*}.ts
    contentful/{asset-store,contentful-store,fake-store,media-validation}.ts
    progression/{evaluate,e1rm,metrics,records}.ts
    validation/*.ts  env.ts  time.ts
  messages/es.ts
drizzle/  public/{icons,manifest.webmanifest,sw.js}
scripts/{migrate,seed,smoke-contentful,smoke-prod}.ts
tests/{unit,integration,e2e,fixtures}/
```

Regla transversal: cada action/handler sigue `requireUser → Zod → autorización de BD → transacción → revalidación`. Ningún módulo cliente importa secretos ni accede directamente a datos.

## Versiones verificadas y API relevante

Consulta realizada con `npm view` el 2026-10-25; todas son MIT/Apache-2.0/ISC.

| Paquete | Versión elegida | Nota de API/compatibilidad |
|---|---:|---|
| `next` | 16.4.3 | App Router; Node >=20.9; headers desde config; handlers bajo `app/api` |
| `react`, `react-dom` | 19.3.1 | Compatible con Next 16 |
| `next-auth` | 5.0.0-beta.32 exacta | v5 exporta `{ handlers, auth, signIn, signOut }`; beta fijada por D-004 |
| `drizzle-orm` / `drizzle-kit` | 0.45.4 / 0.31.11 | Driver Neon y `drizzle-orm/pglite`; migraciones solo con `generate` |
| `@neondatabase/serverless` | 1.2.0 | Conexión pooled en runtime; directa para migrar |
| `contentful-management` | 12.19.4 | `createUpload` + asset/process/publish asíncrono con polling |
| `@electric-sql/pglite` | 0.5.11 | Postgres WASM local para integración |
| `@playwright/test` | 1.64.1 | Proyectos mobile 375×812 y desktop 1280×800 |
| `vitest` | 4.1.12 | Compatible con Node 20; D-005 |
| `zod` | 4.6.7 | Errores convertidos a mensajes es-CO tipados |
| `tailwindcss` | 4.3.3 | Integración PostCSS con `@tailwindcss/postcss` |
| `recharts` | 3.10.1 | Importación dinámica solo en vistas de progreso |
| `date-fns` / `date-fns-tz` | 4.4.0 / 3.2.0 | Presentación y cortes de día en `America/Bogota` |

## Hitos y tareas

Cada tarea debe cerrar con `npm run lint && npm run typecheck && npm run test`; además se ejecuta el criterio específico del hito. Estimaciones: S <=45 min, M <=90 min, L <=2 h.

### M0 — Scaffold y contratos base

Salida: instalación reproducible con `package-lock.json`; todos los scripts requeridos existen; `npm run lint && npm run typecheck && npm run test && npm run build` pasa.

| Tarea | Descripción / archivos | BR / AC | Pruebas | Est. | Dep. |
|---|---|---|---|---|---|
| T-001 | Crear Next/TS estricto/Tailwind, layout móvil, aliases y scripts en `package.json` | Base P0 | smoke unitario y build | M | — |
| T-002 | Centralizar copy es-CO en `messages/es.ts`, errores de dominio tipados y estilos de foco/tema | AC-62, AC-63 | test de catálogo y error shape | M | T-001 |
| T-003 | Validar env servidor/cliente; `.env.example`; guardas que prohíben test mode en Vercel | AC-71, AC-72 | matrices de env local/prod | M | T-001 |
| T-004 | Configurar Vitest, Playwright, fixtures, proyectos móvil/escritorio y workflow CI gratuito opcional | AC-61 | test mínimo en ambas capas | M | T-001 |

### M1 — Base de datos, migraciones y seed

Salida: `npm run db:generate`; migración aplicada en PGlite; tests de esquema, restricciones y seed idempotente verdes.

| Tarea | Descripción / archivos | BR / AC | Pruebas | Est. | Dep. |
|---|---|---|---|---|---|
| T-010 | Definir enums/tablas/FK/checks/índices en `db/schema.ts` y generar migración | BR-L1, BR-E1–E4, BR-R1–R6, BR-S1–S4, BR-P6, BR-S7 | checks, únicos parciales, cascadas/SET NULL | L | T-001 |
| T-011 | Clientes Neon/PGlite, runner de migración y helpers transaccionales server-only | AC-72 | migración limpia repetible en PGlite | M | T-010 |
| T-012 | Seed idempotente: 2 usuarios, vínculo, 39 ejercicios y rutina ejemplo inactiva | BR-A5, BR-E3, AC-10 | dos ejecuciones producen mismos conteos | L | T-011 |
| T-013 | Repositorios base reciben actor y no exponen cliente crudo fuera de `lib/db` | BR-A4, BR-V1, AC-05 | test arquitectónico/import boundaries | M | T-011 |

### M2 — Autenticación, autorización y vínculos

Salida: AC-01…07 verdes en unit/integración/E2E; rutas protegidas y revocación inmediata comprobadas.

| Tarea | Descripción / archivos | BR / AC | Pruebas | Est. | Dep. |
|---|---|---|---|---|---|
| T-020 | Config Auth.js Google: email verificado, allowlist, enlace seguro por `google_sub`, JWT solo userId | BR-A1–A3, AC-01, AC-02 | callbacks: permitido, ajeno, no verificado, sub distinto | L | T-012,T-003 |
| T-021 | `requireUser`, `requireRole`, `assertCanAccessAthlete`; rol/disabled/vínculo leídos de BD siempre | BR-A4, BR-A6, BR-V1, AC-03–06 | matriz dueño/ajeno/vinculado/revocado/admin y cambio rol | L | T-013,T-020 |
| T-022 | Middleware/layout de rutas y pantallas login/sin acceso/redirecciones | AC-01, AC-03 | E2E público/protegido por rol | M | T-020,T-021 |
| T-023 | Actions/UI de solicitar, aceptar y revocar vínculo con mensajes neutrales | BR-L1–L4, AC-06, AC-07 | ambas direcciones, duplicado, rol inválido, revocación inmediata | L | T-021 |
| T-024 | Proveedor Credentials y fixtures E2E con doble guarda local/no Vercel | AC-01, AC-71 | config falla con Vercel+test mode; login fixture | M | T-020 |

### M3 — Biblioteca de ejercicios y media

Salida: AC-10…14 verdes; `npm run smoke:contentful` existe y funciona con fake sin credenciales y real cuando se suministren.

| Tarea | Descripción / archivos | BR / AC | Pruebas | Est. | Dep. |
|---|---|---|---|---|---|
| T-030 | CRUD/archivo de ejercicios vía repositorio y actions; slug/nombre único; permisos creador/admin | BR-E1–E4, BR-E7, AC-10, AC-14 | trainer propio/ajeno, athlete, admin, referenciado/no referenciado | L | T-021,T-012 |
| T-031 | Biblioteca/ficha públicas a usuarios auth y gestor entrenador con placeholder | BR-E3, BR-E7, AC-10 | component + E2E roles/estados vacíos | L | T-030 |
| T-032 | Validar media: magic bytes, dimensiones, tamaño, cantidad, alt y host manual | BR-E5, BR-E8, AC-13 | JPEG/PNG/WebP/GIF, SVG, MIME falso, 5 MB, sexto/séptimo, host | L | T-030 |
| T-033 | Interfaz `AssetStore`, fake y Contentful CMA server-only con upload/process/publish, timeout/reintento | BR-E5, BR-E6, AC-11 | fake + errores token/rate-limit/timeout | L | T-032 |
| T-034 | Handler multipart con authz/rate limit; agregar/reemplazar/quitar/reordenar en transacción | BR-E5–E8, AC-11–13 | matriz IDOR y rollback/reordenamiento/cleanup best effort | L | T-033 |
| T-035 | Galería con GIF sin transformación y `next/image` unoptimized; script smoke Contentful reversible | BR-E5–E7, AC-11, AC-12 | URL estática vs GIF, E2E gestión completa | M | T-034 |

### M4 — Constructor y vista de rutinas

Salida: AC-20…25 verdes en integración y E2E; una sola rutina activa y snapshots futuros protegidos.

| Tarea | Descripción / archivos | BR / AC | Pruebas | Est. | Dep. |
|---|---|---|---|---|---|
| T-040 | Esquemas Zod y servicios transaccionales para crear/editar/activar rutinas | BR-R1–R4, AC-20, AC-22, AC-23 | todos los límites, aviso heavy, activación atómica | L | T-021,T-030 |
| T-041 | Autorización de rutina propia vs entrenador vinculado/admin; pérdida tras revocar | BR-L3, BR-R1, BR-P8, BR-V1, AC-05, AC-06, AC-21, AC-25 | matriz completa por operación | L | T-040 |
| T-042 | Constructor de días/ejercicios accesible, ordenable, con todos los campos | BR-R2–R4, AC-20, AC-22, AC-25 | component + E2E atleta/entrenador | L | T-040,T-041 |
| T-043 | Vista `/rutina`, autor visible, selección de biblioteca y solo lectura si creada por entrenador | BR-L4, BR-R1, AC-21, AC-25 | E2E permisos y estados | M | T-042 |
| T-044 | Garantizar snapshot al iniciar sesión y SET NULL al quitar prescripción | BR-R5, BR-R6, AC-24 | editar/eliminar rutina no cambia sesión fixture | M | T-040 |

### M5 — Hoy, sesión activa y resumen

Salida: AC-30…36 verdes en E2E móvil y escritorio; recarga conserva sesión y toda mutación tiene IDOR.

| Tarea | Descripción / archivos | BR / AC | Pruebas | Est. | Dep. |
|---|---|---|---|---|---|
| T-050 | Resolver día sugerido en Bogotá, sesión vieja >12 h y sesión única/reanudar | BR-R7, BR-S1, BR-S5, BR-S7, AC-30, AC-35 | weekday/ciclo/DST no aplicable, con/sin sets, concurrencia | L | T-044 |
| T-051 | Crear sesión con snapshot y prefill target/último/vacío | BR-R5, BR-R8, AC-24, AC-30 | prioridades de prefill y aislamiento histórico | L | T-050 |
| T-052 | Actions de alta/edición/borrado de sets con límites y ventana 24 h | BR-S2, BR-S3, BR-V1, AC-05, AC-30, AC-34 | bordes, doble toque/idempotencia, dueño/ajeno, vencimiento | L | T-051 |
| T-053 | UI sesión a una mano: tarjetas, imagen, +/- y completar en <=2 toques; borrador local | BR-S2, AC-30, AC-36, AC-61 | E2E 375 px, recarga, red lenta, coma decimal | L | T-052 |
| T-054 | Temporizador timestamp, +/-15/saltar, aria-live, vibración/beep opt-in | BR-S6, AC-31 | fake clock, background/recarga, reduced motion | M | T-053 |
| T-055 | Técnica/RPE/notas, validación al finalizar y resumen transaccional base | BR-S3, BR-S4, AC-32, AC-33 | requerida/no requerida, RPE 5–10, rollback | L | T-052 |
| T-056 | Historial/detalle y edición autorizada hasta 24 h | BR-S3, BR-V1, AC-34 | E2E dueño, trainer lectura, trainer sin edición | M | T-055 |

### M6 — Progresión, métricas y récords

Salida: >=15 unit tests del motor más AC-40…46 verdes; finalizar/editar recalcula todo atómicamente.

| Tarea | Descripción / archivos | BR / AC | Pruebas | Est. | Dep. |
|---|---|---|---|---|---|
| T-060 | Funciones puras e1RM, volumen, redondeo y series de trabajo | BR-P1, BR-P9, BR-C1, BR-PR1, AC-46, AC-50 | reps=1, 0 kg, mixtas, warmup | M | T-001 |
| T-061 | `evaluateProgression` puro: increase/fair/poor/RPE/hold/consecutivas | BR-P1–P3, BR-P5, BR-P9, AC-40–42, AC-45 | >=15 casos incluidos mixto/nulo/no consecutivo | L | T-060 |
| T-062 | Regla decrease de dos sesiones y explicaciones es-CO | BR-P4, BR-P9, AC-43 | mitad exacta, W distinto, poor doble, mínimo 0 | M | T-061 |
| T-063 | Persistencia/lifecycle pending-expired-accepted-dismissed y target weight | BR-P6, BR-P8, AC-44 | único pending, no repetir sin evaluación, actor atleta | L | T-052,T-062 |
| T-064 | Detección/reemplazo idempotente de PR y recálculo tras edición | BR-S3, BR-C1, BR-PR1, AC-33, AC-34, AC-46, AC-52 | tres tipos PR, warmup excluido, edición reduce marca | L | T-060,T-055 |
| T-065 | Integrar sugerencias/PR en finalizar, resumen, Hoy y próxima tarjeta | BR-P1, BR-P3–P6, AC-33, AC-40–46 | transacción completa + E2E aceptar/descartar | L | T-063,T-064 |

### M7 — Progreso, historial, entrenador, diagnóstico y salud

Salida: AC-50…52 y AC-70 verdes; agregados exactos por rango; dashboard respeta vínculo activo.

| Tarea | Descripción / archivos | BR / AC | Pruebas | Est. | Dep. |
|---|---|---|---|---|---|
| T-070 | Consultas SQL agregadas para 4 métricas y rangos; global 12 semanas | BR-C1–C3, AC-50, AC-51 | fixture recalculada independientemente, límites de fecha | L | T-060,T-021 |
| T-071 | Vistas progreso global/detalle con Recharts dinámico, tooltips, PR/empty states | BR-C1–C3, BR-PR1, AC-50–52 | componentes + E2E rangos/estado vacío | L | T-070 |
| T-072 | Dashboard entrenador: atletas, última sesión, sugerencias, rutina/progreso/historial | BR-L3, BR-P8, BR-V1, AC-06, AC-50–52 | activo/revocado/admin; no aceptar por trainer | L | T-070,T-065 |
| T-073 | `/api/health` seguro y `/admin/diagnostico` con DB/Contentful/config no sensible | BR-A4, BR-V1, AC-70, AC-72 | health ok/error, diagnóstico solo admin y redacción | M | T-021,T-033 |

### M8 — Ajustes, PWA, accesibilidad y seguridad

Salida: AC-60…63 y AC-71…73 verdes; build y Playwright en dos viewports pasan; audit sin high/critical.

| Tarea | Descripción / archivos | BR / AC | Pruebas | Est. | Dep. |
|---|---|---|---|---|---|
| T-080 | Ajustes de perfil/descanso/sonido y gestión de vínculos | BR-A6, BR-L1–L4, BR-S6, BR-V1, AC-07 | dueño únicamente, límites, E2E | M | T-023 |
| T-081 | Manifest, iconos 192/512/maskable y SW shell-only | AC-60, AC-36 | manifest validator, SW no cachea API/auth | M | T-001,T-053 |
| T-082 | Auditoría 375 px, touch 44 px, teclado, labels, contraste, dark/reduced-motion, copy español | AC-61–63 | axe/manual Playwright, no overflow ni keys visibles | L | T-031,T-043,T-053,T-071,T-080 |
| T-083 | CSP y headers, cookies/defaults, imágenes unoptimized y escaneo secretos/HTML | BR-V1, AC-71–73 | headers, providers solo Google en prod, patrón secretos | L | T-003,T-024,T-035 |
| T-084 | Auditoría dependencias/licencias y `npm audit --omit=dev`; eliminar warnings | AC-73 | comando sin high/critical | S | T-083 |

### M9 — QA independiente

Salida: `QA_REPORT.md` con cada AC evidenciado, 0 S1/S2 abiertos y veredicto PASS; máximo tres ciclos B↔C.

| Tarea | Descripción / archivos | BR / AC | Pruebas | Est. | Dep. |
|---|---|---|---|---|---|
| T-090 | Instalación limpia y puertas lint/typecheck/test/build/e2e móvil+desktop | Todos P0 | `npm ci`, `test:all`, build | L | M0–M8 |
| T-091 | Enumerar handlers/actions y auditar matriz IDOR, archivos hostiles, headers, secretos, costos | BR-V1, AC-05, AC-06, AC-13, AC-71–74 | revisión + tests adversariales | L | T-090 |
| T-092 | Exploratorio y verificación numérica independiente; matriz AC y defectos | Todos AC | fixtures manuales y evidencia | L | T-091 |
| T-093 | Ciclo de regresión: implementador corrige S1/S2 con test y QA repite (máx. 3) | AC fallidos | suite completa por ciclo | L | T-092 |

### M10 — Despliegue, documentación y producción

Salida: QA PASS; recursos FREE auditados; producción y smokes verdes; docs completas; tag `v1.0.0`; AC-70…75 PASS y AC-76/77 HUMAN-UAT.

| Tarea | Descripción / archivos | BR / AC | Pruebas | Est. | Dep. |
|---|---|---|---|---|---|
| T-100 | Preflight e inventario solo lectura por proveedor; clasificar FREE/MAYBE/PAID | AC-74 | evidencia no sensible | M | T-093 |
| T-101 | Reutilizar/crear solo Neon Free permitido, migrar/seed y validar conteos | BR-A5, AC-70, AC-74 | SQL solo lectura + health | M | T-100 |
| T-102 | Verificar Contentful Community/master y Vercel Hobby; crear/enlazar un proyecto sin Marketplace | AC-74 | inventario de plan y límites | M | T-100 |
| T-103 | Configurar vars Production sin eco, desplegar inicial y reunir H1 OAuth + H2 CMA en un gate | AC-71, AC-72, AC-74 | providers/config sin test mode | M | T-101,T-102 |
| T-104 | Aplicar credenciales recibidas, migrar/seed, redeploy y ejecutar `smoke:contentful`/`smoke:prod` | AC-70, AC-71, AC-76, AC-77 | smokes; 76/77 quedan HUMAN-UAT hasta ejecución humana | L | T-103 |
| T-105 | Completar `COST_AUDIT`, `DEPLOYMENT`, README y `USER_GUIDE` con URL/rollback/roadmap | AC-74, AC-75 | revisión de completitud y secretos | L | T-104 |
| T-106 | QA producción, push final, tag `v1.0.0` y checklist H3 | AC-70–77 | smoke final y auditoría repo | M | T-105 |

## Backlog P1 condicionado (no bloquea P0)

Orden de valor: (1) cola offline de sets; (2) wake-lock; (3) duplicar rutina; (4) deload BR-P7; (5) exportación de datos BR-V2/CSV; (6) lb de presentación; (7) racha; (8) ejercicios privados; (9) promoción admin. Cada ítem exige diseño y pruebas propios después de que M9 marque P0 PASS. No se incluye funcionalidad P2.

## Variables de entorno

| Variable | Ámbito | Regla |
|---|---|---|
| `DATABASE_URL` | local/Vercel Production | pooled, servidor |
| `DATABASE_URL_UNPOOLED` | local `.secrets` | migraciones/seed, nunca Vercel salvo necesidad demostrada |
| `AUTH_SECRET` | local/Vercel Production | secreto aleatorio |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | local/Vercel Production | H1, servidor |
| `AUTH_TRUST_HOST` | Vercel Production | `true` |
| `ALLOWED_EMAILS` | local/Vercel Production | dos emails iniciales |
| `SEED_ADMIN_EMAIL`, `SEED_ATHLETE_EMAIL` | local/seed | opcionales con defaults documentados |
| `CONTENTFUL_SPACE_ID`, `CONTENTFUL_ENVIRONMENT` | local/Vercel Production | environment `master` |
| `CONTENTFUL_MANAGEMENT_TOKEN` | local/Vercel Production | H2, servidor |
| `E2E_TEST_MODE` | solo local/CI | prohibida en Vercel |

## Scripts obligatorios

`dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `test:all`, `db:generate`, `db:migrate`, `db:seed`, `smoke:contentful`, `smoke:prod`. `test:all` ejecuta lint, typecheck, unit/integración, build y E2E sin omitir fallos.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Contentful procesa assets de forma asíncrona o limita tasa | polling acotado 20 s, backoff, errores tipados, fake determinista y cleanup best effort |
| Auth.js v5 es beta | versión exacta, pruebas de callbacks/providers y sin actualizaciones automáticas |
| OAuth y CMA requieren humano | un solo gate H1+H2 después de conocer URL; archivos `.secrets/` ignorados |
| Cuotas Free cambian o cuenta está en plan pago | inventario/plan antes de crear; MAYBE/PAID detiene y se registra |
| PWA/iOS limita background, vibración o instalación | temporizador por timestamps; feedback progresivo; guía específica iPhone/Android |
| Concurrencia en sesión/rutina/sugerencia | índices únicos parciales + transacciones + respuestas idempotentes |
| IDOR por nuevas rutas | repositorio con actor obligatorio y test arquitectónico + matriz por handler/action |
| Optimización de imágenes consume cuota | `unoptimized`; transforms solo Contentful para estáticas, nunca GIF |
| Zona horaria | UTC en BD; helpers únicos con `America/Bogota` y tests en límites de día |

## Matriz de trazabilidad BR → tarea

| Reglas | Tareas |
|---|---|
| BR-A1, BR-A2, BR-A3 | T-020 |
| BR-A4, BR-A6 | T-021 |
| BR-A5 | T-012, T-101 |
| BR-L1, BR-L2 | T-023, T-080 |
| BR-L3, BR-L4 | T-023, T-041, T-043, T-072 |
| BR-E1, BR-E2, BR-E3, BR-E4 | T-010, T-030 |
| BR-E5 | T-032–T-035 |
| BR-E6, BR-E7, BR-E8 | T-030, T-034, T-035 |
| BR-R1, BR-R2, BR-R3, BR-R4 | T-010, T-040–T-043 |
| BR-R5, BR-R6 | T-044, T-051 |
| BR-R7, BR-R8 | T-050, T-051 |
| BR-S1 | T-010, T-050 |
| BR-S2, BR-S3, BR-S4 | T-010, T-052–T-055 |
| BR-S5, BR-S6, BR-S7 | T-050, T-054 |
| BR-P1, BR-P2, BR-P3 | T-061, T-065 |
| BR-P4, BR-P5 | T-062, T-065 |
| BR-P6 | T-010, T-063, T-065 |
| BR-P7 (P1) | Backlog P1 #4 |
| BR-P8 | T-041, T-063, T-072 |
| BR-P9 | T-060–T-062 |
| BR-C1, BR-C2, BR-C3 | T-060, T-064, T-070, T-071 |
| BR-PR1 | T-060, T-064, T-071 |
| BR-V1 | T-013, T-021, T-041, T-052, T-072, T-083, T-091 |
| BR-V2 (P1) | Backlog P1 #5 |

## Matriz de trazabilidad AC → tarea

| Criterios | Tareas |
|---|---|
| AC-01, AC-02 | T-020, T-022, T-024 |
| AC-03, AC-04 | T-021, T-022 |
| AC-05, AC-06 | T-021, T-041, T-052, T-072, T-091 |
| AC-07 | T-023, T-080 |
| AC-10 | T-012, T-030, T-031 |
| AC-11, AC-12 | T-033–T-035 |
| AC-13 | T-032, T-034, T-091 |
| AC-14 | T-030 |
| AC-20 | T-040, T-042 |
| AC-21 | T-041, T-043 |
| AC-22, AC-23 | T-040, T-042 |
| AC-24 | T-044, T-051 |
| AC-25 | T-041–T-043 |
| AC-30 | T-050–T-053 |
| AC-31 | T-054 |
| AC-32–33 | T-055, T-064, T-065 |
| AC-34 | T-052, T-056, T-064 |
| AC-35–36 | T-050, T-053, T-081 |
| AC-40, AC-41, AC-42 | T-061, T-065 |
| AC-43 | T-062 |
| AC-44 | T-063, T-065 |
| AC-45 | T-061 |
| AC-46 | T-060, T-064 |
| AC-50, AC-51, AC-52 | T-060, T-064, T-070–T-072 |
| AC-60 | T-081 |
| AC-61, AC-62, AC-63 | T-002, T-053, T-082 |
| AC-70 | T-073, T-101, T-104, T-106 |
| AC-71 | T-003, T-024, T-083, T-103–T-104 |
| AC-72 | T-003, T-011, T-073, T-083, T-103 |
| AC-73 | T-084 |
| AC-74 | T-091, T-100–T-106 |
| AC-75 | T-105 |
| AC-76, AC-77 | T-104, T-106 (HUMAN-UAT) |

## Autoverificación de calidad

- [x] Tareas independientes, verificables y acotadas a <=2 h.
- [x] Cada hito mantiene `main` compilable y exige puertas verdes.
- [x] Actions/handlers incluyen validación, actor de BD y autorización; hay matriz IDOR explícita.
- [x] Headers, `/api/health`, diagnóstico, README, USER_GUIDE y ambos `smoke:*` tienen tarea.
- [x] Ninguna tarea autoriza recursos facturables; M10 aplica inventario y Cost Guard.
- [x] Cada BR y AC está trazado; cobertura P0 = 100 %.
- [x] P1 está condicionado; P2 no está en implementación y solo se documentará como roadmap.
