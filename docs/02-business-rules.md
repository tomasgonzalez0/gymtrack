# 02 — Reglas de negocio

Cada regla tiene ID (`BR-*`) para trazarla a tareas (PLAN) y pruebas (QA). Valores por defecto entre paréntesis.

## 1. Acceso y roles
- **BR-A1** Solo inicia sesión quien tenga email (comparación case-insensitive) en `ALLOWED_EMAILS` o un registro `users` existente y no deshabilitado. Otros → pantalla "Tu cuenta no tiene acceso" (sin revelar detalles).
- **BR-A2** El email de Google debe venir verificado (`email_verified = true`).
- **BR-A3** Primer login: se vincula el registro `users` sembrado por email y se guarda `google_sub`. Si el email existe con otro `google_sub` → rechazar.
- **BR-A4** El rol SIEMPRE se lee de la base de datos en cada acción/consulta. El JWT solo lleva `userId`.
- **BR-A5** Seed: `tomasgz2006@gmail.com` → `admin`; `ivannacc07@gmail.com` → `athlete`; vínculo `active` Tomás (entrenador) → pareja (atleta).
- **BR-A6** Todo usuario es atleta de sí mismo (puede tener rutinas y sesiones propias). `trainer` y `admin` añaden capacidades.

### Matriz de permisos
| Acción | Atleta | Entrenador (vinculado) | Admin |
|---|---|---|---|
| Ver/editar su perfil y ajustes | ✓ | ✓ | ✓ |
| Ver biblioteca de ejercicios | ✓ | ✓ | ✓ |
| Crear ejercicio global | ✗ | ✓ | ✓ |
| Editar/archivar ejercicio y su media | ✗ | solo los que creó | todos |
| Crear rutina propia | ✓ | ✓ | ✓ |
| Crear/editar rutina de un atleta | solo las que él creó | ✓ si vínculo `active` | ✓ |
| Registrar/editar sesiones | solo propias | ✗ (nunca en nombre de otro) | ✗ |
| Ver sesiones/progreso de un atleta | solo propios | ✓ si vínculo `active` | ✓ |
| Aceptar/descartar sugerencias de progresión | propias | ✗ (puede fijar peso objetivo en la rutina) | ✗ |
| Solicitar/aceptar/revocar vínculo | ✓ (como atleta) | ✓ (como entrenador) | ✓ |
| Ver `/admin/diagnostico`, promover usuarios | ✗ | ✗ | ✓ |

## 2. Vínculo entrenador↔atleta
- **BR-L1** Estados: `pending`, `active`, `revoked`. Único por par (entrenador, atleta).
- **BR-L2** Cualquiera de las dos partes puede iniciar (por email de la otra) y la otra debe aceptar. Solo usuarios con rol `trainer`/`admin` pueden ser entrenadores. Mensajes de error neutrales (no revelar si un email existe).
- **BR-L3** Cualquiera de las dos partes puede revocar. Al revocar, el entrenador pierde **de inmediato** el acceso a datos del atleta; las rutinas que creó permanecen en la cuenta del atleta en solo lectura.
- **BR-L4** Un atleta puede tener varios entrenadores activos; las rutinas muestran quién las creó.

## 3. Biblioteca de ejercicios
- **BR-E1** Nombre único (case-insensitive) entre no archivados; genera `slug`.
- **BR-E2** Un ejercicio referenciado por rutinas o sesiones **no se borra**: se **archiva** (`archived_at`). Archivado = oculto en el selector, pero el historial conserva su nombre. Borrado físico solo si no está referenciado.
- **BR-E3** Campos: `muscle_group` ∈ {chest, back, shoulders, biceps, triceps, forearms, quads, hamstrings, glutes, calves, abs, full_body}; `equipment` ∈ {barbell, dumbbell, machine, cable, bodyweight, kettlebell, band, other}; `instructions` (texto), `technique_cues` (lista, 2–6 puntos), `common_mistakes` (lista), `default_increment_kg` (2.5; mancuernas 1–2), `technique_camera_supported` (false; reservado P2).
- **BR-E4** Solo ejercicios por repeticiones (no por tiempo) en esta versión.
- **BR-E5 Media:** máx. 6 por ejercicio; tipos `image/jpeg|png|webp|gif`; ≤ 5 MB; ancho mínimo 320 px; validar por **magic bytes**, no solo por extensión/MIME; `alt` obligatorio (por defecto, el nombre del ejercicio); la de `position` 0 es la portada; se puede reordenar.
- **BR-E6** Quitar media: se elimina la fila; el borrado del asset en Contentful es *best effort* (si falla, se registra y no bloquea).
- **BR-E7** Ejercicio sin media es válido: se muestra placeholder y el entrenador ve la insignia "sin imagen".
- **BR-E8** Fallback manual: se permite registrar media pegando una URL **solo** si su host es `images.ctfassets.net`.

## 4. Rutinas
- **BR-R1** Una rutina pertenece a un atleta (`athlete_id`) y registra quién la creó (`created_by`). Máximo **una activa** por atleta (índice único parcial). Activar otra archiva la anterior (no la borra).
- **BR-R2** Límites: 1–7 días por rutina; 1–15 ejercicios por día; series 1–10; `rep_min` ≥ 1, `rep_min` ≤ `rep_max` ≤ 50; descanso 0–600 s (paso 5); `tempo` ≤ 20 caracteres; notas ≤ 500.
- **BR-R3 Modos de entrenamiento** (`mode`):
  - `heavy` **Pesado**: pocas reps con carga alta. Sugerido: reps 3–6, descanso 150 s.
  - `failure` **Al fallo**: la **última serie de trabajo** se lleva al fallo técnico (se marca `is_failure`). Sugerido: reps 8–12, descanso 90 s.
  - `progressive` **Progresivo**: doble progresión dentro del rango de reps. Sugerido: reps 8–12, descanso 90 s.
  Son *defaults* editables. Avisos NO bloqueantes: `heavy` con `rep_max` > 8 o descanso < 90 s.
- **BR-R4** Cada ejercicio de rutina puede tener `target_weight_kg` (peso objetivo actual), `increment_override_kg`, `progression_sessions_required` (1–3, **default 1**) y `technique_required` (default true).
- **BR-R5** Editar una rutina afecta solo sesiones futuras. `session_exercises` guarda **snapshot** de lo prescrito (nombre, series, rango, descanso, modo) para que el historial no cambie.
- **BR-R6** Borrar un día/ejercicio de rutina con historial es válido (FK `SET NULL`; el snapshot conserva los datos).
- **BR-R7 Día sugerido ("Hoy"):** si los días tienen `weekday`, el del día actual (zona `America/Bogota`); si no, el siguiente en orden al de la última sesión completada (cíclico). Siempre se puede elegir otro día.
- **BR-R8** Prefill de peso: `target_weight_kg` si existe; si no, el peso de trabajo de la última sesión de ese ejercicio; si no, vacío.

## 5. Sesiones y registro
- **BR-S1** Una sola sesión `in_progress` por atleta; al intentar otra se ofrece reanudar.
- **BR-S2** Serie: `weight_kg` 0–500 (paso 0.25; 0 = peso corporal), `reps` 1–100, `is_warmup`, `is_failure`. Las series de calentamiento se excluyen de progresión, volumen y récords.
- **BR-S3** Series editables/borrables mientras la sesión está en curso y hasta 24 h después de finalizarla; cualquier cambio recalcula sugerencias y récords de esa sesión.
- **BR-S4** Al terminar cada ejercicio con series de trabajo: **técnica** (`good`/`fair`/`poor`, obligatoria para finalizar la sesión si `technique_required`) y **RPE** opcional (5–10, paso 0.5). Los `technique_cues` se muestran como checklist orientativo. Origen siempre `manual` en esta versión (`camera` reservado P2).
- **BR-S5** Sesión `in_progress` > 12 h: si tiene ≥ 1 serie se autocompleta (`finished_at` = última serie; ejercicios sin técnica no generan sugerencias de subida); si no tiene series, se elimina. Se resuelve al cargar `/hoy`.
- **BR-S6 Temporizador de descanso:** arranca al registrar una serie de trabajo con el descanso del ejercicio (o el default del usuario); se calcula con timestamps (correcto en segundo plano); controles +15 s / −15 s / saltar; al terminar: vibración + beep (WebAudio) si el usuario lo permite.
- **BR-S7** Zona horaria de presentación y agrupación por día: `America/Bogota`. Se guarda `timestamptz`.

## 6. Motor de progresión (función pura en `src/lib/progression/`)
Definiciones: **series de trabajo** = no calentamiento. **W** = mayor peso usado en series de trabajo del ejercicio en la sesión. **Series en W** = series de trabajo con peso W. **e1RM** (Epley) = `peso × (1 + reps/30)`; si reps = 1, `peso`.

- **BR-P1** Se evalúa al completar la sesión (y al editar series) por cada `session_exercise` completado.
- **BR-P2 Subir (`increase`)** si TODO se cumple:
  1. nº de series en W ≥ series prescritas, y **todas** con `reps ≥ rep_max` (el tope del rango);
  2. `technique = good` (si `technique_required`);
  3. `rpe` nulo o ≤ 9;
  4. se cumple 1–3 en las últimas `progression_sessions_required` sesiones **consecutivas completadas** de ese ejercicio con el mismo W.
  Peso sugerido = `W + (increment_override_kg ?? default_increment_kg)`, redondeado a 0.25.
- **BR-P3** Si cumple reps pero `technique = fair` → NO subir; mensaje: "Buen volumen. Lleva la técnica a 'buena' para subir de peso." Si `poor` → NO subir; mostrar `technique_cues` y sugerir mantener o bajar.
- **BR-P4 Bajar (`decrease`)**: en las 2 sesiones consecutivas más recientes con el mismo W, al menos la mitad de las series de trabajo quedaron por debajo de `rep_min`, **o** técnica `poor` en ambas. Peso sugerido = `W − incremento` (mínimo 0).
- **BR-P5 Mantener (`hold`)**: en cualquier otro caso no se crea sugerencia; la UI muestra progreso: "Te faltan N reps para subir".
- **BR-P6 Ciclo de vida**: máx. una sugerencia `pending` por ejercicio de rutina; se crea al finalizar la sesión y se muestra en el resumen, en `/hoy` y en la tarjeta del ejercicio de la siguiente sesión ("Hoy prueba X kg"). **Aceptar** → `target_weight_kg = sugerido`, estado `accepted`. **Descartar** → `dismissed`; no se repite hasta evaluar una sesión nueva. Una nueva evaluación reemplaza (`expired`) la pendiente anterior.
- **BR-P7 (P1) Deload**: 4 sesiones consecutivas sin mejora de e1RM de la mejor serie ni de reps totales al mismo W → sugerencia `deload` (`W × 0.9`, redondeado) con explicación.
- **BR-P8** El entrenador ve las sugerencias de sus atletas vinculados pero solo el atleta las acepta; el entrenador puede fijar `target_weight_kg` directamente en la rutina.
- **BR-P9** La función de progresión debe tener pruebas unitarias para todos los casos anteriores (≥ 15 casos, incluidos bordes: peso mixto, calentamientos, RPE 10, técnica nula, sesiones no consecutivas).

## 7. Gráficas y récords
- **BR-C1** Por ejercicio y solo con sesiones `completed`: (a) peso máximo de trabajo por sesión, (b) reps de la mejor serie y reps totales por sesión, (c) e1RM de la mejor serie, (d) volumen = Σ peso×reps de series de trabajo.
- **BR-C2** Rangos: 4 semanas, 3 meses, 6 meses, todo. Tooltip con fecha y series (peso×reps). Marcadores en sesiones con récord y en aumentos de peso. Estado vacío amable.
- **BR-C3** Vista global: sesiones por semana y volumen semanal (últimas 12 semanas).
- **BR-PR1** Récords por ejercicio: peso máximo (reps ≥ 1), máx. reps a un peso dado, mejor e1RM. Se detectan al completar la sesión y se muestran como insignia en el resumen.

## 8. Privacidad
- **BR-V1** Datos visibles solo para su dueño, entrenadores con vínculo `active` y admin. Sin analítica ni scripts de terceros.
- **BR-V2** El usuario puede exportar sus datos (P1) y revocar vínculos en cualquier momento.
