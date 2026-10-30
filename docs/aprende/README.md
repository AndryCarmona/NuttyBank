# Aprende con Nutty

Propuesta de contenido para el apartado **Aprende** de NuttyBank. Estos documentos contienen las lecciones y su comportamiento editorial; todavía no implementan pantallas ni conectan el asistente.

## Recorrido

**Lecciones → elegir una → explorar y practicar → quiz → resumen de respuestas → repasar con Nutty.**

En la lista, cada tarjeta muestra título, descripción, duración estimada, intentos de quiz enviados (X/3) y estado: «Por explorar», «En curso», «Completada» o «Bloqueada». Las primeras cuatro lecciones son de acceso libre. A partir de la lección 5 hay que completar el quiz de la inmediatamente anterior, sin exigir una nota mínima.

| Orden | Lección | Descripción de la tarjeta | Tiempo estimado |
| --- | --- | --- | --- |
| 1 | [¿A dónde se va mi dinero?](01-mapa-de-tu-dinero.md) | Distingue lo que recibes, gastas y debes. | 5 min |
| 2 | [Un plan que sí cabe en tu vida](02-presupuesto-flexible.md) | Organiza tu dinero aunque tus ingresos cambien. | 6 min |
| 3 | [Pequeños gastos, decisiones tuyas](03-compras-con-intencion.md) | Decide qué compras valen la pena para ti. | 5 min |
| 4 | [De «algún día» a una meta](04-metas-de-ahorro.md) | Convierte una idea en un ahorro alcanzable. | 6 min |
| 5 | [Un colchón para los imprevistos](05-fondo-de-emergencia.md) | Prepárate poco a poco para lo inesperado. | 5 min |
| 6 | [Tu tarjeta no es dinero extra](06-credito-con-cuidado.md) | Entiende fechas, pagos y compromisos. | 7 min |
| 7 | [Las primeras semillas de inversión](07-primeros-pasos-inversion.md) | Explora crecimiento, tiempo y riesgo. | 7 min |
| 8 | [Detective de ofertas sospechosas](08-protege-tu-dinero.md) | Aprende a detenerte y verificar antes de pagar. | 5 min |

## Cómo presentar cada lección

Mostrar cada «Tarjeta» de contenido por separado, con botones **Anterior** y **Continuar** e indicador «Paso X de Y». Nutty acompaña con una frase breve; el texto debe poder leerse sin animaciones ni audio.

La actividad permite probar, recibir una explicación y volver a intentarlo. No requiere introducir ingresos reales ni vincular una cuenta. Cuando se propone arrastrar elementos, ofrecer también selección por botones.

En el quiz, mostrar una pregunta por pantalla y permitir revisar las respuestas antes de pulsar **Ver mis resultados**. No revelar soluciones hasta enviar las tres respuestas. Los apartados «Clave editorial» de cada archivo son para construir la corrección: no deben mostrarse junto a la pregunta.

## Resumen de respuestas

Mostrar «Respondiste correctamente X de 3», seguido de las tres preguntas. En cada una, incluir la respuesta elegida, la correcta y su explicación. Usar texto e iconos, no únicamente rojo y verde.

| Resultado | Mensaje de Nutty |
| --- | --- |
| 3 de 3 | «¡Muy bien! Ya tienes una nueva herramienta para decidir. Puedes volver cuando la necesites.» |
| 2 de 3 | «Ya entendiste buena parte. Revisemos esa idea que todavía podemos aclarar.» |
| 0 o 1 de 3 | «Probaste algo nuevo. Vamos con calma: cada respuesta nos dice qué conviene practicar.» |

Las preguntas incorrectas muestran el comentario específico de su clave editorial y esta invitación:

> ¿Quieres entenderlo con otro ejemplo? Toca a Nutty, la ardilla del centro de la barra inferior, y repasamos esta pregunta juntos.

Acciones: **Volver a la explicación**, **Reintentar quiz** y **Volver a lecciones**. La lección cuenta como completada al consultar el resumen, sin exigir una calificación mínima. El progreso educativo no depende de ahorrar o gastar dinero real.

## Continuación con Nutty

Cuando se implemente el asistente, conservar el contexto de la pregunta desde la que se pidió ayuda: identificador de lección y pregunta, enunciado, opción elegida, opción correcta y concepto por reforzar. No necesita movimientos bancarios para explicar estos ejercicios.

Cada lección incluye una «Guía para Nutty». El asistente debe explicar el razonamiento con un ejemplo nuevo, hacer una pregunta breve para comprobar comprensión y ofrecer volver al resumen. Si hay varios errores, empezar por el que el usuario seleccione. Sin errores, puede profundizar en el tema que elija.

Hasta que esa conexión exista, la interfaz no debe afirmar que Nutty ya recibió las respuestas. Este es el flujo propuesto, no una funcionalidad terminada.

## Criterios de contenido

- Español cercano, ejemplos originales en pesos mexicanos (MXN), sin exigir conocimientos previos.
- Respetar distintas capacidades económicas. No equiparar dificultades de dinero con falta de disciplina.
- Distinguir ejercicios con números de recomendaciones personales. Las tasas inventadas se identifican expresamente.
- No imponer porcentajes universales, prometer rendimientos ni presentar productos concretos como la mejor opción.
- Introducir los términos financieros antes de evaluarlos; cada pregunta tiene una sola respuesta correcta.
- Usar las fuentes al final de cada lección como lectura adicional, fuera del quiz.

Los textos son una propuesta original. Las referencias institucionales respaldan los conceptos generales; no implican aval de NuttyBank. Conviene revisar fuentes y condiciones financieras antes de publicar o actualizar el módulo.
