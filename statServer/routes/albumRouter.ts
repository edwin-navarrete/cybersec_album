import express, {Request, Response} from "express";
import * as albumModel from "../models/album";
import {AlbumId, QuestionCount} from "../types/album";


import * as questionsCount from "../models/questions_answered";


const albumRouter = express.Router();

albumRouter.get("/", async (req: Request, res: Response) => {

  albumModel.findAll((err: Error, albumIds: AlbumId[]) => {
    if (err) {
      return res.status(500).json({"errorMessage": err.message});
    }

    res.status(200).json({"data": albumIds});
  });
});

// Route for count of questions_answered 
albumRouter.get("/questions_answered", async (req: Request, res: Response) => {

  questionsCount.findAll((err: Error, questionC: QuestionCount[]) => {
    if (err) {
      return res.status(500).json({"errorMessage": err.message});
    }

    res.status(200).json({"data": questionC});
  });
});



export {albumRouter};