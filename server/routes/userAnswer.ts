import { Router, Request, Response, NextFunction } from 'express'
import { check, validationResult } from 'express-validator'

import EntityDAO from '../controllers/entityDao'
import mysqlDriver from '../controllers/mysqlDriver'

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
    album_id: string
    question_id: number
    success?: boolean
    latency?: number
    attempts?: number
    answered_on: number
}
class UserStickerDAO extends EntityDAO<AnswerRow> {
}

const validateInput = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log('Failed validation for: ', req.body)
    return res.status(400).json(errors)
  }
  next()
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
  const value = {
    album_id: req.body.albumId,
    question_id: req.body.questionId,
    success: req.body.success !== undefined?  req.body.success : null,
    latency: req.body.latency || null,
    attempts: req.body.attempts || null,
    answered_on: req.body.answeredOn
  }
  dao.post(value).catch((err)=>{
      console.log("failed post answer:", err);
  })
  res.status(200).json(value)
})

module.exports = router
