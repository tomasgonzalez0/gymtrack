# 05 — Cost Guard (costo cero)

**Regla de oro:** si no puedes demostrar que una acción es gratuita y que no puede generar cargos por uso, **no la ejecutes**. Regístrala en `docs/state/BLOCKERS.md` y busca la alternativa gratuita.

## Protocolo antes de cualquier acción de aprovisionamiento
1. **Inventario (solo lectura)** del proveedor: plan/organización, recursos existentes.
2. **Clasificar** la acción: `FREE` (documentada como gratuita en el plan actual) · `MAYBE` (depende de uso/plan) · `PAID`.
3. Solo `FREE` se ejecuta. `MAYBE`/`PAID` → STOP.
4. Registrar cada recurso creado en `docs/state/COST_AUDIT.md` (proveedor, tipo, nombre, plan, por qué es gratis, dónde verificarlo).
5. **Reutilizar** recursos existentes del usuario cuando corresponda; **nunca** modificar ni borrar recursos que no creaste tú.

## Por proveedor
### Neon
- Permitido: **un** proyecto (`gymtrack`) en plan **Free**, rama por defecto, 1 base de datos, rol por defecto.
- Prohibido: ramas extra, réplicas de lectura, ampliar cómputo/almacenamiento, funciones de planes de pago (IP allow, PITR extendido…), proyectos adicionales, integración vía Vercel Marketplace (puede facturarse por Vercel).
- Si la organización está en un plan de pago → STOP (cualquier recurso nuevo generaría uso facturable).

### Vercel
- Permitido: **un** proyecto `gymtrack` en **Hobby**, dominio `*.vercel.app`, variables de entorno, despliegues desde GitHub.
- Prohibido: upgrade a Pro, dominios comprados, Vercel Blob/KV/Postgres/Edge Config, Marketplace, Analytics/Speed Insights de pago, miembros adicionales, cron de pago, optimización de imágenes (usar `unoptimized`).
- Variables de entorno solo en **Production** (evita que previews usen la BD de producción).

### Contentful
- Permitido: usar un space **Community (gratuito)** existente o crear uno solo si la organización es Community; solo **assets** (no se necesitan content types). Entorno `master`.
- Prohibido: crear spaces en organizaciones con plan de pago, locales/roles extra, apps de pago del marketplace, subir assets > 5 MB, volumen masivo de assets.

### Google Cloud
- Permitido: reutilizar un proyecto existente (preferible) o crear uno **sin vincular cuenta de facturación**; crear **solo** pantalla de consentimiento OAuth y cliente OAuth web (gratuito).
- Prohibido: vincular facturación, habilitar APIs/servicios (Cloud Run, Functions, Storage, Secret Manager, Artifact Registry, Compute, BigQuery, etc.), crear cuentas de servicio con claves, presupuestos o alertas que requieran facturación.
- Si `gcloud` pide habilitar billing → STOP.

### GitHub
- Solo funciones gratuitas. Actions mínimas (un workflow CI corto). Sin Codespaces ni Copilot pagos.

## Dependencias de código
Solo paquetes open-source (MIT/Apache/BSD/ISC). Sin SDKs de servicios de pago, sin analítica, sin APIs con cuota facturable.

## Auditoría final (obligatoria en la fase D)
`docs/state/COST_AUDIT.md` debe contener: tabla de recursos creados/reutilizados, plan de cada proveedor con evidencia (salida de MCP/CLI sin secretos), lista de funciones de pago NO habilitadas, y pasos para que el usuario lo verifique en cada panel (Billing/Usage). Cualquier ítem `MAYBE` sin resolver invalida el despliegue.
