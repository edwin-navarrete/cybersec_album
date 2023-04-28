select * from user_answer;

select album_id, count(question_id) from user_answer group by album_id; 

      

SELECT album_id, COUNT(*) AS errores, count(question_id) as preguntas_respondidas
FROM user_answer
WHERE success is null or success = 0
GROUP BY album_id;

SELECT album_id, COUNT(*) AS errores
FROM user_answer
WHERE success is null or success = 0
GROUP BY album_id
UNION
SELECT album_id, 0 AS errores
FROM user_answer
WHERE album_id NOT IN (SELECT album_id FROM user_answer WHERE success = 0)
GROUP BY album_id;

select album_id, count(question_id) as preguntas_respondidas from user_answer group by album_id;

select album_id, count(question_id) as finalizacion_album from user_answer where count(question_id) > 14;

SELECT 
    album_id, 
    COUNT(question_id) AS preguntas_respondidas,
    CASE 
        WHEN COUNT(question_id) >= 14 THEN 'sí'
        ELSE 'no'
    END AS finalizacion_album
FROM user_answer 
GROUP BY album_id;

SELECT 
    album_id,
    SUM(CASE
        WHEN success = 0 THEN 1
        ELSE 0
    END) AS numero_de_errores,
    COUNT(question_id) AS preguntas_respondidas,
    CASE
        WHEN COUNT(question_id) >= 14 THEN 'sí'
        ELSE 'no'
    END AS finalizacion_album,
    ABS((ROUND((ABS((SUM(CASE
                        WHEN success = 0 THEN 1
                        ELSE 0
                    END) - COUNT(question_id)) / COUNT(question_id)) * 100), 0) - 100)) AS porcentaje_error,
    SUM(latency) AS tiempo_total_de_respuesta
FROM
    user_answer
GROUP BY album_id;


