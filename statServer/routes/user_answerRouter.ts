import express, {Request, Response} from "express";
import * as user_answer_model from "../models/user_answer_model";
import {UserAnswer} from "../types/user_answer";


const user_answerRouter = express.Router();

user_answerRouter.get("/", async (req: Request, res: Response) => {
  
  
  user_answer_model.findAll((err: Error, albumIds: UserAnswer[]) => {
    if (err) {
      return res.status(500).json({"errorMessage": err.message});
    }

    res.status(200).json({"data":albumIds});
  });
});



export {user_answerRouter};
