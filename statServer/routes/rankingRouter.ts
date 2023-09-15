import express, { Request, Response } from "express";
import * as ranking_model from "../models/ranking_model";

const rankingRouter = express.Router();

rankingRouter.get("/", async (req: Request, res: Response) => {
  const date = req.query.date as string;

  try {
    const ranking = await ranking_model.getRankingByDate(date);
    res.status(200).json({ data: ranking });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errorMessage: error });
  }
});

export { rankingRouter };
