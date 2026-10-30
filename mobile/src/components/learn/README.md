# Aprende

Contenido editorial: `docs/aprende` en la raíz del repositorio.

Después de editar los Markdown, ejecutar desde `mobile`:

```sh
node scripts/build-lessons.cjs
node tests/learn-content.cjs
node tests/learn-score.cjs
```

El JSON generado se incluye en la app para lectura sin conexión. Las actividades se implementan en `Activity.tsx`; si cambia su contenido editorial también hay que actualizar la interacción correspondiente.

El progreso se guarda con AsyncStorage por identificador de usuario y versión. Incluye respuestas, tarjeta de lectura y finalización. La sincronización con Supabase queda pendiente. El repaso con Nutty es un acompañamiento local con explicaciones y ejemplos escritos, sin conexión a un modelo de IA.

Ruta: `/learn`, parámetros `lesson` y `view`. El libro abre la lista; la ardilla central abre el repaso cuando hay una lección seleccionada.

Las lecciones 1 a 4 son de acceso libre. Desde la 5 se requiere completar la inmediatamente anterior (enviar su quiz, sin exigir nota mínima). El bloqueo se aplica tanto a la tarjeta como al acceso directo a la ruta. Las tarjetas muestran los quizzes enviados sobre el máximo de 3; un quiz en curso se indica por separado.

Cada lección admite tres quizzes enviados. El historial conserva respuestas originales, nota y fecha de cada envío; los resultados previos a este historial cuentan como el primer quiz. Un quiz pausado conserva su lugar y no consume otro intento. Los intentos 2 y 3 rotan el orden de preguntas y opciones, manteniendo las respuestas por su índice original para corregirlas. La puntuación utiliza el mejor resultado, sin duplicar puntos por repetir. Después del tercer envío siguen disponibles las explicaciones y los resultados guardados.
