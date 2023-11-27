/* eslint-disable no-undef */

export interface QuestionsLang {
    id: number, // Identificación de la pregunta
    type: string, // Tipo de la progunta unica o multiple
    //lang: string | undefined, // ES español o EN ingles
    question: string, // Texto de la pregunta
    options: string[], // Posibles opciones
    solution: number[], // respuestas
    dificult: GLfloat, //  Dificultad (valor entre cero y uno)
    feedback?: string, // existe feedback si no no tiene tiene problema
}
