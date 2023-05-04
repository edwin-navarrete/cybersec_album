import { UserAnswer } from '../types/user_answer';
import {db} from "../db";
import { RowDataPacket } from "mysql2";


// Método en reemplazo del hook useSort, por medio del cual se ejecutaban un
// ordenamiento según instrucciones, sobre el erray en bruto extraído
// de la BD.
function sortArray(dataToSort: any) {
	if (dataToSort.length > 0) {
		// Organización por menor tiempo que se hace primero para hacer el descarte
		dataToSort.sort(function (a: any, b: any) {
			return a.total_response_time - b.total_response_time;
		});
		//Organización por porcentaje de errores, que son los errores de un usuario
		//con respecto a las respuestas respondidas
		dataToSort.sort(function (a: any, b: any) {
			return a.error_percentage - b.error_percentage;
		});
		//Organización por terminación del album (album finalizado o no)
		dataToSort.sort(function (a: any, b: any) {
			if (a.ended_album > b.ended_album) {
				return -1;
			}

			if (a.ended_album < b.ended_album) {
				return 1;
			}
		});
	}
	return addRank(dataToSort);
}
//Método que añade posiciones al array organizado
function addRank(arrayData: any) {
	let position = 1;
	for (let index = 0; index < arrayData.length; index++) {
		const element = arrayData[index];
		element.rank = position++;
	}
	// console.log(arrayData)
	return arrayData;
}

export const findAll = (callback: Function) => {
const queryString = `
SELECT
    user_answer.album_id,
    SUM(CASE
        WHEN success = 0 THEN 1
        ELSE 0
    END) AS numero_de_errores,
    COUNT(user_answer.question_id) AS preguntas_respondidas,
    COUNT(user_answer.question_id) >= 14 AS finalizacion_album,
    ABS((ROUND((ABS((SUM(CASE
                        WHEN user_answer.success = 0 THEN 1
                        ELSE 0
                    END) - COUNT(user_answer.question_id)) / COUNT(user_answer.question_id)) * 100), 0) - 100)) AS porcentaje_error,
    SUM(latency) AS tiempo_total_de_respuesta,
    album.started_on as epocas
FROM
    user_answer
JOIN
	album ON user_answer.album_id = album.album_id
GROUP BY album_id

`

/*  const queryString = `
  SELECT
    album_id,
    SUM(CASE
        WHEN success = 0 THEN 1
        ELSE 0
    END) AS numero_de_errores,
    COUNT(question_id) AS preguntas_respondidas,
    CASE
        WHEN COUNT(question_id) >= 14 THEN 'sí'
        ELSE 'no'
    END AS finalizacion_album,
    ABS((ROUND((ABS((SUM(CASE
                        WHEN success = 0 THEN 1
                        ELSE 0
                    END) - COUNT(question_id)) / COUNT(question_id)) * 100), 0) - 100)) AS porcentaje_error,
    SUM(latency) AS tiempo_total_de_respuesta
FROM
    user_answer
GROUP BY album_id



  `
*/
    db.query(queryString, (err, result) => {
      if (err) {callback(err)}

      const rows = <RowDataPacket[]> result;
      const userAnswers: UserAnswer[] = [];

      rows.forEach(row => {
        const a_id: UserAnswer = {
          album_id: row.album_id,
          error_number: Number(row.numero_de_errores),
          answered_question_number: Number(row.preguntas_respondidas),
          ended_album: Boolean(row.finalizacion_album),
          error_percentage: Number(row.porcentaje_error),
          total_response_time: Number(row.tiempo_total_de_respuesta),
          epocas: Number(row.epocas)

        }
          userAnswers.push(a_id);
      });
      callback(null, sortArray(userAnswers));
    });
  }
