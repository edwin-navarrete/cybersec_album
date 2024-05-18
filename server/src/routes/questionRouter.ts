import { Router, Request, Response } from 'express'
import * as QuestionsModel from '../models/questions_model'

const questionsRouterinfo = Router()

questionsRouterinfo.get('/questions', async (req: Request, res: Response) => {
  const lang = req.query.lang as string

  try {
    const albumIdsQuest = await QuestionsModel.getQuestionsLang(lang)
    res.status(200).json({ data: albumIdsQuest })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMessage: error })
  }
})
module.exports = questionsRouterinfo
