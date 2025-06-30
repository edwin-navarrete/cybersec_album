import { Router, Request, Response, NextFunction } from 'express'
import { check, validationResult } from 'express-validator'

import EntityDAO from '../controllers/entityDao'
import mysqlDriver from '../controllers/mysqlDriver'
import validateInput from './validateInput'

const router = Router()

/*
CREATE TABLE `ssolucio_cyberalbum`.`album` (
   `album_id` VARCHAR(36) NOT NULL ,
   `started_on` BIGINT NOT NULL,
   `ended_on` BIGINT,
   `language` VARCHAR(20) NOT NULL,
   `os` TINYTEXT,
   `platform` TINYTEXT,
   `browser` TINYTEXT,
   `version` TINYTEXT,
   `is_mobile` BOOLEAN,
    PRIMARY KEY (`album_id`) ) ENGINE = InnoDB;
*/

interface AlbumRow {
    albumId: string
    playerId: number
    startedOn: number
    endedOn?: number
    language: number
    os?: string
    platform? : string
    browser? : string
    version? : string
    isMobile ? : boolean
}

class AlbumDAO extends EntityDAO<AlbumRow> {
}

router.post('/album', [
  check('albumId', 'album_id is required').isUUID(4),
  check('startedOn', 'startedOn is required').isNumeric(),
  check('endedOn', 'endedOn must be numeric').optional({ nullable: true }).isNumeric(),
  check('language', 'language is required').matches('\\w+(-\\w+)*'),
  validateInput
], async (req: Request, res: Response) => {
  const dao = new AlbumDAO(mysqlDriver.fetch, mysqlDriver.insert, 'album')
  const value: AlbumRow = {
    albumId: req.body.albumId,
    playerId: req.body.playerId ?? null,
    startedOn: req.body.startedOn,
    endedOn: req.body.endedOn ?? null,
    language: req.body.language,
    os: req.useragent?.os ?? null,
    platform: req.useragent?.platform ?? null,
    browser: req.useragent?.browser ?? null,
    version: req.useragent?.version ?? null,
    isMobile: req.useragent?.isMobile ?? false
  };
  try {
    await dao.post(value)
    // owner player is set only once
    if(value.playerId){
      await mysqlDriver.insert('UPDATE album SET player_id = COALESCE(player_id,?) WHERE album_id=?', [value.playerId, value.albumId])
    }
    res.status(200).json(value)
  } catch (error) {
    console.log(error)
    return res.status(400).json({ errorMessage: error })
  }
})

router.get('/album',[
  check('albumId', 'album_id is UUID').optional().isUUID(4),
  check('playerId', 'playerId must be numeric').optional({ nullable: true }).isNumeric(),
  validateInput
], async (req: Request, res: Response) => {
  const albumId = req.query.albumId as string
  const playerId = req.query.playerId as string
  if(!albumId && !playerId){
    return res.status(400).json({ errorMessage: "requires albumId or playerId" })
  }
  const dao = new AlbumDAO(mysqlDriver.fetch, mysqlDriver.insert, 'album')
  try {
    const albums = await dao.get({
      filter:{albumId, playerId, endedOn: null},
      order: "-startedOn"
    })
    res.status(200).json({ results: albums })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMessage: error })
  }
})

module.exports = router
