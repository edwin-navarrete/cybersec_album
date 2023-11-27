/* eslint-disable indent */
import { RowDataPacket } from 'mysql2'
import { db } from '../db'
import { QuestionsLang } from '../interfaces/questions'

export const getQuestionsLang = (lang:string | null) => {
if (lang !== null) {
    return new Promise((resolve, reject) => {
    let queryString = ''
    if (lang !== undefined) {
        queryString = `
            SELECT
                id AS questionId, type AS typeQ, lang, question, options, solution, difficulty,feedback
            FROM
                question
            WHERE
                lang = '${lang}';
            `
    } else {
        queryString = `
            SELECT
                id AS questionId, type AS typeQ, question, options, solution, difficulty,feedback
            FROM
                question
            `
    }

    db.query(queryString, (err, result) => {
        if (err) {
            reject(err)
            return
        }

        const rows = <RowDataPacket[]>result
        const questions: QuestionsLang[] = []

        rows.forEach(row => {
            const questionsInfo: QuestionsLang = {
                id: row.questionId,
                type: row.typeQ,
                question: row.question,
                options: row.options,
                solution: row.solution,
                dificult: row.difficulty,
                feedback: row.feedback
            }
            questions.push(questionsInfo)
        })

        resolve(questions)
        })
    })
    }
}
