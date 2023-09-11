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

import { RowDataPacket } from "mysql2";
import { db } from "../db";
import { Questions } from '../types/questions';


export const getQuetionsByDates = (callback: Function, since: string , to: any) => {



    since = (since ?? '1970-01-01') || '1970-01-01'
    to = (to ?? '3000-01-01') || '3000-01-01'

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
    `


    db.query(queryString, (err, result) => {
        if (err) { callback(err) }
        const rows = <RowDataPacket[]>result;
        const questions: Questions[] = [];

        rows.forEach(row => {
            const a_id: Questions = {
                questionId: row.questionId, // Identificación de la pregunta
                question: row.question, // Texto de la pregunta en español
                attempts: row.attempts, // Número de veces que la pregunta se ha intentado
                avgLatency: row.avgLatency, // Tiempo promedio en segundos que la gente necesita para responder esta pregunta
                successProb: row.successProb //  La probabilidad de tener éxito respondiendo esta pregunta (valor entre cero y uno)
            }
            questions.push(a_id);
        });
        callback(null, questions);
    });
    console.log(since)
    console.log(to)
}