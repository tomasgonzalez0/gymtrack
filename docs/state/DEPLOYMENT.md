# DEPLOYMENT

## Herramientas

Inventario inicial del 2026-10-25 (sin secretos):

| Herramienta | Estado | Uso previsto |
|---|---|---|
| Node.js | Disponible (`v22.20.0`) | Desarrollo, pruebas y scripts |
| npm | Disponible (`11.12.1`) | Dependencias y comandos estándar |
| Git | Disponible | Control de versiones y push HTTPS |
| Google Cloud MCP | Disponible en Codex | Inventario de proyectos y OAuth, sujeto a Cost Guard |
| Vercel MCP | Disponible en Codex | Inventario y despliegue Hobby, sujeto a Cost Guard |
| Neon MCP | Disponible en Codex | Inventario y Postgres Free, sujeto a Cost Guard |
| Contentful MCP | Disponible en Codex | Inventario de spaces/assets, sujeto a Cost Guard |
| `gcloud` CLI | No disponible | Se usará MCP o human gate |
| `vercel` CLI | No disponible | Se usará MCP o `npx vercel` solo si es necesario |
| `gh` CLI | No disponible | Git HTTPS será el fallback |

## Estado inicial

- La carpeta entregada contenía el kit, pero no metadatos Git.
- Remoto objetivo: `https://github.com/tomasgonzalez0/gymtrack.git`.
- Rama objetivo: `main`.
- Los recursos de proveedores se inventariarán en modo solo lectura antes de cualquier creación.

