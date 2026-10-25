# 07 — Plan de QA y criterios de aceptación

## Estrategia
| Capa | Herramienta | Qué cubre |
|---|---|---|
| Unit | Vitest | Progresión (≥ 15 casos), e1RM, validaciones Zod, helpers de fechas/permisos |
| Integración | Vitest + PGlite | Consultas, transacciones, **matriz de autorización (IDOR)**, restricciones de BD, seed idempotente |
| E2E | Playwright (móvil 375×812 y escritorio 1280×800) | Flujos completos con login de prueba (`E2E_TEST_MODE`) |
| Seguridad | scripts + revisión | Subida de archivos, headers, secretos, `npm audit --omit=dev`, providers de auth |
| Costo | revisión estática + `COST_AUDIT` | Sin SDKs/config facturables |
| Producción | `smoke:prod` + UAT humano | Salud, redirecciones, login real |

Severidades: **S1** bloqueante/seguridad/datos · **S2** funcionalidad P0 rota · **S3** menor · **S4** cosmético. Salida de QA: **0 S1/S2 abiertos**, S3/S4 documentados.

## Criterios de aceptación (estado: PASS / FAIL / BLOCKED / HUMAN-UAT)
**Acceso**
- AC-01 Usuario de la allowlist inicia sesión con Google (E2E con login de prueba; real en UAT).
- AC-02 Email fuera de la allowlist es rechazado sin crear usuario.
- AC-03 Rutas protegidas redirigen a `/login` sin sesión.
- AC-04 El rol se lee de la BD: cambiar el rol en BD surte efecto sin re-login.
- AC-05 (IDOR) Un atleta no puede leer ni modificar sesiones, rutinas o sugerencias de otro, en TODAS las acciones/handlers.
- AC-06 Un entrenador solo accede a atletas con vínculo `active`; tras revocar, pierde acceso de inmediato.
- AC-07 Solicitud/aceptación/revocación de vínculo funcionan por ambas partes con mensajes neutrales.

**Biblioteca**
- AC-10 Entrenador crea/edita/archiva ejercicio con todos los campos; atleta solo lee.
- AC-11 Subir imagen y GIF → aparece en la ficha y en la sesión; GIF animado sin transformar.
- AC-12 Reordenar, reemplazar y quitar media funciona; portada = posición 0.
- AC-13 Se rechazan: tipo no permitido, MIME falsificado (magic bytes), > 5 MB, > 6 imágenes, host de URL manual no permitido.
- AC-14 Ejercicio usado en historial se archiva, no se borra; el historial conserva el nombre.

**Rutinas**
- AC-20 Entrenador crea rutina para atleta vinculado (días, ejercicios, series, rango, descanso, modo, tempo, notas, peso objetivo).
- AC-21 El atleta ve esa rutina en `/hoy` y no puede editarla (solo aceptar sugerencias).
- AC-22 Validaciones BR-R2 con mensajes en español; avisos no bloqueantes de modo `heavy`.
- AC-23 Solo una rutina activa por atleta.
- AC-24 Editar una rutina no altera sesiones pasadas (snapshot).
- AC-25 El atleta puede crear y editar sus propias rutinas desde la biblioteca.

**Sesión**
- AC-30 Iniciar sesión de entreno; peso/reps prellenados (BR-R8); registrar serie en ≤ 2 toques.
- AC-31 Temporizador de descanso usa el valor del ejercicio, sobrevive a pantalla bloqueada (timestamps) y ofrece ±15 s/saltar.
- AC-32 No se puede finalizar sin técnica en ejercicios con series (si `technique_required`).
- AC-33 Finalizar muestra resumen con volumen, PRs y sugerencias.
- AC-34 Editar/borrar series hasta 24 h después; recalcula sugerencias.
- AC-35 Sesión en curso > 12 h se autocompleta o elimina según BR-S5.
- AC-36 Recargar la página no pierde la sesión en curso.

**Progresión (valores de prueba exactos)**
- AC-40 Rango 8–12, 3 series; 3×12 @10 kg, técnica buena, RPE 8, incremento 2 → sugerencia `increase` a **12 kg**.
- AC-41 Igual con técnica `fair` → sin aumento + mensaje BR-P3.
- AC-42 Igual con RPE 10 → sin aumento.
- AC-43 Dos sesiones con ≥ mitad de series bajo `rep_min` → `decrease`.
- AC-44 Aceptar sugerencia fija `target_weight_kg`; descartar no la repite hasta nueva evaluación.
- AC-45 `progression_sessions_required = 2` exige dos sesiones consecutivas.
- AC-46 Calentamientos no influyen en progresión/volumen/PR.

**Progreso**
- AC-50 Con fixture conocida, las 4 gráficas muestran valores exactos (peso máx., reps, e1RM, volumen).
- AC-51 Cambio de rango (4 sem/3 m/6 m/todo) filtra correctamente.
- AC-52 Estados vacíos y PRs correctos.

**UX/PWA/A11y**
- AC-60 Manifest válido e instalable; íconos 192/512/maskable.
- AC-61 A 375 px sin scroll horizontal; objetivos táctiles ≥ 44 px en sesión.
- AC-62 Formularios con etiquetas, foco visible, contraste AA; navegable con teclado.
- AC-63 Todos los textos en español; sin llaves de i18n visibles.

**Seguridad/Costo/Despliegue**
- AC-70 `/api/health` OK en producción.
- AC-71 `/api/auth/providers` en producción solo lista Google; `E2E_TEST_MODE` ausente en Vercel.
- AC-72 Headers de seguridad presentes; sin secretos en el repo ni en el HTML (escaneo de patrones).
- AC-73 `npm audit --omit=dev` sin high/critical.
- AC-74 `COST_AUDIT.md` completo, todo `FREE`.
- AC-75 `README.md` y `docs/USER_GUIDE.md` existen y están completos.
- AC-76 Login real de ambas cuentas en producción → `HUMAN-UAT`.
- AC-77 Subida real de una imagen a Contentful desde producción → `HUMAN-UAT`.

## Checklist HUMAN-UAT (se entrega al usuario al final)
1. Entrar con Tomás → ver `/entrenador` con su pareja como atleta.
2. Crear un ejercicio nuevo y subirle una imagen y un GIF; verlo en la biblioteca.
3. Crear una rutina de 2 días para su pareja con modos Pesado/Al fallo/Progresivo.
4. Entrar con la cuenta de su pareja en el celular → instalar la PWA → empezar la sesión de hoy.
5. Registrar series, usar el temporizador, calificar técnica y finalizar.
6. Repetir con 3×tope de reps y técnica "buena" → ver el aviso "sube el peso" y aceptarlo.
7. Ver gráficas en `/progreso` y, como Tomás, ver el progreso de su pareja.
8. Revocar el vínculo y comprobar que Tomás pierde acceso; volver a vincular.
