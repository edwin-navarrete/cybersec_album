import db from '../controllers/mysqlDriver'
import { getQuestionSet } from '../models/questionSet'

// Offset horario con el que se agrupa "por día" (antes fijo en -18000000, UTC-5).
export const TZ_OFFSET_MS = Number(process.env.STATS_TZ_OFFSET_MS ?? -18000000) || 0

export interface RankingRow {
  started_on: number
  ended_on: number | null
  number_errors: number
  total_latency: number
  finished: boolean
  answered: number
  errors: number
  rank: number
  album_id: string
  player_name: string | null
  is_group: number
}

export interface QuestionRow {
  questionId: number
  question: string
  attempts: number
  avgLatency: number
  successProb: number
}

const num = (v: unknown): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** Ranking de álbumes; `date` (YYYY-MM-DD) limita a los iniciados ese día. */
export async function getRanking(date?: string): Promise<RankingRow[]> {
  const where = date ? 'WHERE DATE(FROM_UNIXTIME((a.started_on + ?) / 1000)) = ?' : ''
  const params = date ? [TZ_OFFSET_MS, date] : []
  const rows = await db.fetch(`
    SELECT t.*,
           ROW_NUMBER() OVER (ORDER BY t.finalizacion_album DESC, t.porcentaje_error ASC, t.tiempo_total_de_respuesta ASC) AS ranking
    FROM (
      SELECT
        a.album_id, p.player_id, p.player_name, p.is_group, p.group_id, p.is_leader,
        a.started_on, a.ended_on,
        a.ended_on IS NOT NULL AS finalizacion_album,
        COUNT(DISTINCT ua.question_id) AS preguntas_respondidas,
        COUNT(DISTINCT ua.question_id) - SUM(ua.success) AS numero_de_errores,
        (COUNT(DISTINCT ua.question_id) - SUM(ua.success)) / COUNT(DISTINCT ua.question_id) AS porcentaje_error,
        SUM(ua.latency) / 1000 AS tiempo_total_de_respuesta
      FROM album a
      LEFT JOIN player p ON p.player_id = a.player_id
      LEFT JOIN vw_user_answer ua ON ua.album_id = a.album_id
      ${where}
      GROUP BY a.album_id, p.player_id, p.player_name, p.is_group, p.group_id, p.is_leader, a.started_on, a.ended_on
    ) t
    ORDER BY t.finalizacion_album DESC, t.porcentaje_error ASC, t.tiempo_total_de_respuesta ASC`, params)

  return rows.map((r) => ({
    started_on: num(r.started_on),
    ended_on: r.ended_on === null ? null : num(r.ended_on),
    number_errors: num(r.numero_de_errores),
    total_latency: num(r.tiempo_total_de_respuesta),
    finished: Boolean(r.finalizacion_album),
    answered: num(r.preguntas_respondidas),
    errors: num(r.porcentaje_error),
    rank: num(r.ranking),
    album_id: r.album_id,
    player_name: r.player_name,
    is_group: num(r.is_group),
  }))
}

/**
 * Desempeño por pregunta del set en juego, con el texto en español (la tabla `question`
 * tiene una fila por idioma; las otras son traducciones de la misma pregunta).
 */
export async function getQuestions(since?: string, to?: string): Promise<QuestionRow[]> {
  // 2038-01-18 es el límite de UNIX_TIMESTAMP con 32 bits.
  const rows = await db.fetch(`
    SELECT q.question_id AS questionId, q.question,
           COUNT(ua.question_id) AS attempts,
           AVG(ua.latency / 1000) AS avgLatency,
           SUM(ua.success) / COUNT(ua.question_id) AS successProb
    FROM question q
    LEFT JOIN vw_user_answer ua ON q.question_id = ua.question_id
    WHERE q.lang = 'es'
      AND q.question_set = ?
      AND ua.answered_on BETWEEN UNIX_TIMESTAMP(?) * 1000 AND UNIX_TIMESTAMP(?) * 1000 + 86399999 -- "hasta" incluye el día entero
    GROUP BY q.question_id, q.question
    ORDER BY avgLatency DESC`, [getQuestionSet(), since ?? '1970-01-01', to ?? '2038-01-18'])

  return rows.map((r) => ({
    questionId: num(r.questionId),
    question: r.question,
    attempts: num(r.attempts),
    avgLatency: num(r.avgLatency),
    successProb: num(r.successProb),
  }))
}
