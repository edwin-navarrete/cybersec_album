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
  const value: AnswerRow = {
    ...req.body,
    success: req.body.success ?? null,
    latency: req.body.latency ?? null,
    attempts: req.body.attempts ?? null
  };

  dao.post(value).catch((err) => {
    console.log('failed userAnswer post answer:', err)
  })
  res.status(200).json(value)
})


module.exports = router
