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

interface DepletedError extends Error {
}

class DepletedError extends Error implements DepletedError {
  constructor(message?: string) {
    super(message);
  }
}


interface QuestionScore {
  question_id: number,
  score: number
}

interface QuestionRow {
  questionId: number,
  type: string
  options: string
  solution: string
  dificult: number
  feedback: string
}

const EXPERT_LEVEL = 0.75
const PROFICIENT_LEVEL = 0.56
const BEGINNER_LEVEL = 0.45
const NOVICE_LEVEL = 0

class QuestionDAO extends EntityDAO<QuestionRow> {
  
  public async questionScores (lang: string, albumId:string): Promise<QuestionScore[]> {
    let qry = 
    `WITH RankedAnswers AS (
          SELECT
              ua.question_id,
              ua.success,
              ROW_NUMBER() OVER (PARTITION BY ua.question_id ORDER BY ua.answered_on DESC) AS rn
          FROM user_answer ua
          WHERE ua.album_id = ?
      )
      , ScoredAnswers AS (
          SELECT 
              q.question_id, 
              ln(5 - o.ordinal) / ln(24) * COALESCE(ra.success, 0.5) AS success_score
          FROM question q
          CROSS JOIN (
              SELECT 1 AS ordinal UNION SELECT 2 UNION SELECT 3
          ) o
        JOIN RankedAnswers ra 
              ON ra.question_id = q.question_id AND o.ordinal = ra.rn
          WHERE q.lang = ?
      )
      SELECT 
          question_id, 
          SUM(success_score) AS score
      FROM ScoredAnswers
      GROUP BY question_id
      ORDER BY score DESC`
    
    let results = await this.fetch(qry,[albumId, lang]);
    return results as QuestionScore[];
  }

  public async thompson (lang: string, albumId:string): Promise<QuestionRow> {
    // Exclude questions answered 5 min ago
    let qry = 
    `SELECT q.question_id,
            CAST(coalesce(sum(success), 0) AS UNSIGNED) AS success, 
            CAST(coalesce(count(success), 0) AS UNSIGNED) AS attempts, 
            max( answered_on ) answered_on, min( latency ) min_latency,
            (UNIX_TIMESTAMP() - max( answered_on ) / 1000) DIV 60 answered_min_ago
       FROM question q
       LEFT JOIN user_answer ua ON ua.question_id = q.question_id AND album_id = ?
      WHERE q.lang = ?
      GROUP BY q.question_id`
    
    let results = await this.fetch(qry,[albumId, lang]);
    
    results.forEach(q => {
      let alpha = (q.attempts - q.success) || 1e-9;
      let betaParam = q.success || 1e-9;
      q.beta_sample = beta(alpha , betaParam);
      console.log(` question_id = ${q.question_id}, q.beta_sample = ${q.beta_sample} for (${alpha}, ${betaParam}) ${q.answered_min_ago}m ago`)
    })
    // If some have been seen more than 5 minutes ago, we can exclude them from the results
    const UNSEEN_MIN_AGO = 5;
    if (results.some( a => a.answered_min_ago >= UNSEEN_MIN_AGO && !a.success )) {
      results = results.filter(a => !a.answered_min_ago || a.answered_min_ago >= UNSEEN_MIN_AGO);
    }
    // Skip questions already learnt
    const questionsWithScore = await this.questionScores(lang, albumId);
    const learntQuestions = questionsWithScore.filter(q => q.score >= EXPERT_LEVEL).map(q => q.question_id);
    results = results.filter(a => !learntQuestions.includes(a.question_id) );

    if(results.length == 0){
      throw new DepletedError();
    }
    
    results.sort((a,b)=> b.beta_sample - a.beta_sample )

    let found = await this.get( { filter: { questionId : results[0].question_id, lang: lang } } )
    return this.snakeToCamel(found[0]) as QuestionRow;
  }
}

questionsRouterinfo.get('/question/score', [
  check('lang', "lang must be 'es' or 'en'").default('es').matches('(en|es)'),
  check('albumId', 'albumId is required').isUUID(4),
  validateInput
], async (req: Request, res: Response) => {
  const albumId = req.query.albumId as string
  const lang = req.query.lang as string

  const dao = new QuestionDAO(mysqlDriver.fetch, mysqlDriver.insert, 'question')
  try {
    const questionsWithScore = await dao.questionScores(lang, albumId);
    // calculate learnt 
    const levelThresholds = {
      expert: 0.75,
      proficient: 0.56,
      beginner: 0.45,
      novice: 0,
    };
    const groups = questionsWithScore.reduce((acum, q) => {
      for (const level in levelThresholds) {
        if (q.score >= levelThresholds[level]) {
          acum[level] += 1;
          break;
        }
      }
      acum.score += q.score
      return acum;
    }, { expert: 0, proficient: 0, beginner: 0 , novice: 0, total: 0, score: 0  });

    // average score
    groups.total = questionsWithScore.length;
    groups.score = groups.score / questionsWithScore.length;
    
    res.status(200).json({ results: groups })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMessage: error })
  }
})

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
    if (error instanceof DepletedError) {
      return res.status(404).json({ errorMessage: "No more questions available" })
    }
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
