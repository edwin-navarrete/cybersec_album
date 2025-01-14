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
exports.getQuestionsByDates = void 0;
const db_1 = require("../db");
const getQuestionsByDates = (since, to) => {
    return new Promise((resolve, reject) => {
        // NOTE 2038-01-18 is the limit for DB working UNIX_TIMESTAMP with 32 bits
        since = (since !== null && since !== void 0 ? since : '1970-01-01') || '1970-01-01';
        to = (to !== null && to !== void 0 ? to : '2038-01-18') || '2038-01-18';
        const queryString = `
            SELECT
                q.id AS questionId,
                q.question,
                COUNT(ua.question_id) AS attempts,
                AVG(ua.latency / 1000) AS avgLatency,
                SUM(ua.success) / COUNT(ua.question_id) AS successProb
            FROM question q
            LEFT JOIN vw_user_answer ua ON q.id = ua.question_id
            WHERE
                ua.answered_on BETWEEN UNIX_TIMESTAMP("${since}")*1000 AND UNIX_TIMESTAMP("${to}")*1000
            GROUP BY q.id, q.question
            ORDER BY avgLatency DESC;
        `;
        db_1.db.query(queryString, (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            const rows = result;
            const questions = [];
            rows.forEach(row => {
                const a_id = {
                    questionId: row.questionId,
                    question: row.question,
                    attempts: row.attempts,
                    avgLatency: parseFloat(row.avgLatency),
                    successProb: parseFloat(row.successProb)
                };
                questions.push(a_id);
            });
            resolve(questions);
        });
    });
};
exports.getQuestionsByDates = getQuestionsByDates;
//# sourceMappingURL=questions_model.js.map