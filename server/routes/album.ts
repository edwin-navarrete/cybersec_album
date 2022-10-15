import { Router, Request, Response, NextFunction } from 'express'
import { check, validationResult } from 'express-validator'

import EntityDAO from '../controllers/entityDao'
import mysqlDriver from '../controllers/mysqlDriver'

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
    album_id: string
    started_on: number
    ended_on?: number
    language: number
    os?: string
    platform? : string
    browser? : string
    version? : string
    is_mobile ? : boolean
}

class AlbumDAO extends EntityDAO<AlbumRow> {
}

const validateInput = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log('Failed validation for: ', req.body)
    return res.status(400).json(errors)
  }
  next()
}

router.post('/album', [
  check('albumId', 'album_id is required').isUUID(4),
  check('startedOn', 'startedOn is required').isNumeric(),
  check('endedOn', 'endedOn is required').optional({ nullable: true }).isNumeric(),
  check('language', 'language is required').matches('\\w+(-\\w+)*'),
  validateInput
], async (req: Request, res: Response) => {
  const dao = new AlbumDAO(mysqlDriver.fetch, mysqlDriver.insert, 'album')
  const value = {
    album_id: req.body.albumId,
    started_on: req.body.startedOn,
    ended_on: req.body.endedOn || null,
    language: req.body.language,
    os: req.useragent?.os,
    platform: req.useragent?.platform,
    browser: req.useragent?.browser,
    version: req.useragent?.version,
    is_mobile: req.useragent?.isMobile
  } as AlbumRow
  dao.upsert(value).catch(err => {
    console.log('Failed post album:', err)
  })
  res.status(200).json(value)
})

module.exports = router
