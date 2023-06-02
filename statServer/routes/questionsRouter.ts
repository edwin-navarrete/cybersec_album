import express, {Request, Response} from "express";
import * as questions_model from "../models/questions_model";
import {Questions} from "../types/questions";


const questionsRouter = express.Router();

questionsRouter.get("/", async (req: Request, res: Response) => {
  //res.header('Access-Control-Allow-Origin', 'http://localhost:3001');

  const date = req.query.date as string;
  
  questions_model.findAll((err: Error, albumIds: Questions[]) => {
    if (err) {
      return res.status(500).json({"errorMessage": err.message});
    }

    res.status(200).json({"data":albumIds});
  }, date);
});



export {questionsRouter};
