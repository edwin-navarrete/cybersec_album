"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAll = void 0;
const db_1 = require("../db");
/*

    SELECT album_id, COUNT(*) AS errores
FROM user_answer
WHERE success is null or success = 0
GROUP BY album_id
UNION
SELECT album_id, 0 AS errores
FROM user_answer
WHERE album_id NOT IN (SELECT album_id FROM user_answer WHERE success = 0)
GROUP BY album_id;
*/
const findAll = (callback) => {
    const queryString = `
SELECT
    user_answer.album_id,
    SUM(CASE
        WHEN success = 0 THEN 1
        ELSE 0
    END) AS numero_de_errores,
    COUNT(user_answer.question_id) AS preguntas_respondidas,
    COUNT(user_answer.question_id) >= 14 AS finalizacion_album,
    ABS((ROUND((ABS((SUM(CASE
                        WHEN user_answer.success = 0 THEN 1
                        ELSE 0
                    END) - COUNT(user_answer.question_id)) / COUNT(user_answer.question_id)) * 100), 0) - 100))/100 AS porcentaje_error,
    SUM(latency) AS tiempo_total_de_respuesta,
    album.started_on as epocas
FROM
    user_answer
JOIN
	album ON user_answer.album_id = album.album_id
GROUP BY album_id

`;
    /*  const queryString = `
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
    GROUP BY album_id
    
    
    
      `
    */
    db_1.db.query(queryString, (err, result) => {
        if (err) {
            callback(err);
        }
        const rows = result;
        const userAnswers = [];
        rows.forEach(row => {
            const a_id = {
                album_id: row.album_id,
                error_number: Number(row.numero_de_errores),
                answered_question_number: Number(row.preguntas_respondidas),
                ended_album: Boolean(row.finalizacion_album),
                error_percentage: Number(row.porcentaje_error),
                total_response_time: Number(row.tiempo_total_de_respuesta),
                epocas: Number(row.epocas)
            };
            userAnswers.push(a_id);
        });
        callback(null, userAnswers);
    });
};
exports.findAll = findAll;
