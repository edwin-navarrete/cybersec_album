export interface Questions{
    questionId: number, // Identificación de la pregunta
    question: string, // Texto de la pregunta en español
    attempts: number, // Número de veces que la pregunta se ha intentado 
    avgLatency: number, // Tiempo promedio en segundos que la gente necesita para responder esta pregunta
    successProb: number, //  La probabilidad de tener éxito respondiendo esta pregunta (valor entre cero y uno)
}