import { Router, Request, Response } from 'express'
import EntityDAO from '../controllers/entityDao'
import mysqlDriver from '../controllers/mysqlDriver'
import { check } from 'express-validator'

import validateInput from './validateInput'
const questionsRouterinfo = Router()

/*
CREATE TABLE `question` (
  `question_id` SMALLINT UNSIGNED NOT NULL,
  `lang` varchar(10) NOT NULL,
  `type` varchar(10) NOT NULL,
  `question` text NOT NULL,
  `options` JSON,
  `solution` JSON,
  `difficulty` float NOT NULL,
  `feedback` text DEFAULT NULL,
  PRIMARY KEY (`question_id`,`lang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Table storing questions for the game';
*/

interface Question {
  question_id: number,
  type: string
  options: string
  solution: string
  dificult: number
  feedback: string
}
class QuestionDAO extends EntityDAO<Question> {
}

questionsRouterinfo.get('/questions',[
  check('lang', 'lang is required and must be a valid language code').matches(/^[a-z]{2}(-[A-Z]{2})?$/),
  validateInput
], async (req: Request, res: Response) => {
  const lang = req.query.lang as string
  const dao = new QuestionDAO(mysqlDriver.fetch, mysqlDriver.insert, 'question')
  try {
    const albumIdsQuest = await dao.get({
      filter:{lang:lang}
    })
    res.status(200).json({ data: albumIdsQuest })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMessage: error })
  }
})
module.exports = questionsRouterinfo
