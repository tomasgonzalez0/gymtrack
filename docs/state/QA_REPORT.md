# QA REPORT — predespliegue

Fecha: 2026-10-25  
Modo: QA independiente, predespliegue  
Commit evaluado: `39453a0`  
Veredicto: **FAIL**

## Resumen ejecutivo

Las puertas mecánicas pasan en un clon limpio, pero la aplicación no implementa la mayor parte del alcance P0. La UI es principalmente una maqueta con datos constantes; no existen servicios, consultas ni mutaciones para vínculos, ejercicios, rutinas, sesiones, sugerencias, progreso o ajustes. Además, un atleta autenticado puede abrir rutas de entrenador, administración y recursos con identificadores arbitrarios. Hay **3 defectos S1** y **3 defectos S2** abiertos, por lo que no se autoriza el despliegue.

Conteo AC: **13 PASS · 28 FAIL · 4 BLOCKED · 2 HUMAN-UAT**.

## Puertas automáticas

La instalación directa en `Documents` encontró bloqueos de archivos de Windows (`ENOTEMPTY`/`EPERM`). Para separar el entorno del producto se clonó el commit, sin cambios, en `%LOCALAPPDATA%/Temp/gymtrack-qa-20261025` y allí se repitió la instalación limpia.

| Puerta | Resultado | Evidencia |
|---|---|---|
| `npm ci` | PASS | 482 paquetes instalados desde `package-lock.json` |
| `npm run lint` | PASS | ESLint, 0 warnings |
| `npm run typecheck` | PASS | TypeScript sin errores |
| `npm run test` | PASS | 7 archivos, 39 pruebas |
| `npm run build` | PASS | Next.js 16.4.3, 23 rutas compiladas |
| `npm run test:e2e` | PASS insuficiente | 2/2; solo `/login` y ausencia de overflow |
| `npm audit --omit=dev` | PASS | 0 high, 0 critical; 0 vulnerabilidades de producción |

## Matriz de aceptación

| AC | Estado | Evidencia |
|---|---|---|
| AC-01 | FAIL | El callback Google no vincula el usuario seed ni persiste `google_sub`; QA-002 |
| AC-02 | PASS | `canSignIn` rechaza email fuera de allowlist; prueba `auth.test.ts` |
| AC-03 | PASS | `/hoy` sin sesión devuelve 307 a `/login` |
| AC-04 | FAIL | Las páginas no llaman `requireUser`; un cambio de rol no controla las vistas |
| AC-05 | FAIL | Atleta fixture obtuvo 200 en rutas admin/trainer e IDs arbitrarios; QA-001 |
| AC-06 | FAIL | No hay operaciones de vínculo ni consultas de atleta; QA-001/QA-004 |
| AC-07 | FAIL | Botones/formulario sin action ni persistencia |
| AC-10 | FAIL | Biblioteca usa `demoExercises`; no hay CRUD |
| AC-11 | FAIL | Upload no guarda fila ni existe galería persistida; QA-003 |
| AC-12 | FAIL | No existen endpoints de reordenar, reemplazar o quitar |
| AC-13 | FAIL | `currentCount` viene del cliente y JPEG inválido recibe dimensiones ficticias; QA-003/QA-006 |
| AC-14 | FAIL | No existe operación de archivar/borrar ejercicio |
| AC-20 | FAIL | Constructor estático; “Guardar rutina” no ejecuta nada |
| AC-21 | FAIL | `/hoy` y `/rutina` muestran constantes, no la rutina del atleta |
| AC-22 | FAIL | Zod tiene límites, pero ningún flujo los usa |
| AC-23 | FAIL | Índice parcial existe; no hay activación transaccional ni flujo |
| AC-24 | FAIL | Esquema incluye snapshot; no hay inicio/edición real de sesión/rutina |
| AC-25 | FAIL | El atleta no puede crear ni editar rutinas |
| AC-30 | FAIL | UI local con valores fijos; no inicia ni registra sesión en BD |
| AC-31 | FAIL | Temporizador usa timestamp en memoria, pero se pierde al recargar y no usa valor real del ejercicio |
| AC-32 | FAIL | Validación solo cliente; el resumen es accesible directamente |
| AC-33 | FAIL | Resumen, volumen, PR y sugerencia son constantes |
| AC-34 | FAIL | No existen acciones de editar/borrar sets ni recálculo |
| AC-35 | FAIL | No existe resolución de sesiones de más de 12 horas |
| AC-36 | FAIL | Exploratorio: serie marcada no sobrevivió la recarga; el efecto sobrescribe el borrador |
| AC-40 | PASS | Fixture independiente: 3×12 @10, técnica buena, RPE 8 → 12 kg |
| AC-41 | PASS | Prueba unitaria de técnica `fair` y mensaje exacto |
| AC-42 | PASS | Prueba unitaria RPE 10 → `hold` |
| AC-43 | PASS | Prueba unitaria de dos sesiones bajas → `decrease` |
| AC-44 | FAIL | No hay persistencia ni acciones aceptar/descartar |
| AC-45 | PASS | Pruebas unitarias de 1 vs. 2 sesiones requeridas |
| AC-46 | PASS | Métricas/progresión excluyen calentamientos |
| AC-50 | FAIL | Gráfica contiene un arreglo constante; no consulta fixtures ni BD |
| AC-51 | FAIL | Botones de rango no filtran datos |
| AC-52 | FAIL | PR y estados son constantes; no hay consulta ni estado vacío real |
| AC-60 | PASS | Manifest standalone con iconos declarados 192/512/maskable y SW shell-only |
| AC-61 | PASS | Playwright 375×812 sin overflow; controles principales de sesión >=44 px |
| AC-62 | PASS | Labels, foco visible y navegación básica verificados en la maqueta |
| AC-63 | FAIL | Copy disperso fuera de `messages/es.ts` y “CHECK” visible en diagnóstico |
| AC-70 | BLOCKED | Requiere URL y DB de producción; handler compila |
| AC-71 | BLOCKED | Forma local Vercel devolvió solo Google; falta comprobar Vercel real |
| AC-72 | PASS | Cinco headers presentes; ningún secreto real trackeado ni encontrado por patrones |
| AC-73 | PASS | `npm audit --omit=dev`: 0 high/critical |
| AC-74 | BLOCKED | `COST_AUDIT.md` corresponde a despliegue y todavía no existe |
| AC-75 | BLOCKED | README y USER_GUIDE corresponden a M10 y todavía no existen |
| AC-76 | HUMAN-UAT | Login real de las dos cuentas, posterior a despliegue |
| AC-77 | HUMAN-UAT | Upload real en Contentful, posterior a despliegue |

## Auditoría IDOR: acciones y handlers

Solo existen tres route handlers: Auth.js, `GET /api/health` y `POST /api/exercises/[id]/media`. No existen server actions ni repositorios de dominio.

| Superficie | Autenticación/autorización | Cobertura adversarial | Resultado |
|---|---|---|---|
| Páginas `/entrenador/**` | Solo sesión en proxy; sin rol ni vínculo | Atleta fixture → 200 | FAIL S1 |
| `/admin/diagnostico` | Solo sesión en proxy; sin rol admin | Atleta fixture → 200 | FAIL S1 |
| `/sesion/[id]`, `/historial/[id]` | Solo sesión; ignora ID y dueño | ID arbitrario → 200 | FAIL S1 |
| `POST /api/exercises/[id]/media` | `requireRole`, pero sin comprobar ejercicio/creador | No hay test de propio/ajeno/admin | FAIL S1 |
| Auth.js | Allowlist pura; sin enlace DB | No hay integración Google↔usuario seed | FAIL S1 |
| Health | Público por diseño, respuesta redactada | Revisión estática | PASS local |

La prueba `auth.test.ts` comprueba funciones puras con tres casos, no las operaciones/handlers exigidas para dueño, ajeno, entrenador activo, revocado y admin.

## Seguridad, archivos y costo

- Headers CSP, `nosniff`, referrer, frame y permissions: presentes.
- Configuración con forma de Vercel (`VERCEL=1`) y secreto QA: `/api/auth/providers` devolvió únicamente `google`.
- `.env.example` es el único `.env*` trackeado; `.secrets/` está ignorado. No se encontraron tokens, llaves privadas ni credenciales reales por patrones.
- Dependencias directas: licencias MIT/Apache-2.0/ISC. No hay SDK directo de Blob/KV/Postgres/Analytics/Google Cloud. La mención `@vercel/postgres` del lockfile es un peer opcional de Drizzle, no una dependencia instalada/activada.
- Upload hostil: magic bytes y tamaño tienen unit tests, pero faltan doble extensión, SVG, archivo enorme real, JPEG pequeño/corrupto y todas las matrices de autorización.
- No se ejecutó ninguna acción sobre proveedores durante QA.

## Verificación numérica independiente

Para 3 series de 12 repeticiones a 10 kg: volumen manual `10×12×3 = 360 kg`; e1RM Epley `10×(1+12/30) = 14 kg`; incremento 2 kg → `12 kg`. La implementación devolvió exactamente `360`, `14` e `increase → 12`. Esta lógica pura sí es consistente, pero no está integrada con sesiones persistidas.

## Exploratorio móvil

- Login y sesión no presentan overflow a 375×812.
- Un atleta fixture pudo abrir `/entrenador`, `/admin/diagnostico`, `/entrenador/atletas/other` y `/sesion/demo` con HTTP 200.
- Doble toque deja el botón visualmente marcado, pero no hay request ni idempotencia de servidor.
- Al recargar después de completar una serie, el estado volvió a inicial y el borrador almacenado fue sobrescrito.
- Los campos de peso/reps de la sesión no tienen validación de dominio conectada; aceptan valores que jamás llegan al servidor.
- La simulación offline/red lenta no puede validar reintento o consistencia porque no existe una operación de red para sets.

## Defectos

### QA-001 — S1 — Autorización de rutas y recursos ausente

**Pasos:** autenticar el proveedor fixture como atleta y solicitar `/entrenador`, `/admin/diagnostico`, `/entrenador/atletas/other` y `/sesion/demo`.  
**Esperado:** 403/redirección según rol, vínculo activo y propiedad.  
**Actual:** todas responden 200; las páginas ignoran IDs y sirven datos demo.  
**Evidencia:** `src/proxy.ts` solo comprueba sesión; ninguna página llama helpers; prueba HTTP QA.

### QA-002 — S1 — Login Google no vincula el usuario de BD

**Pasos:** revisar callback `signIn`/`jwt` y flujo `requireUser`.  
**Esperado:** buscar email seed, verificar/establecer `google_sub`, colocar el UUID de `users.id` en el JWT y rechazar conflicto.  
**Actual:** `signIn` solo evalúa allowlist; no lee/escribe BD. El JWT toma el ID/sub del proveedor y `requireUser` intenta compararlo con `users.id`.  
**Impacto:** primer login y cualquier handler que use `requireUser` no forman un flujo funcional; BR-A3 incumplida.

### QA-003 — S1 — Upload de media permite IDOR y evade el máximo

**Pasos:** trainer autenticado envía POST a un ejercicio ajeno/inexistente con `currentCount=0`.  
**Esperado:** comprobar existencia, creador/admin y conteo real en BD; guardar `exercise_media` en transacción.  
**Actual:** el ID solo entra en el título de Contentful, el conteo es controlado por cliente y no se escribe ninguna fila. No hay test propio/ajeno/revocado/admin.  
**Impacto:** consumo no autorizado de cuota y assets huérfanos; AC-05/11/13.

### QA-004 — S2 — Núcleo P0 es una maqueta sin operaciones

**Pasos:** usar biblioteca, vínculos, constructor, sesión, historial, progreso, ajustes y dashboard.  
**Esperado:** leer/escribir Neon mediante servicios autorizados.  
**Actual:** vistas y gráficas usan constantes; botones carecen de actions/handlers. Solo existen consultas de auth, health y seed.  
**Impacto:** fallan AC-07, 10–14, 20–25, 30, 32–35, 44 y 50–52.

### QA-005 — S2 — Sesión y temporizador no persisten ni validan

**Pasos:** marcar una serie, observar timer y recargar.  
**Esperado:** reanudar sesión y timer por timestamp; mantener el borrador y sincronizar BD.  
**Actual:** el componente escribe `localStorage` pero nunca lo lee; al montar sobrescribe el valor con tres filas iniciales. El timer también vuelve a cero.  
**Impacto:** AC-31 y AC-36.

### QA-006 — S2 — Validación/cobertura de media incompleta

**Pasos:** pasar un buffer que solo contiene magic bytes JPEG.  
**Esperado:** rechazar archivo inválido o leer dimensiones reales; rechazar ancho <320.  
**Actual:** `readDimensions` devuelve 320×320 por defecto para todo JPEG, por lo que la restricción puede eludirse. Tampoco hay pruebas de archivo enorme real ni doble extensión.  
**Impacto:** AC-13 y BR-E5.

## Riesgos residuales

- El esquema tiene varias restricciones, pero no se probaron seed idempotente real, snapshots, FK `SET NULL`, sugerencia pendiente única, sesión única ni matriz transaccional.
- Las 2 pruebas E2E solo abren `/login`; no prueban login, atleta, entrenador, CRUD, sesión, progreso ni regresiones.
- Auth.js v5 beta está fijado, pero no existe integración con PGlite/Neon para callbacks.
- La CSP permite `unsafe-inline`; no bloquea esta entrega, pero debe revisarse antes de producción.

## Criterio de salida

**No desplegar.** Volver a implementación, corregir todos los S1/S2 con pruebas de regresión y repetir QA completa. Este es el ciclo B↔C número 1 de un máximo de 3.
