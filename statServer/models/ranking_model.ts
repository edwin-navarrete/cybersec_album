import { Ranking } from '../types/ranking';
import { db } from "../db";
import { RowDataPacket } from "mysql2";

export const getRankingByDate = (date: string | undefined) => {
  return new Promise<Ranking[]>((resolve, reject) => {

    const isDateProvided = date !== undefined && date !== null;
    const whereClause = isDateProvided ?
      `DATE(FROM_UNIXTIME((a.started_on - 18000000)/ 1000)) = "${date}"`
      : '1=1';
    const queryString = `
        SELECT t.*, 
        ROW_NUMBER() OVER (ORDER BY t.finalizacion_album DESC,  t.porcentaje_error ASC,t.tiempo_total_de_respuesta ASC) AS ranking
        FROM (
          SELECT  a.album_id,
          player_name,
          a.started_on,
          a.ended_on,
          a.ended_on IS NOT NULL AS finalizacion_album,
          COUNT(DISTINCT question_id) AS preguntas_respondidas,
          COUNT(DISTINCT question_id) - SUM(success) AS numero_de_errores,
          (COUNT(DISTINCT question_id) - SUM(success)) / COUNT(DISTINCT question_id) AS porcentaje_error,
          SUM(latency) / 1000 AS tiempo_total_de_respuesta
          FROM vw_user_answer ua
          JOIN album a ON ua.album_id = a.album_id
          WHERE 
              ${whereClause}  -- Se inserta la condición WHERE aquí
          GROUP BY a.album_id, player_name, a.started_on, a.ended_on
        ) t
        ORDER BY t.finalizacion_album DESC, t.porcentaje_error ASC,t.tiempo_total_de_respuesta ASC;
        `;

    db.query(queryString, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      const rows = <RowDataPacket[]>result;
      const ranking: Ranking[] = [];

      rows.forEach(row => {
        const a_id: Ranking = {
          started_on: row.started_on,
          ended_on:row.ended_on,
          number_errors: row.numero_de_errores,
          total_latency: row.tiempo_total_de_respuesta,
          finished: row.finalizacion_album,
          answered: row.preguntas_respondidas,
          errors: row.porcentaje_error,
          rank: row.ranking,
          album_id: row.album_id,
          player_name: row.player_name,
        };
        ranking.push(a_id);
      });
      resolve(ranking);
    });
  });
};