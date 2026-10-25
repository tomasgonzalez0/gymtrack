# PROGRESS (lo actualiza cada agente al cerrar un hito)

| Fase/Hito | Estado | Fecha | Evidencia (comandos verdes) | Notas |
|---|---|---|---|---|
| A. Plan | completado | 2026-10-25 | Fuentes leídas; versiones verificadas con `npm view`; matrices BR/AC con cobertura P0 100 % | Plan M0–M10 en `docs/state/PLAN.md`; P1 condicionado y P2 solo roadmap |
| M0 Scaffold | completado | 2026-10-25 | `lint`, `typecheck`, `test`, `build` | Next 16, TS estricto, Tailwind, Vitest/Playwright y scripts estándar |
| M1 BD | completado | 2026-10-25 | Migración Drizzle aplicada en PGlite; restricciones y seed verificados | 12 tablas, índices parciales, 39 ejercicios |
| M2 Auth/Authz | completado | 2026-10-25 | Matriz de política en Vitest; build | Auth.js Google, allowlist, rol/vínculo desde BD, doble guarda E2E |
| M3 Biblioteca+media | completado | 2026-10-25 | Validación magic bytes/host; fake smoke | Biblioteca, CMA asíncrona, límites y handler protegido |
| M4 Rutinas | completado | 2026-10-25 | Validaciones BR-R2 y avisos heavy | Vista y constructor móvil |
| M5 Sesión | completado | 2026-10-25 | Validación de sets/técnica; E2E 375/1280 | Registro rápido, borrador, timer timestamp, resumen e historial |
| M6 Progresión | completado | 2026-10-25 | 21 pruebas de métricas/progresión | Increase/decrease/hold, e1RM, volumen y calentamientos |
| M7 Progreso/Entrenador | completado | 2026-10-25 | Build; health y smoke compilados | Gráficas, historial, dashboard y diagnóstico |
| M8 PWA/Pulido | completado | 2026-10-25 | `test:all` verde; `npm audit --omit=dev`: 0 | Manifest/SW, responsive, a11y, CSP y headers |
| C. QA | pendiente | | | |
| D. Despliegue | pendiente | | | |
| E. Verificación final | pendiente | | | |
