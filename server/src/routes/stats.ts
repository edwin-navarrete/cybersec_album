import { Router, Request, Response } from 'express'
import { AuthConfig, checkCredentials, issueToken, LoginLimiter } from '../stats/auth'
import { requireAuth } from '../stats/requireAuth'
import { sanitizeDate } from '../stats/sanitizeDate'
import { getQuestions, getRanking, TZ_OFFSET_MS } from '../stats/statsModel'
import { formatLocal, toCsv } from '../stats/csv'

/** Estadísticas del evento: login + ranking + desempeño de preguntas (bajo /api/stats). */
export function createStatsRouter (cfg: AuthConfig) {
  const router = Router()
  const limiter = new LoginLimiter()
  const protect = requireAuth(cfg)

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store') // son datos en vivo
    next()
  })

  router.post('/auth/login', (req: Request, res: Response) => {
    const key = req.ip ?? 'unknown'
    const wait = limiter.retryAfterMs(key)
    if (wait > 0) {
      res.set('Retry-After', String(Math.ceil(wait / 1000)))
      return res.status(429).json({ errorMessage: 'Demasiados intentos. Intenta más tarde.' })
    }
    const { user, password } = req.body ?? {}
    if (!checkCredentials(cfg, user, password)) {
      limiter.fail(key)
      return res.status(401).json({ errorMessage: 'Usuario o contraseña incorrectos' })
    }
    limiter.success(key)
    const { token, expiresAt } = issueToken(cfg)
    res.status(200).json({ token, expiresAt, user: cfg.user })
  })

  router.get('/auth/me', protect, (_req, res) => {
    res.status(200).json({ user: res.locals.user })
  })

  router.get('/ranking', protect, async (req: Request, res: Response) => {
    try {
      res.status(200).json({ data: await getRanking(sanitizeDate(req.query.date)) })
    } catch (error) {
      console.error(error)
      res.status(500).json({ errorMessage: 'Error interno' })
    }
  })

  router.get('/questions', protect, async (req: Request, res: Response) => {
    try {
      res.status(200).json({ data: await getQuestions(sanitizeDate(req.query.since), sanitizeDate(req.query.to)) })
    } catch (error) {
      console.error(error)
      res.status(500).json({ errorMessage: 'Error interno' })
    }
  })

  // Descargas: mismos filtros que la pantalla. El navegador las pide con el token (fetch/axios), no con un enlace.
  const sendCsv = (res: Response, filename: string, csv: string) => {
    res.set('Content-Type', 'text/csv; charset=utf-8')
    res.set('Content-Disposition', `attachment; filename="${filename}"`)
    res.status(200).send(csv)
  }

  router.get('/export/ranking.csv', protect, async (req: Request, res: Response) => {
    try {
      const date = sanitizeDate(req.query.date)
      const mode = req.query.mode === 'group' || req.query.mode === 'alone' ? req.query.mode : 'general'
      const rows = (await getRanking(date)).filter((r) => mode === 'general' || (mode === 'group') === (r.is_group === 1))
      sendCsv(res, `ranking-${mode}-${date ?? 'todos'}.csv`, toCsv(
        ['Posición', 'Jugador', 'Tipo', 'Errores', 'Preguntas respondidas', 'Álbum finalizado', 'Tiempo total (s)', 'Error (%)', 'Inicio'],
        rows.map((r) => [r.rank, r.player_name, r.is_group === 1 ? 'Equipo' : 'Individual', r.number_errors, r.answered,
          r.finished, Math.round(r.total_latency), Math.round(r.errors * 100), formatLocal(r.started_on, TZ_OFFSET_MS)])
      ))
    } catch (error) {
      console.error(error)
      res.status(500).json({ errorMessage: 'Error interno' })
    }
  })

  router.get('/export/questions.csv', protect, async (req: Request, res: Response) => {
    try {
      const since = sanitizeDate(req.query.since)
      const to = sanitizeDate(req.query.to)
      const rows = await getQuestions(since, to)
      sendCsv(res, `desempeno-preguntas-${since ?? 'inicio'}_${to ?? 'hoy'}.csv`, toCsv(
        ['ID', 'Pregunta', 'Intentos', 'Tiempo promedio (s)', 'Éxito (%)'],
        rows.map((r) => [r.questionId, r.question, r.attempts, Math.round(r.avgLatency), Math.round(r.successProb * 100)])
      ))
    } catch (error) {
      console.error(error)
      res.status(500).json({ errorMessage: 'Error interno' })
    }
  })

  return router
}
