import { Ranking } from '../types/ranking';
import {db} from "../db";
import { RowDataPacket } from "mysql2";


export const findAll = (callback: Function, date: any) => {
const queryString = `

SELECT t.*, ROW_NUMBER() OVER () AS ranking
FROM (
    SELECT a.album_id,
    a.started_on,
    a.ended_on IS NOT NULL finalizacion_album,
    COUNT(DISTINCT question_id) preguntas_respondidas,
    COUNT(DISTINCT question_id) - SUM(success) numero_de_errores,
    1 - SUM(success)/COUNT(DISTINCT question_id) porcentaje_error,
    SUM(latency)/1000 AS tiempo_total_de_respuesta
    FROM vw_user_answer ua
    JOIN album a ON ua.album_id = a.album_id
    WHERE 
        CASE
            WHEN EXISTS (
                SELECT 1
                FROM album
                WHERE DATE(FROM_UNIXTIME(started_on/1000)) = STR_TO_DATE("${date}", '%d/%m/%Y')
            )
            THEN DATE(FROM_UNIXTIME(started_on/1000)) = STR_TO_DATE("${date}", '%d/%m/%Y')
            ELSE 1 = 1
        END
    GROUP BY started_on, album_id
    ORDER BY finalizacion_album DESC, tiempo_total_de_respuesta, SUM(success)/COUNT(DISTINCT question_id) DESC
) t;

`


    db.query(queryString, (err, result) => {
      if (err) {callback(err)}
  
      const rows = <RowDataPacket[]> result;
      const ranking: Ranking[] = [];
  
      rows.forEach(row => {
        const a_id: Ranking = {
          started_on: row.started_on,
          number_errors: row.numero_de_errores,
          total_latency: row.tiempo_total_de_respuesta,
          finished: row.finalizacion_album,
          answered: row.preguntas_respondidas,
          errors: row.porcentaje_error,
          rank: row.ranking,
          album_id: row.album_id,

        }
          ranking.push(a_id);
      });
      callback(null, ranking);
    });
  }

 

