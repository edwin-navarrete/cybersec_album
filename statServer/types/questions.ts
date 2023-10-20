export interface Questions{
    questionId: number, // Identificación de la pregunta
    question: string, // Texto de la pregunta en español
    attempts: number, // Número de veces que la pregunta se ha intentado 
    avgLatency: number, // Tiempo promedio en segundos que la gente necesita para responder esta pregunta
    successProb: number, //  La probabilidad de tener éxito respondiendo esta pregunta (valor entre cero y uno)
}
export interface QuestionsLang{
    questionId:     number,     // Identificación de la pregunta
    questionType:   string,     // Tipo de la progunta unica o multiple
    lang:           string | undefined,     // ES español o EN ingles
    question:       string,     // Texto de la pregunta
    options:        string[],   // Posibles opciones
    solution:       number[],   // respuestas
    dificult:       GLfloat,    //  Dificultad (valor entre cero y uno)
    feedback?:      string,     // existe feedback si no no tiene tiene problema
}

