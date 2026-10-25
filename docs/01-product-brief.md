# 01 — Product brief

## Visión
Una PWA móvil-first para el gimnasio: el atleta abre la app, ve **qué toca hoy**, registra cada serie en segundos, y la app le dice **cuándo subir de peso** (solo si logró el tope de repeticiones **con buena técnica**). El entrenador gestiona rutinas y la biblioteca de ejercicios (con imágenes/GIFs de ejecución) desde un dashboard, sin tocar código.

## Usuarios iniciales
| Persona | Email | Rol inicial |
|---|---|---|
| Tomás | tomasgz2006@gmail.com | `admin` (entrenador + administración) |
| Su pareja | ivannacc07@gmail.com | `athlete`, vinculada a Tomás como entrenador (seed) |

Diseñado para N usuarios, pero registro **cerrado** (allowlist por email, `ALLOWED_EMAILS`). Abrir registro = cambio de configuración, no de código.

## Principios de UX
- Se usa en el gimnasio: una mano, manos sudadas, mala señal. Botones ≥ 44 px, texto grande, pocos toques por serie.
- Prellenar siempre (peso y reps de la última vez). Registrar una serie = máx. 2 toques.
- Móvil primero (375 px), funciona bien en escritorio (el dashboard del entrenador se usa más en escritorio).
- Español (es-CO), tono cercano. Modo claro/oscuro según el sistema.

## Alcance
### P0 — obligatorio (debe quedar desplegado y probado)
1. Login con Google + allowlist + roles (`athlete`, `trainer`, `admin`).
2. Vínculo entrenador↔atleta (seed Tomás→novia; solicitud/aceptación por email; revocable).
3. **Biblioteca de ejercicios**: CRUD por entrenador/admin; campos (grupo muscular, equipo, instrucciones, puntos clave de técnica, errores comunes, incremento sugerido); **imágenes/GIFs** (subir, reordenar, reemplazar, quitar) almacenados en Contentful, URL guardada en Neon; ~35 ejercicios seed.
4. **Constructor de rutinas**: días, ejercicios, series, rango de reps, descanso (s), modo (Pesado / Al fallo / Progresivo), tempo, notas, peso objetivo. El entrenador crea/edita rutinas de atletas vinculados; el atleta puede crear las suyas desde la biblioteca.
5. **Vista "Hoy"** + **sesión activa**: series con peso/reps (prellenados), temporizador de descanso por ejercicio, calentamiento marcable, técnica (buena/regular/mala) y RPE por ejercicio, notas, finalizar con resumen.
6. **Motor de progresión**: avisos de subir/bajar peso según reglas BR-P*; aceptar/descartar.
7. **Progreso**: gráficas por ejercicio (peso máx., reps, e1RM, volumen) con rangos de tiempo, récords personales, historial de sesiones.
8. **Dashboard del entrenador**: lista de atletas (última sesión, sugerencias pendientes), detalle de atleta (rutina, progreso, historial), biblioteca, constructor.
9. **Ajustes**: perfil, descanso por defecto, vínculos con entrenadores.
10. PWA instalable, `/api/health`, `/admin/diagnostico` (solo admin), seguridad básica (headers, validación, authz).
11. Despliegue en producción + `README.md` + `docs/USER_GUIDE.md`.

### P1 — si P0 está en verde
Cola de reintentos offline para series, wake-lock durante la sesión, duplicar rutina a otro atleta, deload (BR-P7), unidades lb (solo presentación), racha/adherencia semanal, ejercicios privados del atleta, exportar CSV, promover usuarios a entrenador desde `/admin/usuarios`.

### P2 — fuera de alcance de esta ejecución (solo roadmap en README)
Análisis de técnica con cámara (MediaPipe Pose en el navegador, video nunca sale del dispositivo), notificaciones push, medidas/fotos corporales, ejercicios por tiempo (plancha), superseries.

## Mapa de rutas
| Ruta | Quién | Descripción |
|---|---|---|
| `/login` | público | Botón "Continuar con Google" |
| `/` | auth | Redirige a `/hoy` |
| `/hoy` | atleta | Día sugerido, empezar/reanudar sesión, sugerencias pendientes |
| `/sesion/[id]` | atleta (dueño) | Sesión activa |
| `/sesion/[id]/resumen` | atleta/entrenador vinculado | Resumen, PRs, sugerencias |
| `/rutina` | atleta | Rutina activa y mis rutinas (crear/editar las propias) |
| `/ejercicios`, `/ejercicios/[id]` | auth | Biblioteca de solo lectura con imágenes |
| `/progreso`, `/progreso/[exerciseId]` | atleta | Gráficas y PRs |
| `/historial`, `/historial/[sessionId]` | atleta | Sesiones pasadas (editables 24 h) |
| `/ajustes` | auth | Perfil, descanso, vínculos |
| `/entrenador` | trainer/admin | Atletas, solicitudes, sugerencias |
| `/entrenador/atletas/[id]` (+ `/progreso`, `/historial`) | trainer vinculado/admin | Detalle de atleta |
| `/entrenador/atletas/[id]/rutinas/nueva`, `/entrenador/rutinas/[id]` | trainer vinculado/admin | Constructor de rutinas |
| `/entrenador/ejercicios`, `/nuevo`, `/[id]` | trainer/admin | CRUD de biblioteca + gestor de imágenes |
| `/admin/diagnostico` | admin | Checks de DB, Contentful, config |
| `/api/health` | público | `{status, db}` sin información sensible |

## No-objetivos
Pagos, redes sociales, chat, planes de nutrición, integración con wearables, app nativa.
