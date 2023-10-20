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

import { Questions, QuestionsLang } from '../types/questions';
import { db } from "../db";
import { RowDataPacket } from "mysql2";


    export const getQuestionsByDates = ( since:string, to:string) => {    
        
        return new Promise((resolve, reject) => {
    
        since = (since ?? '1970/01/01')||'1970/01/01';
        to = (to ?? '3000/01/01')||'3000/01/01';

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
            ua.answered_on BETWEEN UNIX_TIMESTAMP("${since}")*1000 AND UNIX_TIMESTAMP("${to}")*1000
            GROUP BY
            q.id, q.question
            ORDER BY
            avgLatency DESC;
        `;
    
        db.query(queryString, (err, result) => {
            if (err) {
            reject(err);
            return;
            }
    
            const rows = <RowDataPacket[]>result;
            const questions: Questions[] = [];
    
            rows.forEach(row => {
            const a_id: Questions = {
                questionId: row.questionId,
                question: row.question,
                attempts: row.attempts,
                avgLatency: row.avgLatency,
                successProb: row.successProb
            };
            questions.push(a_id);
            });
    
            resolve(questions);
        });
        });
    };
    

    export const getQuestionsLang = (lang:string | null) => {    
        console.log(lang);
        if(lang !== null) 
        
        
        return new Promise((resolve, reject) => {
            let queryString = '';
        if(lang !== undefined){
            queryString = `
                SELECT
                    id AS questionId, type AS typeQ, lang, question, options, solution, difficulty,feedback
                FROM
                    question 
                WHERE
                    lang = '${lang}';  
                `;

            }else{
            queryString = `
                SELECT
                    id AS questionId, type AS typeQ, lang, question, options, solution, difficulty,feedback
                FROM
                    question
                `;
            }
    
        db.query(queryString, (err, result) => {
            if (err) {
            reject(err);
            return;
            }
    
            const rows = <RowDataPacket[]>result;
            const questions: QuestionsLang[] = [];
    
            rows.forEach(row => {
            const questionsInfo: QuestionsLang = {
                questionId:     row.questionId,
                questionType:   row.typeQ,
                lang:           row.lang,
                question:       row.question,
                options:        row.options,
                solution:       row.solution,
                dificult:       row.difficulty,
                feedback:       row.feedback,
            };
            questions.push(questionsInfo);
            });
    
            resolve(questions);
        });
        });
    };