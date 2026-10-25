# START HERE — guía para ti (Tomás), no para Codex

## 1. Instalar el kit en el repo
```bash
git clone https://github.com/tomasgonzalez0/gymtrack.git && cd gymtrack
# copia el contenido del kit en la raíz (AGENTS.md, docs/, prompts/, .codex/)
git add . && git commit -m "chore: add codex kit" && git push -u origin main
```

## 2. Revisa tus herramientas antes de lanzar
- `node -v` (≥ 20) y `npm -v`.
- `gcloud auth list` (cuenta activa) y `git push` funcionando (credenciales de GitHub).
- En Codex, `/mcp`: deben aparecer Google Cloud, Vercel, Neon y Contentful, autenticados.
- Opcional pero recomendado: `vercel --version` y `gh auth status` (fallbacks si un MCP no alcanza).

## 3. Configuración sugerida de Codex (verifica nombres con tu versión: `codex --help`)
En `~/.codex/config.toml`: aprobación bajo petición, sandbox de escritura en el workspace y red habilitada (necesaria para `npm install`, Neon, Vercel).
```toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"
[sandbox_workspace_write]
network_access = true
```
No uses el modo "sin sandbox ni aprobaciones": prefiero que tú apruebes las acciones sobre proveedores.

## 4. Lanzar
Abre `codex` en la raíz del repo y pega: **"Lee prompts/MASTER_PROMPT.md y ejecútalo completo."**

## 5. Lo único que te va a pedir a mano (human gates)
1. Crear el **cliente OAuth de Google** (3 min) y guardar ID/secret en `.secrets/google-oauth.env`.
2. Crear un **token de gestión de Contentful** y guardarlo en `.secrets/contentful.env`.
3. **Iniciar sesión** en producción con tu cuenta y la de tu novia y recorrer el checklist UAT.
Los pasos exactos los imprime Codex en el momento (con la URL de producción real).

## 6. Después
Entra a la URL, inicia sesión con `tomasgz2006@gmail.com` (admin/entrenador). Tu novia entra con `ivannacc07@gmail.com`; ya queda vinculada contigo como atleta.
