"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRankingByDate = void 0;
const db_1 = require("../db");
const getRankingByDate = (date) => {
    return new Promise((resolve, reject) => {
        const isDateProvided = date !== undefined && date !== null;
        const whereClause = isDateProvided
            ? `DATE(FROM_UNIXTIME((a.ended_on - 18000000)/ 1000)) = "${date}"`
            : '1=1';
        const queryString = `
      SELECT t.*, ROW_NUMBER() OVER () AS ranking
      FROM (
          SELECT a.album_id,
              a.started_on,
              player_name,
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
                    player_name: row.player_name,
                };
                ranking.push(a_id);
            });
            resolve(ranking);
        });
    });
};
exports.getRankingByDate = getRankingByDate;
//# sourceMappingURL=ranking_model.js.map