import express, {Request, Response} from "express";
import * as questions_model from "../models/questions_model";


const questionsRouter = express.Router();

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
export {questionsRouter};
