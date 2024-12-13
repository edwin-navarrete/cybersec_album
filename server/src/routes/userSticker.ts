import { Router, Request, Response, NextFunction } from 'express'
import { check, validationResult } from 'express-validator'

import EntityDAO from '../controllers/entityDao'
import mysqlDriver from '../controllers/mysqlDriver'
import validateInput from './validateInput'

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
    albumId: string,
    stickerId: number,
    inAlbum: boolean,
    addedOn: number
}

class UserStickerDAO extends EntityDAO<UserStickerRow> {
}

router.post('/userSticker', [
  check('albumId', 'albumId is required').isUUID(4),
  check('stickerId', 'stickerId is required').isNumeric(),
  check('inAlbum', 'inAlbum is required').isBoolean(),
  check('addedOn', 'addedOn is required').isNumeric(),
  validateInput
], async (req: Request, res: Response) => {
  const dao = new UserStickerDAO(mysqlDriver.fetch, mysqlDriver.insert, 'user_sticker')
  const {albumId, stickerId, inAlbum, addedOn} = req.body
  const value: UserStickerRow = {albumId, stickerId, inAlbum, addedOn}
  dao.post(value).then((val)=>{
    console.log('userSticker updated', val.affectedRows)
    res.status(200).json(value)
  })
  .catch((err) => {
    console.log('failed userSticker post answer:', err)
    res.status(400).json({ errorMessage: err })
  })
  
})

router.get('/userSticker',[ 
  check('albumId', 'albumId is required').isUUID(4),
  validateInput
], async (req: Request, res: Response) => {
  const albumId = req.query.albumId as string
  const dao = new UserStickerDAO(mysqlDriver.fetch, mysqlDriver.insert, 'user_sticker')
  try {
    const userStickers = await dao.get({filter: {album_id: albumId}})
    res.status(200).json({ results: userStickers })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMessage: error })
  }
})

module.exports = router
