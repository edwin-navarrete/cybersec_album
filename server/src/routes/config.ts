import { Router, Request, Response } from 'express'
import { getGameMode } from '../models/gameMode'

const router = Router()

// Public runtime settings the client needs before registering a player
router.get('/config', (req: Request, res: Response) => {
  res.status(200).json({ gameMode: getGameMode() })
})

module.exports = router
