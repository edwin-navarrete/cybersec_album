import { Router, Request, Response, NextFunction } from 'express'
import { check, validationResult } from 'express-validator'

import  EntityDAO  from '../controllers/entityDao'

const router = Router()

export interface UserStickerRow {
    user_sticker_id: number,
    album_id: string,
    sticker_id: number,
    in_album: boolean,
    added_on: number
}

const validateInput = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log('Failed validation for: ', req.body)
    return res.status(400).json(errors)
  }
  next()
}
router.post('/userSticker', [
  check('user_sticker_id', 'user_sticker_id is required').not().isEmpty(),
  check('album_id', 'album_id is required').isUUID(),
  check('sticker_id', 'sticker_id is required').not().isEmpty(),
  validateInput
],  async (req: Request, res: Response) => {

})
