"use strict";
// import { Ranking } from '../types/ranking';
// import { db } from "../db";
// import { RowDataPacket } from "mysql2";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRankingByDate = void 0;
const db_1 = require("../db");
const getRankingByDate = (date) => {
    return new Promise((resolve, reject) => {
        // Verifica si date es undefined o nulo
        const isDateProvided = date !== undefined && date !== null;
        // Crea la parte del WHERE de la consulta SQL basada en si date es proporcionado o no
        const whereClause = isDateProvided
            ? `DATE(FROM_UNIXTIME(started_on / 1000)) = STR_TO_DATE("${date}", '%Y/%m/%d')`
            : '1=1'; // No se aplica ningún filtro de fecha
        const queryString = `
      SELECT t.*, ROW_NUMBER() OVER () AS ranking
      FROM (
          SELECT a.album_id,
              a.started_on,
              a.ended_on IS NOT NULL finalizacion_album,
              COUNT(DISTINCT question_id) preguntas_respondidas,
              COUNT(DISTINCT question_id) - SUM(success) numero_de_errores,
              1 - SUM(success) / COUNT(DISTINCT question_id) porcentaje_error,
              SUM(latency) / 1000 AS tiempo_total_de_respuesta
          FROM vw_user_answer ua
          JOIN album a ON ua.album_id = a.album_id
          WHERE
              ${whereClause}  -- Se inserta la condición WHERE aquí
          GROUP BY started_on, album_id
          ORDER BY finalizacion_album DESC, tiempo_total_de_respuesta, SUM(success) / COUNT(DISTINCT question_id) DESC
      ) t;
    `;
        db_1.db.query(queryString, (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            const rows = result;
            const ranking = [];
            rows.forEach(row => {
                const a_id = {
                    started_on: row.started_on,
                    number_errors: row.numero_de_errores,
                    total_latency: row.tiempo_total_de_respuesta,
                    finished: row.finalizacion_album,
                    answered: row.preguntas_respondidas,
                    errors: row.porcentaje_error,
                    rank: row.ranking,
                    album_id: row.album_id,
                };
                ranking.push(a_id);
            });
            resolve(ranking);
        });
    });
};
exports.getRankingByDate = getRankingByDate;
