import express, {Request, Response} from "express";
import * as questions_model from "../models/questions_model";
import {Questions} from "../types/questions";


const questionsRouter = express.Router();
const questionsRouterinfo = express.Router();

questionsRouter.get("/", async (req: Request, res: Response) => {
  const since = req.query.since as string;
  const to = req.query.to as string;

  try {
    const albumIds = await questions_model.getQuestionsByDates( since, to );
    res.status(200).json({ data: albumIds });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ errorMessage: error });
  }

});

questionsRouterinfo.get("/info/", async (req: Request, res: Response) => {
  const lang = req.query.lang as string;

  try {
    const albumIdsQuest = await questions_model.getQuestionsLang( lang );
    res.status(200).json({ data: albumIdsQuest });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ errorMessage: error });
  }

});
export {questionsRouter, questionsRouterinfo};
