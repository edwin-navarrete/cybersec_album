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
Muestra una grilla de 3x7 donde cada espacio contiene o bien una imagen de caricatura, o un espacio con interrogación, indicando que ahí se espera una imagen. Las imágenes se van agregando en el sentido de lectura (de derecha a izquierda y de arriba a abajo). Cuando una imagen nueva es agregada, aparece en gris y difuminada indicando que es una lámina ganada y que puede ser reclamada. Cuando la imagen se le hace click se vuelve a color y nítida indicando que fué reclamada.

En la parte inferior hay una barra con un botón "ganar láminas" para intentar el siguiente reto (es decir la siguiente pregunta).

Cuando toda la grilla se ha completado, aparece por unos cuantos segundos un mensaje de éxito y al regresar ya no es posible responder más preguntas.

## Juego: Vista de Preguntas
La vista de pregunta contiene la pregunta junto con una nota que indica si se espera más de una respuesta (la app soporta sólo preguntas de múltiple respuesta o de opción única), las opciones de respuesta con un cuadro de chequeo cada una y un temporizador que indica el tiempo que tiene para responder, el cual se determina basado en la dificultad de la pregunta. En la barra inferior, si se está en el modo colaborativo, aparece el botón para ir a la vista de equipo.

### Retroalimentación
Cuando un jugador da click a la (o las) respuesta(s), inmediatamente la respuesta correcta se resalta y se muestra junto con las erradas que se muestran tachadas. Debajo aparece un mensaje de felicitación con la recompensa obtenida (el nuevo número de láminas que tiene para reclamar) en caso de que la respuesta fué correcta ó un texto de retroalimentación (si la pregunta la tiene configurada) más una invitación a seguir intentando. En la barra inferior se agregan dos botones: un botón parpadeante para reclamar láminas (que simplemente redirige a la vista de álbum) y otro para ir a la siguiente pregunta llamado "nuevo reto". Por supuesto en modo colaborativo habría un tercer botón, el de ir a la vista de equipo. 

## Juego: Vista de Equipo
La vista de equipo muestra el nombre del equipo (automáticamente generado) y la lista completa de los miembros del equipo. El líder del equipo aparece con un ícono de corona junto a su nombre y el tiempo que ha estado vigente como líder. Al frente de cada uno aparece el botón para elegir el nuevo líder, lo cual es posible si el jugador actual no es el líder y si el líder ha sido el líder por más del tiempo especificado en gameConfig.leaderTimeout (24h inicialmente).  

## Estadísticas: Vista de Preguntas
En la vista de preguntas se ve el desempeño a nivel de preguntas. En concreto: cuántas veces ha sido respondida cada pregunta, qué porcentaje de éxito ha tenido, cuánto tiempo en promedio se demoran las personas en responderla. Contiene un filtro de fecha, para dar los resultados teniendo en cuenta únicamente la información recolectada en un día específico.

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

## Casos de uso

### Juego individual, turnos ilimitados, recompensa sequencial y estrategia de prueba thompson
* Cuando ingresa al juego el jugador se registra en la Vista de Registro seleccionando modo de juego individual y lenguaje.
* En la vista de álbum, el jugador ve la primera imagen del álbum y el resto de casillas con signos de interrogación indicando que aún no ha adquirido ninguno de los demás stickers. Cuando ha ingresado por primera vez y por unos segundos, aparece un personaje de caricatura en la parte inferior izquierda invitando a comenzar el juego y junto a él en la barra inferior aparece el botón parpadeante "ganar láminas". Puede hacer desplazar verticalmente la vista de la grilla de láminas hasta el final del álbum, la barra inferior permanece inmóvil.  
* Cuando se pulsa el botón 
* Cuando se pulsa el botón 

### Juego coperativo, turnos por dia laboral
Cada jugador se registra 

## Configuración

La configuración de la lógica del juego en el client se encuentra actualmente en features/game/gameConfig.json
La configuración de la app está en un archivo de ambiente .env, los parámetros 

### gameConfig.json

Contiene la configuración que determina el comportamiento del juego, tiene los siguientes campos:
```
{
    "rewardStrategy" : "sequential",
    "rewardSchema": "difficulty",
    "quizStrategy": "thompson",
    "coopTokenStrategy": "bussinessDays",
    "soloTokenStrategy": "unlimited",
    "leaderTimeout": 86400000
}
```
* rewardStrategy: "sequential" | "randomWeigthed". Determina en qué orden se entregan las láminas al jugador. Sequential da como recompensa las láminas en orden consecutivo de modo que el álbum se llena en orden de escritura es decir de izquierda a derecha y luego de arriba a abajo. randomWeigthed entrega láminas en orden aleatorio dándole mayor probabilidad a las láminas que tienen mayor peso (weight).
* rewardSchema: "difficulty" | "latency". Determina cuántas láminas se entregan al jugador por cada éxito. difficulty da más láminas dependiendo del campo difficulty. latency da más láminas si el tiempo en responder la pregunta es más corto. El mapeo de dificultad a número de láminas ó de latencia a número de láminas está en hard-code en la clase (sticker.ts) Reward en su constructor.
* quizStrategy: "randomUnseen" | "easiestUnseen" | "thompson". Determina cómo se genera la siguiente pregunta. randomUnseen busca aleatoriamente entre las preguntas que aún no se han visto y como último recurso escoge cualquiera al azar. easiestUnseen retorna la de mínima dificultad que aún no se ha visto aún y como último recurso una al azar. thompson usa thompson sampling de modo que las preguntas más difíciles se ven con mayor frecuencia que las demás, y al principio las que nunca se han visto tienen mayor probabilidad. Esta última es recomendable para aprendizaje.
* soloTokenStrategy: "unlimited" | "bussinessDays". Es el permiso para ver preguntas en un juego colaborativo. Unlimited no tiene restricción alguna, el jugador puede ver cualquier cantidad de preguntas sin límite. bussinessDays sólo permite ver una única pregunta por cada día laboral (de lunes a viernes). 
* coopTokenStrategy: "unlimited" | "bussinessDays". Es el permiso para ver preguntas en un juego colaborativo. Es igual que en el caso de solo pero para bussinessDays el líder es primero asignado al siguiente día Lunes y cuando se pasa el liderazgo el nuevo líder puede responder los martes y así sucesivamente. En otras palabras depende del ordinal del líder actual.
* leaderTimeout: El tiempo en milisegundos que se garantiza que el líder no va a cambiar. Después de superado ese tiempo el líder puede ser destronado por otro miembro del equipo.

### server/.env
Variables de ambiente de configuración del servidor del juego. Ejemplo:
```
DB_HOST=localhost
DB_PWD=mypass
DB_USER=root
DB_NAME=cyberalbum
PORT=8000
SERVER_PATH=
CAPTCHA_SECRET=
REACT_APP_API=/api
```
* DB_HOST, DB_PWD, DB_USER, DB_NAME host name, credenciales y nombre de la base de datos donde residen los datos del cyberalbum
* PORT puerto para ejecutar el servidor Node
* SERVER_PATH el prefijo para todos los requests publicados por este servidor Node, por ejemplo si dice /api entonces las preguntas se obtienen con /api/question?lang=es
* CAPTCHA_SECRET La llave privada de gcaptcha asignada por Google. Si está vacía se deshabilita la seguridad de los requests y cualquier llamada es aceptada.

### client/.env
Variables de ambiente de configuración de la app cliente del juego.
```
REACT_APP_API=http://localhost:8000/api 
CAPTCHAKEY=  
```
* REACT_APP_API URL donde se encuentra el servidor
* CAPTCHAKEY La llave pública de gcaptcha asignada por Google. Requerida para conectarse a un servidor que tenga configurada CAPTCHA_SECRET