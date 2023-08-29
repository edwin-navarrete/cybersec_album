"use strict";
/*
El nuevo entrypoint tiene la siguiente estructura:

GET /questions?since=2022-03-04

{
   "questionId": ".. ",  // Identificación de la pregunta
   "question": ".. ",  // Texto de la pregunta en español
   "attempts":  #  // Número de veces que la pregunta se ha intentado
   "avgLatency": # // Tiempo promedio en segundo que la gente necesita para responder esta pregunta
   "successProb": # //  La probabilidad de tener éxito respondiendo esta pregunta (valor entre cero y uno)
}
since: fecha para considerar los datos sólo después de la fecha dada, es opcional, si no está se consideran todos los datos disponibles.

Para los textos de las preguntas se va a usar el resultado del issue Issue 54
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAll = void 0;
const db_1 = require("../db");
const findAll = (callback, date) => {
    const queryString = `

SELECT
    q.id AS questionId,
    q.question,
    COUNT(ua.question_id) AS attempts,
    AVG(ua.latency / 1000) AS avgLatency,
    SUM(CASE WHEN ua.attempts > 0 THEN 1 ELSE 0 END) / COUNT(ua.question_id) AS successProb
FROM
    question q
LEFT JOIN
    user_answer ua ON q.id = ua.question_id
WHERE
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM user_answer ua
            WHERE DATE(FROM_UNIXTIME(ua.answered_on/1000)) = STR_TO_DATE("${date}", '%d/%m/%Y')
        )
        THEN DATE(FROM_UNIXTIME(ua.answered_on/1000)) = STR_TO_DATE("${date}", '%d/%m/%Y')
        ELSE 1 = 1
    END
GROUP BY
    q.id, q.question;

`;
    db_1.db.query(queryString, (err, result) => {
        if (err) {
            callback(err);
        }
        const rows = result;
        const questions = [];
        rows.forEach(row => {
            const a_id = {
                questionId: row.questionId,
                question: row.question,
                attempts: row.attempts,
                avgLatency: row.avgLatency,
                successProb: row.successProb //  La probabilidad de tener éxito respondiendo esta pregunta (valor entre cero y uno)
            };
            questions.push(a_id);
        });
        callback(null, questions);
    });
};
exports.findAll = findAll;
