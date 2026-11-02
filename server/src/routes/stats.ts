import { Router, Request, Response } from 'express'
import { AuthConfig, checkCredentials, issueToken, LoginLimiter } from '../stats/auth'
import { requireAuth } from '../stats/requireAuth'
import { sanitizeDate } from '../stats/sanitizeDate'
import { getQuestions, getRanking } from '../stats/statsModel'

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

  return router
}
