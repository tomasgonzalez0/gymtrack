# 04 — Modelo de datos (Postgres en Neon, Drizzle ORM)

Convenciones: `id uuid` (default `gen_random_uuid()`), `created_at/updated_at timestamptz`, nombres `snake_case`, pesos `numeric(6,2)` en kg. Migraciones SOLO con `drizzle-kit generate` y commiteadas; nunca editar una migración ya aplicada; cambios en producción siempre **aditivos**. Seeds **idempotentes** (upsert por clave natural).

## Enums
`user_role`: athlete, trainer, admin · `link_status`: pending, active, revoked · `muscle_group`, `equipment` (ver BR-E3) · `training_mode`: heavy, failure, progressive · `session_status`: in_progress, completed · `technique_rating`: good, fair, poor · `technique_source`: manual, camera · `suggestion_type`: increase, decrease, deload · `suggestion_status`: pending, accepted, dismissed, expired · `pr_type`: max_weight, max_reps_at_weight, best_e1rm · `media_kind`: image, gif

## Tablas
**users**: email (unique, guardado en minúsculas), name, image_url, google_sub (unique, null hasta el primer login), role (default athlete), rest_default_seconds (90), sound_enabled (true), unit_pref ('kg'), disabled_at, last_login_at.

**trainer_links**: trainer_id→users, athlete_id→users, status, requested_by→users, responded_at. Unique(trainer_id, athlete_id). Check trainer_id ≠ athlete_id.

**exercises**: name, slug (unique), muscle_group, secondary_muscles (text[]), equipment, instructions, technique_cues (text[]), common_mistakes (text[]), default_increment_kg (numeric(5,2) default 2.5), technique_camera_supported (bool false), created_by→users, archived_at. Índice único sobre `lower(name)` donde `archived_at is null`.

**exercise_media**: exercise_id→exercises (cascade), kind, url, contentful_asset_id (null si vino por URL manual), width, height, size_bytes, alt, position (int). Unique(exercise_id, position) deferrable o reordenar en transacción.

**routines**: athlete_id→users, created_by→users, name, goal (text), is_active, start_date, archived_at. Índice único parcial `(athlete_id) where is_active`.

**routine_days**: routine_id (cascade), name, position, weekday (0–6, null). Unique(routine_id, position).

**routine_exercises**: day_id (cascade), exercise_id→exercises (restrict), position, sets, rep_min, rep_max, rest_seconds, mode, tempo, notes, is_warmup_suggested (bool), target_weight_kg (null), increment_override_kg (null), progression_sessions_required (1), technique_required (true). Checks de BR-R2.

**workout_sessions**: athlete_id, routine_id (set null), routine_day_id (set null), day_name (snapshot), status, started_at, finished_at, notes. Índice único parcial `(athlete_id) where status='in_progress'`.

**session_exercises**: session_id (cascade), routine_exercise_id (set null), exercise_id→exercises, position, **snapshot**: exercise_name, prescribed_sets, prescribed_rep_min, prescribed_rep_max, prescribed_rest_seconds, mode; technique (null), technique_source (manual), rpe (numeric(3,1) null), notes, completed_at.

**set_logs**: session_exercise_id (cascade), set_number, weight_kg, reps, is_warmup, is_failure, logged_at. Checks de BR-S2. Unique(session_exercise_id, set_number).

**progression_suggestions**: athlete_id, exercise_id, routine_exercise_id (set null), session_id, type, from_weight_kg, suggested_weight_kg, reason (texto es), status, resolved_at. Índice único parcial `(routine_exercise_id) where status='pending'`.

**personal_records**: athlete_id, exercise_id, type, value (numeric), weight_kg, reps, session_id, achieved_at.

## Índices clave
`set_logs(session_exercise_id)`, `session_exercises(exercise_id, session_id)`, `workout_sessions(athlete_id, started_at desc)`, `trainer_links(athlete_id, status)`, `progression_suggestions(athlete_id, status)`.

## Seeds (idempotentes)
1. **Usuarios**: `SEED_ADMIN_EMAIL` (default tomasgz2006@gmail.com, rol admin) y `SEED_ATHLETE_EMAIL` (default ivannacc07@gmail.com, rol athlete), `google_sub` nulo.
2. **Vínculo**: admin→atleta, `active`.
3. **Ejercicios** (Codex redacta `instructions`, 3–5 `technique_cues` y 2–3 `common_mistakes` en español; sin media; `created_by` = admin). Formato: nombre — grupo — equipo — incremento kg.
   - Pecho: Press de banca con barra — chest — barbell — 2.5 · Press inclinado con mancuernas — chest — dumbbell — 2 · Aperturas con mancuernas — chest — dumbbell — 1 · Press en máquina de pecho — chest — machine — 2.5 · Cruce de poleas — chest — cable — 2.5 · Flexiones — chest — bodyweight — 0
   - Espalda: Jalón al pecho — back — cable — 2.5 · Remo con barra — back — barbell — 2.5 · Remo en polea baja — back — cable — 2.5 · Remo con mancuerna a una mano — back — dumbbell — 2 · Dominadas asistidas — back — machine — 2.5
   - Hombros: Press militar con mancuernas — shoulders — dumbbell — 2 · Elevaciones laterales — shoulders — dumbbell — 1 · Face pull — shoulders — cable — 2.5 · Elevaciones posteriores — shoulders — dumbbell — 1
   - Brazos: Curl con mancuernas — biceps — dumbbell — 1 · Curl martillo — biceps — dumbbell — 1 · Curl con barra Z — biceps — barbell — 2.5 · Extensión de tríceps en polea — triceps — cable — 2.5 · Press francés — triceps — barbell — 2.5 · Patada de tríceps — triceps — dumbbell — 1
   - Pierna y glúteo: Sentadilla con barra — quads — barbell — 5 · Sentadilla goblet — quads — dumbbell — 2 · Prensa de piernas — quads — machine — 5 · Zancadas con mancuernas — quads — dumbbell — 2 · Sentadilla búlgara — quads — dumbbell — 2 · Extensión de cuádriceps — quads — machine — 2.5 · Curl femoral — hamstrings — machine — 2.5 · Peso muerto rumano — hamstrings — barbell — 2.5 · Peso muerto rumano con mancuernas — hamstrings — dumbbell — 2 · Hip thrust con barra — glutes — barbell — 5 · Puente de glúteo — glutes — bodyweight — 0 · Abducción en máquina — glutes — machine — 2.5 · Patada de glúteo en polea — glutes — cable — 2.5 · Elevación de talones — calves — machine — 5
   - Core: Crunch en polea — abs — cable — 2.5 · Elevación de piernas colgado — abs — bodyweight — 0 · Crunch abdominal — abs — bodyweight — 0
4. **Rutina de ejemplo** para el atleta (inactiva, creada por el admin): "Full body A (ejemplo)" con 1 día de 5 ejercicios, para que el entrenador vea cómo luce. No se activa sola.
