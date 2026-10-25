# AGENTS.md — GymTrack

## Qué es
GymTrack es una web app (PWA) de gimnasio de uso privado para dos personas (Tomás y su pareja), con arquitectura multiusuario lista para crecer:
- **Atleta**: ve la rutina del día, registra series (peso/reps), usa temporizador de descanso, califica técnica y esfuerzo, ve gráficas de progreso y recibe avisos de "sube el peso".
- **Entrenador**: dashboard para gestionar la biblioteca de ejercicios (con imágenes/GIFs) y crear/editar rutinas de los atletas vinculados.
- **Admin**: Tomás. Todo lo anterior + diagnóstico del sistema.

## Objetivo de la tarea
Planear, implementar, probar (QA) y **desplegar en producción** la app completa, con documentación de uso, **sin generar ningún costo** en Google Cloud, Vercel, Neon ni Contentful. El resultado final es una URL en producción lista para usar + `docs/USER_GUIDE.md`.

## Idioma
- Documentación, UI y mensajes al usuario: **español (es-CO)**.
- Código, nombres de variables/tablas/columnas, mensajes de commit: **inglés**.

## Fuentes de verdad (léelas completas antes de actuar)
| Archivo | Contenido |
|---|---|
| `docs/01-product-brief.md` | Alcance (P0/P1/P2), pantallas, rutas |
| `docs/02-business-rules.md` | Reglas de negocio (BR-*), permisos, progresión |
| `docs/03-architecture.md` | Stack, estructura, seguridad, variables de entorno |
| `docs/04-data-model.md` | Tablas, enums, restricciones, seeds |
| `docs/05-cost-guard.md` | **Qué se puede y no se puede crear (costo cero)** |
| `docs/06-deployment-runbook.md` | Aprovisionamiento y despliegue, human gates |
| `docs/07-qa-plan.md` | Criterios de aceptación (AC-*), estrategia de pruebas |
| `docs/08-user-guide-outline.md` | Esquema de la guía de usuario final |
| `docs/agents/*.md` | Prompts completos de cada agente |
| `docs/state/*.md` | Estado compartido entre agentes (plan, progreso, decisiones, bloqueos) |

**Precedencia ante conflicto:** `AGENTS.md` > `05-cost-guard` > `02-business-rules` > `04-data-model` > `03-architecture` > resto. Ante un conflicto o ambigüedad: elige la opción más segura y barata, regístrala en `docs/state/DECISIONS.md` y continúa. No detengas el trabajo para preguntar, salvo en los *human gates* y *blockers* definidos en `docs/06-deployment-runbook.md`.

## Reglas no negociables
1. **Costo cero.** Antes de crear/habilitar/cambiar CUALQUIER recurso en cualquier MCP o CLI, aplica `docs/05-cost-guard.md`. Si no puedes demostrar que es gratuito, NO lo hagas y regístralo en `docs/state/BLOCKERS.md`.
2. **Secretos.** Nunca imprimas, commitees ni pegues en logs/PRs/docs valores de secretos. Los secretos viven en `.secrets/` (gitignored), en variables de entorno de Vercel o en `.env.local` (gitignored). Verifica que `.gitignore` los excluya ANTES del primer commit.
3. **Autorización en el servidor.** Todo acceso a datos pasa por helpers de autorización que leen el rol desde la base de datos. Nunca confíes en datos del cliente ni solo en el JWT.
4. **Sin acciones destructivas** sobre producción (drop, truncate, force-push, borrar proyectos/recursos existentes que no creaste tú).
5. **Inventario antes de crear.** Lista (solo lectura) lo que ya existe en cada proveedor y reutiliza antes de crear. No toques recursos que pertenezcan a otros proyectos del usuario.
6. **Pruebas reales.** Nunca debilites, borres ni saltes un test para ponerlo en verde. Nunca desactives autorización o validaciones para que algo pase.
7. **Sin telemetría de terceros**, sin scripts externos, sin servicios de pago, sin dependencias abandonadas o de licencia restrictiva.

## Comandos estándar (los scripts de `package.json` DEBEN existir con estos nombres)
`npm run dev` · `build` · `start` · `lint` · `typecheck` · `test` (unit+integración con PGlite) · `test:e2e` (Playwright) · `test:all` · `db:generate` · `db:migrate` · `db:seed` · `smoke:contentful` · `smoke:prod`

Gestor de paquetes: **npm** (con `package-lock.json` commiteado). Node ≥ 20.

## Flujo de trabajo y estado compartido
Los agentes (planificador → implementador → QA → desplegador) se pasan el trabajo mediante archivos en `docs/state/`:
`PLAN.md` · `PROGRESS.md` · `DECISIONS.md` · `BLOCKERS.md` · `QA_REPORT.md` · `DEPLOYMENT.md` · `COST_AUDIT.md`.
Cada agente lee el estado al empezar y lo actualiza al terminar. Commits pequeños y frecuentes (Conventional Commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`), rama `main`.

## Definición de "terminado"
- Todos los criterios AC-* de `docs/07-qa-plan.md` marcados PASS en `docs/state/QA_REPORT.md` (los que requieren humano, en estado `HUMAN-UAT` con instrucciones).
- App desplegada en Vercel (Hobby) con DB Neon (Free) y login con Google funcionando.
- `docs/state/COST_AUDIT.md` demuestra costo cero.
- `README.md` y `docs/USER_GUIDE.md` escritos; repo en GitHub con todo pusheado y tag `v1.0.0`.
