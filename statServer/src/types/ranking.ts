export interface Ranking{
    started_on: number,
    ended_on:number,
    number_errors: number,
    total_latency: number,
    finished: boolean,
    answered: number,
    errors: number,
    rank: number,
    album_id: string,
    player_name: string,
    } 
/*
    "data":[
        { 
           "started_on": 1671826113976, // Fecha en la que inició el álbum 
           "total_latency":35897, // Tiempo total de respuesta, suma de las latencias a las preguntas 
           "finished": true,  // True si   
           "answered": 14,  // Número de preguntas respondidas
           "errors": 5,   // Número de preguntas que aún no se han respondido correctamente
           "rank":1,  // Posición en el ranking 
           "album_id": "cd1de1e9-85d0-4833-8270-f8e959027c4a"
        },...

        */