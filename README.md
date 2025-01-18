# Ciberalbum

## Descripción

Ciberalbum es un juego para móviles (responsive) que combina un juego de trivia (preguntas y respuestas) con un álbum (colección de imágenes). Los jugadores reciben láminas de álbum por cada respuesta correcta. el juego termina cuando todas las láminas del álbum son reveladas.

Las preguntas son de selección simple y múltiple relacionadas con el tema de ciberseguridad. El álbum consiste en tiras cómicas también relacionadas con seguridad informática.

## Experiencia de Usuario

Existen dos aplicaciones. Primero el juego que consta de una ventana de registro para ingresar al juego, una ventana que representa el álbum y una que representa una pregunta. Y por otro lado la aplicación de estadísticas.

## Juego: Vista de Registro

Formulario donde el usuario ingresa el idioma que quiere para la aplicación, su pseudónimo para el juego, y el modo de juego (colaborativo o individual). 
Aparece la primera vez que se usa la aplicación. 
Si se sale y vuelve a ingresar a la app, aparece sólo con el idioma y el alias (el modo de juego no puede modificarse).

## Juego: Vista de Album
Muestra una grilla de 3x7 donde cada espacio contiene o bien una imagen de caricatura, o un espacio con interrogación, indicando que ahí se espera una imagen. Las imágenes se van agregando en el sentido de lectura (de derecha a izquierda y de arriba a abajo). Cuando una imagen nueva es agregada, aparece en gris y difuminada indicando que es una lámina ganada y que puede ser reclamada. Cuando la imagen es clickeada se vuelve a color y nítida indicando que fué reclamada.

En la parte inferior hay una barra con un botón para intentar el siguiente reto( es decir la siguiente pregunta).

CUando toda la grilla se ha completado, aparece por unos cuantos segundos un mensaje de éxito y al regresar ya no es posible responder más preguntas.

## Juego: Vista de Preguntas
La vista de pregunta contiene la pregunta junto con una nota que indica si se espera más de una respuesta, las opciones de respuesta, un temporizador que indica el tiempo que tiene para responder. 

## Estadísticas: Vista de Preguntas
En la vista de preguntas se ve el desempeño a nivel de preguntas. En concreto: cuántas veces ha sido respondida cada pregunta, qué porcentaje de éxito ha tenido, cuánto tiempo en promedio se demoran las personas en responderla. Contiene un filtro de fecha.

## Estadísticas: Vista de Tabla de posisiones
En esta vista se ve el desempeño de cada equipo o de cada jugador. En concreto: ya sea para un equipo o un individuo, tiene el porcentaje de error, número de preguntas respondidas, tiempo total dedicado en reponder preguntas, cuándo empezó a jugar el álbum y cuándo terminó. Tiene filtro para ver todos, solo equipo o sólo jugadores individuales. También se puede seleccionar el rango de fechas. 

## Modos de Juego

### Individual

En el modo individual, sólo una persona puede llenar un álbum. Se puede configurar para que pueda responder todas las preguntas que quiera o bien responder una por día laboral.

### Colaborativo

En el modo Colaborativo varios jugadores comparten el mismo álbum y lo completan por turnos, donde cada uno responde una pregunta diariamente (en días laborales).

Los jugadores del modo colaborativo son automáticamente organizados en equipos de maximo 20 personas. El juego garantiza que siempre hay al menos dos equipos activos.
Cada equipo tiene un líder, que es quien tiene el turno (se identifica en el listado de miembros del equipo porque tiene el ícono de una corona). 
El líder tiene la posibilidad de responder una y solo una pregunta. Sin importar el resultado debe pasar el turno (la corona) a otro de su propio equipo.

Todos pueden ver los miembros de su equipo y quién tiene el turno. Sólo el líder puede escoger el sucesor. Sin embargo después de un tiempo configurado en el servidor cualquiera puede tomar la corona.

## Configuración

