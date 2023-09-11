import express, { Request, Response } from "express";
import * as questions_model from "../models/questions_model";
import { Questions } from "../types/questions";


const questionsRouter = express.Router();

questionsRouter.get("/", async (req: Request, res: Response) => {
  //res.header('Access-Control-Allow-Origin', 'http://localhost:3001');

  const since = req.query.since as string;
  const to = req.query.to as string;



  try {
    questions_model.getQuetionsByDates((err: Error, albumIds: Questions[]) => {
      res.status(200).json({"data":albumIds});
    }, since, to);
  } catch (error) {
    console.log(error)
    return res.status(500).json({"errorMessage": error});
  }

});



export { questionsRouter };

