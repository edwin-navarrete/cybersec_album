import { Router, Request, Response, NextFunction } from 'express'
import { check, validationResult } from 'express-validator'

import  EntityDAO  from '../controllers/entityDao'
import  mysqlDriver  from '../controllers/mysqlDriver'

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
class UserStickerDAO extends EntityDAO<AnswerRow>{
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
  check('album_id', 'album_id is required').isUUID(4),
  check('question_id', 'question_id is required').isNumeric(),
  check('attempts', 'attempts is required').optional().isNumeric(),
  check('success', 'success is required').optional().isBoolean(),
  check('latency', 'latency is required').optional().isNumeric(),
  check('answered_on', 'answered_on is required').isNumeric(),
  validateInput
],  async (req: Request, res: Response) => {
    let dao = new UserStickerDAO(mysqlDriver.fetch, mysqlDriver.insert, "user_answer");
    let value = {
        album_id: req.body.album_id,
        question_id: req.body.question_id,
        success: req.body.success || null,
        latency: req.body.latency  || null,
        attempts: req.body.attempts || null,
        answered_on: req.body.answered_on
    };
    dao.post(value);
    res.status(200).json(value);
})

module.exports = router
