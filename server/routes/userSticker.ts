import { Router, Request, Response, NextFunction } from 'express'
import { check, validationResult } from 'express-validator'

import  EntityDAO  from '../controllers/entityDao'
import  mysqlDriver  from '../controllers/mysqlDriver'

const router = Router()

/*
CREATE TABLE `ssolucio_cyberalbum`.`user_sticker` (
 `user_sticker_id` INT NOT NULL AUTO_INCREMENT,
  `album_id` VARCHAR(36) NOT NULL ,
   `sticker_id` INT NOT NULL ,
   `in_album` BOOLEAN NOT NULL DEFAULT FALSE ,
   `added_on` BIGINT NOT NULL ,
    PRIMARY KEY (`user_sticker_id`),
    INDEX `album_id_idx` (`album_id`) ) ENGINE = InnoDB;
*/
interface UserStickerRow {
    album_id: string,
    sticker_id: number,
    in_album: boolean,
    added_on: number
}

class UserStickerDAO extends EntityDAO<UserStickerRow>{
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
  check('album_id', 'album_id is required').isUUID(4),
  check('sticker_id', 'sticker_id is required').isNumeric(),
  check('in_album', 'in_album is required').isBoolean(),
  check('added_on', 'added_on is required').isNumeric(),
  validateInput
],  async (req: Request, res: Response) => {
    let dao = new UserStickerDAO(mysqlDriver.fetch, mysqlDriver.insert, "user_sticker");
    let value: UserStickerRow = req.body as UserStickerRow;
    value = {
        album_id: req.body.album_id,
        sticker_id: req.body.sticker_id,
        in_album: req.body.in_album,
        added_on: req.body.added_on
    }
    dao.post(value);
    res.status(200).json(value);
})

module.exports = router
