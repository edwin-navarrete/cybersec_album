/* eslint-disable quotes */
import express, { Request, Response } from "express"
// eslint-disable-next-line camelcase
import * as questions_model from "../models/questions_model"

const questionsRouterinfo = express.Router()

questionsRouterinfo.get("/info/", async (req: Request, res: Response) => {
  const lang = req.query.lang as string

  try {
    // eslint-disable-next-line camelcase
    const albumIdsQuest = await questions_model.getQuestionsLang(lang)
    res.status(200).json({ data: albumIdsQuest })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMessage: error })
  }
})
export { questionsRouterinfo }
