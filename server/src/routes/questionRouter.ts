import { Router, Request, Response } from 'express'
import EntityDAO from '../controllers/entityDao'
import mysqlDriver from '../controllers/mysqlDriver'
import { check } from 'express-validator'
import beta from '@stdlib/random-base-beta';

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

interface QuestionRow {
  questionId: number,
  type: string
  options: string
  solution: string
  dificult: number
  feedback: string
}
class QuestionDAO extends EntityDAO<QuestionRow> {
  public async thompson (lang: string, albumId:string): Promise<QuestionRow> {
    let qry = 
    `SELECT q.question_id, coalesce(sum(success),0) success, coalesce(sum(attempts),0) attempts, max( answered_on ) answered_on, min( latency ) min_latency 
       FROM question q
       LEFT JOIN user_answer ua ON ua.question_id = q.question_id AND album_id = ?
      WHERE q.lang = ?
      GROUP BY q.question_id
      HAVING max( answered_on ) < NOW() - INTERVAL 5 MINUTE`
    
    const results = await this.fetch(qry,[albumId, lang]);
    
    results.forEach(q => {
      let alpha = (q.attempts - q.success) || 1e-9;
      let betaParam = q.success || 1e-9;
      q.beta_sample = beta(alpha , betaParam);
      console.log(` question_id = ${q.question_id}, q.beta_sample = ${q.beta_sample} for ${alpha}, ${betaParam}`)
    })
    results.sort((a,b)=> b.beta_sample - a.beta_sample )
    let found = await this.get( { filter: { questionId : results[0].question_id, lang: lang } } )
    return this.snakeToCamel(found[0]) as QuestionRow;
  }
}


questionsRouterinfo.get('/question/thompson', [
  check('lang', "lang must be 'es' or 'en'").default('es').matches('(en|es)'),
  check('albumId', 'albumId is required').isUUID(4),
  validateInput
], async (req: Request, res: Response) => {
  const albumId = req.query.albumId as string
  const lang = req.query.lang as string

  const dao = new QuestionDAO(mysqlDriver.fetch, mysqlDriver.insert, 'question')
  try {
    const nextQuestion = await dao.thompson(lang, albumId)
    res.status(200).json({ results: nextQuestion })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMessage: error })
  }
})

questionsRouterinfo.get('/question',[
  check('lang', 'lang is required and must be a valid language code').matches(/^[a-z]{2}(-[A-Z]{2})?$/),
  validateInput
], async (req: Request, res: Response) => {
  const lang = req.query.lang as string
  const dao = new QuestionDAO(mysqlDriver.fetch, mysqlDriver.insert, 'question')
  try {
    const albumIdsQuest = await dao.get({
      filter:{lang:lang}
    })
    albumIdsQuest.forEach((item) => {
      try {
        if (typeof item.options === "string") {
          item.options = JSON.parse(item.options);
        }
        if (typeof item.solution === "string") {
              item.solution = JSON.parse(item.solution);
        }
      } catch {
        console.error("Error al parsear options:", item.options);
      }
    });
    res.status(200).json({ results: albumIdsQuest })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMessage: error })
  }
})
module.exports = questionsRouterinfo
