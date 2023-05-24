import express, {Request, Response} from "express";
import * as ranking_model from "../models/ranking_model";
import {Ranking} from "../types/ranking";


const rankingRouter = express.Router();

rankingRouter.get("/", async (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001');

  const date = req.query.date as string;
  
  ranking_model.findAll((err: Error, albumIds: Ranking[]) => {
    if (err) {
      return res.status(500).json({"errorMessage": err.message});
    }

    res.status(200).json({"data":albumIds});
  }, date);
});



export {rankingRouter};
