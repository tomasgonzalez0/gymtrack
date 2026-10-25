export const messages = {
  brand: "GymTrack", navToday: "Hoy", navRoutine: "Rutina", navExercises: "Ejercicios", navProgress: "Progreso", navHistory: "Historial", navSettings: "Ajustes",
  loginTitle: "Entrena con intención", loginAction: "Continuar con Google", denied: "Tu cuenta no tiene acceso.", loading: "Cargando…", empty: "Todavía no hay información para mostrar.",
  errorGeneric: "Algo salió mal. Intenta de nuevo.", save: "Guardar", cancel: "Cancelar", finish: "Finalizar sesión", technique: "Técnica", rpe: "Esfuerzo (RPE)",
  increase: "¡Buen trabajo! Ya puedes subir el peso.", fair: "Buen volumen. Lleva la técnica a 'buena' para subir de peso.", hold: "Sigue así: cada repetición cuenta.",
} as const;
export type MessageKey = keyof typeof messages;
