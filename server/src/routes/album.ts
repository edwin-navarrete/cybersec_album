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
    playerName: string
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
  const value = {
    albumId: req.body.albumId,
    playerName: req.body.playerName || null,
    startedOn: req.body.startedOn,
    endedOn: req.body.endedOn || null,
    language: req.body.language,
    os: req.useragent?.os,
    platform: req.useragent?.platform,
    browser: req.useragent?.browser,
    version: req.useragent?.version,
    isMobile: req.useragent?.isMobile
  } as AlbumRow
  dao.upsert(value).catch(err => {
    console.log('Failed post album:', err)
  })
  res.status(200).json(value)
})

module.exports = router
