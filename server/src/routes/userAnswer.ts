import { Router, Request, Response } from 'express'
import { check } from 'express-validator'

import EntityDAO from '../controllers/entityDao'
import mysqlDriver from '../controllers/mysqlDriver'
import validateInput from './validateInput'

const router = Router()

/*
CREATE TABLE `ssolucio_cyberalbum`.`user_answer` (
 `user_answer_id` INT NOT NULL AUTO_INCREMENT,
  `album_id` VARCHAR(36) NOT NULL ,
   `question_id` INT NOT NULL ,
   `success` BOOLEAN,
   `latency` INT,
   `attempts` INT,
   `answered_on` BIGINT NOT NULL,
    PRIMARY KEY (`user_answer_id`),
    INDEX `album_id_idx` (`album_id`) ) ENGINE = InnoDB;
*/
interface AnswerRow {
    albumId: string
    questionId: number
    success?: boolean
    latency?: number
    attempts?: number
    answeredOn: number
}
class UserStickerDAO extends EntityDAO<AnswerRow> {
}

router.get('/userAnswer', [
  check('albumId', 'album_id is required').isUUID(4),
  validateInput
], async (req: Request, res: Response) => {
  const albumId = req.query.albumId as string
  const dao = new UserStickerDAO(mysqlDriver.fetch, mysqlDriver.insert, 'user_answer')
  try {
    const userAnswers = await dao.get({filter: {album_id: albumId}})
    res.status(200).json({ results: userAnswers })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMessage: error })
  }
})


router.post('/userAnswer', [
  check('albumId', 'album_id is required').isUUID(4),
  check('questionId', 'question_id is required').isNumeric(),
  check('attempts', 'attempts is required').optional().isNumeric(),
  check('success', 'success is required').optional({ nullable: true }).isBoolean(),
  check('latency', 'latency is required').optional().isNumeric(),
  check('answeredOn', 'answered_on is required').isNumeric(),
  validateInput
], async (req: Request, res: Response) => {
  const dao = new UserStickerDAO(mysqlDriver.fetch, mysqlDriver.insert, 'user_answer')
  const { albumId, questionId, answeredOn, success = null, latency = null, attempts = null } = req.body;
  const value: AnswerRow = { albumId, questionId, answeredOn, success, latency, attempts };
  
  try {
    let result = await dao.post(value)
    console.log('userAnswer updated', result.affectedRows)
    res.status(200).json(value)
  } catch (error) {
    console.log(error)
    return res.status(400).json({ errorMessage: error })
  }
})


module.exports = router
