import express, {Request, Response} from "express";
import * as questions_model from "../models/questions_model";
import { sanitizeDate } from "./commonRoutes";


const questionsRouter = express.Router();
console.log('Estamos aca')
console.log(questionsRouter)

questionsRouter.get("/", async (req: Request, res: Response) => {
  const since = sanitizeDate(req.query.since as string);
  const to = sanitizeDate(req.query.to as string);

  try {
    const albumIds = await questions_model.getQuestionsByDates( since, to );
    res.status(200).json({ data: albumIds });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ errorMessage: error });
  }

});
export {questionsRouter};
