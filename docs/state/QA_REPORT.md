# QA REPORT — predespliegue, ciclo 2/3

Fecha: 2026-10-25  
Commit evaluado: `237a4c8` (incluye corrección `c268217`)
Veredicto: **FAIL**

## Resumen ejecutivo

La segunda implementación añade persistencia real, layouts autorizados, acciones de dominio y más pruebas. QA-001, QA-002, QA-003, QA-005 y QA-006 mejoraron y sus causas originales quedaron corregidas. Sin embargo, la revalidación adversarial encontró **3 S1 y 4 S2 abiertos**. No se autoriza despliegue.

Conteo AC: **22 PASS · 19 FAIL · 4 BLOCKED · 2 HUMAN-UAT**.

## Puertas automáticas

Se clonó `237a4c8` sin cambios en `%LOCALAPPDATA%/Temp/gymtrack-qa-cycle2-20261025` para evitar los bloqueos de npm observados en `Documents`.

| Puerta | Resultado | Evidencia |
|---|---|---|
| `npm ci` | PASS | 482 paquetes desde lockfile |
| `npm run lint` | PASS | 0 warnings |
| `npm run typecheck` | PASS | Sin errores |
| `npm run test` | PASS | 9 archivos, 52 pruebas |
| `npm run build` | PASS | Next.js 16.4.3, 30 rutas |
| `npm run test:e2e` | PASS con riesgo | 8/8; Auth.js imprime repetidamente `UnknownAction` y los tests no fallan por errores del servidor |
| `npm audit --omit=dev` | PASS | 0 high/critical y 0 vulnerabilidades de producción |

## Matriz de aceptación

| AC | Estado | Evidencia del ciclo 2 |
|---|---|---|
| AC-01 | PASS | Enlace Google aislado: UUID seed, email verificado y conflicto de `sub`; login real queda en UAT |
| AC-02 | PASS | Allowlist y usuario inexistente rechazados |
| AC-03 | PASS | Ruta protegida redirige sin sesión |
| AC-04 | PASS | `requireUser` vuelve a consultar usuario/rol en BD |
| AC-05 | FAIL | Código mejorado, pero no existe matriz por cada action/handler con ajeno/vinculado/revocado/admin; QA-012 |
| AC-06 | FAIL | Layout y helper protegen, pero falta prueba operativa de vínculo activo→revocado en todas las superficies |
| AC-07 | FAIL | Acciones existen; no hay integración bilateral completa ni prueba neutral/duplicados |
| AC-10 | FAIL | CRUD existe, pero la UI ofrece solo parte de enums y no hay integración trainer propio/ajeno/athlete/admin |
| AC-11 | FAIL | Upload se persiste, pero no hay prueba fake end-to-end ni gestor usable que vuelva a la ficha |
| AC-12 | FAIL | Reordenar siempre falla; reemplazar no existe; QA-011 |
| AC-13 | PASS | Magic bytes, SVG/doble extensión, >5 MB, ancho y conteo real en BD cubiertos entre validación y servicio |
| AC-14 | FAIL | Lógica archive/delete existe, pero no hay prueba con referencias reales ni evidencia del historial |
| AC-20 | FAIL | Constructor solo admite 1 día/1 ejercicio y omite tempo, notas, peso objetivo e incremento/sesiones |
| AC-21 | PASS | Rutina activa del entrenador se lee en Hoy/Rutina y no hay edición del atleta |
| AC-22 | FAIL | Zod se usa, pero avisos `heavy` no se muestran y el constructor no cubre todos los límites/campos |
| AC-23 | FAIL | Índice existe, pero falta transacción; un fallo deja estado parcial reproducible, QA-007 |
| AC-24 | PASS | Snapshot y FK `SET NULL` verificados en PGlite |
| AC-25 | FAIL | Atleta crea solo un día/ejercicio y no puede editar una rutina existente |
| AC-30 | FAIL | Sesión persiste, pero no implementa prefill target→última sesión→vacío |
| AC-31 | PASS | Timestamp absoluto, descanso prescrito y controles ±15/saltar persistidos en borrador |
| AC-32 | FAIL | Request `{ratings:[]}` completa sesión con HTTP 200; QA-009 |
| AC-33 | FAIL | Resumen no muestra volumen, PR ni sugerencias calculadas |
| AC-34 | FAIL | Edición/borrado no recalcula derivados y no hay UI de edición; QA-010 |
| AC-35 | FAIL | Sesión vieja se completa con hora actual, no última serie, y sin derivados |
| AC-36 | PASS | Borrador se hidrata antes de guardar y logs vienen de BD |
| AC-40 | PASS | 3×12 @10, buena, RPE 8, incremento 2 → 12 |
| AC-41 | PASS | Técnica regular mantiene y explica |
| AC-42 | PASS | RPE 10 mantiene |
| AC-43 | PASS | Dos sesiones bajas reducen |
| AC-44 | PASS | Resolver sugerencia valida dueño y actualiza target/status |
| AC-45 | PASS | Dos sesiones requeridas cubiertas |
| AC-46 | PASS | Calentamientos excluidos de progresión/métricas |
| AC-50 | FAIL | Solo se dibujan peso y e1RM; faltan gráficas de reps y volumen; PR tiene errores semánticos |
| AC-51 | PASS | Consulta aplica 4 sem/3 m/6 m/todo |
| AC-52 | FAIL | Se insertan tres “récords” en cada sesión sin comparar históricos; vistas de detalle no muestran PR |
| AC-60 | PASS | Manifest, 192/512/maskable y SW shell-only |
| AC-61 | PASS | Playwright móvil sin overflow y controles >=44 px |
| AC-62 | PASS | Labels/foco/teclado básicos presentes |
| AC-63 | FAIL | La UI imprime valores internos como `progressive` en `/rutina`; copy no está centralizado |
| AC-70 | BLOCKED | Requiere URL y DB de producción |
| AC-71 | BLOCKED | Guarda Vercel/test-mode existe; falta proveedor real en Vercel |
| AC-72 | PASS | Headers presentes; escaneo sin secretos reales |
| AC-73 | PASS | Audit sin high/critical |
| AC-74 | BLOCKED | Requiere inventario y `COST_AUDIT.md` de despliegue |
| AC-75 | BLOCKED | README/USER_GUIDE pertenecen a M10 |
| AC-76 | HUMAN-UAT | Login real de ambas cuentas |
| AC-77 | HUMAN-UAT | Upload real de imagen/GIF en Contentful |

## Revalidación QA-001…QA-006

| Defecto previo | Resultado independiente |
|---|---|
| QA-001 — rutas/IDOR | **PARCIAL**: atleta ya no entra a admin/trainer y sesiones comprueban dueño. Sigue abierto como QA-012 por falta de matriz real para 14 entrypoints y revocación inmediata. |
| QA-002 — enlace Google | **FIXED**: `linkGoogleIdentity` y store unen UUID/sub y rechazan conflicto/no sembrado. Riesgo menor de carrera concurrente pendiente. |
| QA-003 — upload media | **FIXED para upload**: creador/admin, conteo BD, fila y cleanup. Reordenar/reemplazar fallan como QA-011. |
| QA-004 — núcleo estático | **PARCIAL, S2 ABIERTO**: hay BD real, pero faltan campos/edición de rutinas, prefill, resumen, historial editable, dashboard detalle y cuatro gráficas. |
| QA-005 — recarga sesión | **FIXED**: hidrata borrador y conserva timer; BD sigue siendo fuente de logs. |
| QA-006 — JPEG/media | **FIXED**: JPEG corrupto/angosto, archivo grande y doble extensión cubiertos. |

## Auditoría IDOR de superficies

Se enumeraron 14 entrypoints mutables/públicos de servidor: Auth, health, 6 handlers de dominio y 6 módulos de server actions. La lógica revisada suele comprobar actor/dueño, pero la evidencia requerida no existe:

- E2E cubre atleta bloqueado en dos layouts y un flujo feliz de rutina/sesión.
- No prueba handlers de sets, finish o media como usuario ajeno, entrenador activo, revocado y admin.
- No prueba actions de vínculos, ejercicios, sugerencias, ajustes o rutina de atleta ajeno con la matriz completa.
- `security-regressions.test.ts` ejercita funciones puras y busca cadenas en archivos; no ejecuta los handlers/actions.

Según `docs/agents/qa.md`, falta de cobertura IDOR por action/handler es S1 (QA-012).

## Pruebas adversariales reproducidas

### Cierre sin técnica

Atleta inicia sesión E2E y envía `POST /api/sessions/<id>/finish` con `{"ratings":[]}`. Resultado: **HTTP 200 `{ok:true}`**. El servidor solo valida elementos recibidos y no exige una calificación por ejercicio; además confía en `techniqueRequired` del cliente.

### Reordenamiento de media

Con dos filas válidas en posiciones 0 y 1, admin envía orden inverso. Resultado: **HTTP 400**. La primera actualización suma 100, pero `exercise_media_limits` restringe position a 0…5. La respuesta incluye SQL, tabla y parámetros internos.

### Escritura parcial sin transacción

Atleta tenía rutina activa `QA técnica`. Se envió un constructor con UUID de ejercicio inexistente. El insert final falló por FK, pero la BD quedó con la rutina anterior archivada y una rutina nueva activa con día sin ejercicios. Esto demuestra pérdida de consistencia por ausencia total de transacciones.

### Derivados obsoletos tras edición

Una sesión 3×12 @10 produjo sugerencia `increase`. Dentro de 24 h se editó la serie 1 a 1 repetición; el endpoint devolvió 200, pero la sugerencia `pending increase` y los `personal_records` permanecieron sin recalcular.

## Seguridad, secretos y costo

- `.env.example` es el único env trackeado; `.secrets/` sigue ignorado.
- No se encontraron patrones de tokens o llaves privadas.
- Headers de seguridad siguen presentes; `E2E_TEST_MODE` con `VERCEL` falla rápido.
- No hay dependencias directas de Blob/KV/Postgres/Analytics/Google Cloud/telemetría.
- Dependencias directas conservan licencias permitidas.
- **Hallazgo S1:** varios catch devuelven `error.message` al cliente. Reordenar media reprodujo una consulta SQL completa con parámetros (QA-008).
- QA no ejecutó acciones contra proveedores.

## Defectos abiertos

### QA-004 — S2 — P0 funcional todavía incompleto

Faltan capacidades obligatorias: constructor/edición multi-día y multi-ejercicio con todos los campos; prefill; modo fallo; resumen numérico/PR/sugerencias; historial editable; día sugerido BR-R7; detalle completo del entrenador; cuatro gráficas y PR reales.

### QA-007 — S1 — Operaciones multi-fila sin transacción corrompen estado

No existe ninguna llamada `.transaction(` en `src/`. La prueba adversarial dejó una rutina activa incompleta tras FK fallida. También están expuestos finish+derivados, media reorder y ciclo de sugerencias.

### QA-008 — S1 — Mensajes internos de BD se filtran al cliente

Los handlers convierten `error.message` directamente en `message_es`. El PATCH de reorder devolvió la consulta SQL, nombre de tabla y UUID/parámetros. Deben mapear errores a códigos/mensajes públicos.

### QA-009 — S2 — Técnica obligatoria controlada por el cliente

`finishSession` itera únicamente `ratings` recibidos y acepta `techniqueRequired` del cliente. `ratings:[]` completa una sesión. El servidor debe leer el snapshot y exigir ratings para ejercicios con series de trabajo.

### QA-010 — S2 — Editar/borrar sets no recalcula sugerencias y PR

`upsertSet` y DELETE permiten 24 h, pero no invocan recálculo. Una sugerencia de aumento quedó pendiente después de que la sesión dejó de cumplir 3×12. Falta además UI histórica.

### QA-011 — S2 — Gestor de media no cumple reemplazar/reordenar

Reorder viola el check 0…5; reemplazar no tiene endpoint ni UI; la ficha solo ofrece upload y archivar ejercicio.

### QA-012 — S1 — Falta la matriz IDOR obligatoria por entrypoint

Las pruebas no ejecutan cada handler/action con dueño, ajeno, entrenador activo, revocado y admin. La cobertura estática/política no satisface el requisito.

## Riesgos residuales

- Auth.js registra `UnknownAction` en cada login E2E sin hacer fallar los tests.
- `databaseIdentityStore.link` hace update incondicional tras un read; callbacks concurrentes podrían competir.
- PR `max_reps_at_weight` combina `bestReps` con `maxWeight` aunque puedan venir de sets distintos.
- La CSP conserva `unsafe-inline`.

## Criterio de salida

**No desplegar.** Corregir QA-004 y QA-007…QA-012 con regresiones reales y repetir QA completa. Este es el ciclo B↔C **2 de 3**.
