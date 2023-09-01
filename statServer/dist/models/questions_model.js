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
exports.getQuetionsByDates = void 0;
const db_1 = require("../db");
const getQuetionsByDates = (callback, dates) => {
    let { since, to } = dates;
    // console.log(since)
    // console.log(to)
    if (since === '' || to === '') {
        console.log('cambio de since o to');
        since = '01/01/0001';
        to = '12/12/9999';
    }
    // console.log(since)
    // console.log(to)
    console.log(dates);
    const queryString = `
    
    SELECT
        q.id AS questionId,
        q.question,
        COUNT(ua.question_id) AS attempts,
        AVG(ua.latency / 1000) AS avgLatency,
        SUM(ua.success) / COUNT(ua.question_id) AS successProb
    FROM
        question q
    LEFT JOIN
        user_answer ua ON q.id = ua.question_id
    WHERE
        CASE
            WHEN EXISTS (
                SELECT 1
                FROM user_answer ua
                WHERE DATE(FROM_UNIXTIME(ua.answered_on/1000)) BETWEEN STR_TO_DATE("${since}", '%d/%m/%Y') AND STR_TO_DATE("${to}", '%d/%m/%Y') 
            )
            THEN DATE(FROM_UNIXTIME(ua.answered_on/1000)) BETWEEN STR_TO_DATE("${since}", '%d/%m/%Y') AND STR_TO_DATE("${to}", '%d/%m/%Y')
            
        END
    GROUP BY
        q.id, q.question
    ORDER BY  avgLatency DESC   
    ;
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
    console.log(since);
    console.log(to);
};
exports.getQuetionsByDates = getQuetionsByDates;
