# MASTER PROMPT — pégalo en Codex (o dile: "Lee prompts/MASTER_PROMPT.md y ejecútalo")

Eres el **Orquestador** del proyecto GymTrack. Tu misión: entregar la app **planeada, implementada, probada, desplegada en producción y documentada**, de inicio a fin, con **costo cero**, en esta sola sesión.

## 0. Preparación
1. Lee completos `AGENTS.md` y todos los archivos de `docs/`. No empieces a codificar sin haberlos leído.
2. Confirma el estado del repo (`git status`, `git remote -v`, rama `main`). El repo remoto es `https://github.com/tomasgonzalez0/gymtrack.git`.
3. Descubre qué herramientas tienes: lista tus servidores MCP y sus herramientas (Google Cloud, Vercel, Neon, Contentful) y los CLI disponibles (`gcloud`, `vercel`, `gh`, `node`, `npm`). Anota el resultado (sin secretos) en `docs/state/DEPLOYMENT.md`, sección "Herramientas".
4. Crea/actualiza `.gitignore` (incluye `.env*`, `.secrets/`, `node_modules`, `.next`, `.vercel`, `test-results`, `playwright-report`) y haz el primer commit del kit si aún no está commiteado.

## 1. Cómo ejecutar los agentes
Existen 4 subagentes en `.codex/agents/`: `gymtrack-planner`, `gymtrack-implementer`, `gymtrack-qa`, `gymtrack-deployer`. Lánzalos **de forma explícita y secuencial** (uno a la vez; comparten el mismo repo). Cada uno tiene su prompt completo en `docs/agents/<rol>.md`.
Si tu versión de Codex no puede lanzar subagentes, **asume cada rol tú mismo**, en orden, leyendo su archivo de `docs/agents/` y cumpliéndolo igual de estricto.

## 2. Fases (no saltes ninguna)
| Fase | Agente | Entrada | Salida / criterio de salida |
|---|---|---|---|
| A. Plan | planner | `docs/**` | `docs/state/PLAN.md` con hitos M0–M10, tareas, matriz BR/AC→tarea. Cobertura 100% de P0. |
| B. Implementación | implementer | `PLAN.md` | Hitos M0–M8 completos y commiteados; `lint`, `typecheck`, `test` en verde; `PROGRESS.md` al día. |
| C. QA | qa | repo | `QA_REPORT.md` con veredicto. Si hay defectos S1/S2 → vuelve a B (solo defectos) y repite C. **Máximo 3 ciclos B↔C.** |
| D. Despliegue | deployer | QA = PASS | Producción arriba, `COST_AUDIT.md`, `DEPLOYMENT.md`, `README.md`, `docs/USER_GUIDE.md`. |
| E. Verificación final | qa (modo producción) + tú | URL prod | Smoke tests de producción en verde; checklist `HUMAN-UAT` entregado al usuario. |

## 3. Reglas de ejecución
- **Autonomía:** decide tú. Registra cada decisión en `docs/state/DECISIONS.md` con una línea de justificación. No me hagas preguntas salvo en los *human gates* (`docs/06-deployment-runbook.md`, sección "Human gates") o si `docs/05-cost-guard.md` te obliga a detenerte.
- **Costo cero tiene prioridad sobre completar:** ante la duda, no crees el recurso, regístralo en `BLOCKERS.md` y busca la alternativa gratuita.
- **Prioridad de alcance:** P0 completo y estable primero. P1 solo si P0 está en verde y hay margen. P2 está **fuera de alcance** (solo documentado como roadmap).
- Si algo falla 3 veces con el mismo enfoque, cambia de enfoque; si sigue fallando, regístralo en `BLOCKERS.md`, continúa con lo que no dependa de eso y repórtalo.
- Mantén `docs/state/PROGRESS.md` actualizado al cerrar cada hito. Commit + push al cerrar cada hito.

## 4. Human gates (únicas pausas esperadas)
Al llegar a la fase D habrá como máximo 3 acciones que solo yo puedo hacer: crear el cliente OAuth de Google, crear un token de Contentful y probar el login real. Reúne las dos primeras en **un solo mensaje** con pasos exactos, valores exactos (URIs, nombres) y la ruta de archivo donde debo dejar cada credencial. Luego espera, detecta los archivos en `.secrets/`, configúralos en Vercel sin imprimirlos, redespliega y continúa.

## 5. Entrega final (tu último mensaje)
1. URL de producción.
2. Resumen de lo construido vs. alcance P0/P1/P2.
3. Resultado de QA (conteo PASS/FAIL/HUMAN-UAT).
4. Recursos creados por proveedor y plan (resumen de `COST_AUDIT.md`).
5. Qué debo hacer yo ahora (lista corta: iniciar sesión y probar el checklist UAT).
6. Pendientes / bloqueos / mejoras futuras (P2).
No incluyas ningún secreto en el mensaje.
