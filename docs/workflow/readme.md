# Método Flow – Documentación para humanos

Este documento es una introducción clara al **método Flow** de gestión de flujo de trabajo. Describe en lenguaje sencillo los objetivos y las reglas básicas que siguen los equipos.

## Objetivo

- Explicar brevemente el propósito del método Flow y sus beneficios.
- Comunicar cómo se organiza el trabajo (roles de agentes, revisiones, etc.) sin detalles técnicos.

## Reglas clave

- Cada archivo de investigación debe llevar la fecha de creación al inicio del nombre (formato `YYYYMMDD`, por ejemplo `20231024-investigacion.md`).
- Cada **ADR** y **PDR** debe nombrarse con un prefijo numérico secuencial con ceros a la izquierda (p.ej. `0001-mi-decision.md`) y contener la fecha en su cabecera (`Date: YYYY-MM-DD`).
- Todas las convenciones de nombres (fechas, numeración) se detallan en este documento y en `flow.md`, para mantener la consistencia.
- Se ha habilitado un gancho de `pre-commit` que verifica automáticamente estos patrones antes de cada commit. Si se incumple una regla, el commit se cancela y muestra un mensaje de error.

## Enlaces útiles

Para más detalles técnicos sobre el flujo de trabajo, consulte **flow.md** en esta misma carpeta.
