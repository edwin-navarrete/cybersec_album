import express, {Request, Response} from "express";
import * as filterByDate from "../models/filterByDate_model";
//import {filterByDate} from "../models/filterByDate_model";

const filterByDateRouter = express.Router();

filterByDateRouter.get("/", async (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001');

  const date = req.query.date as string;
  
  filterByDate.findDate((err: Error, albumIds: any) => {
    if (err) {
      return res.status(500).json({"errorMessage": err.message});
    }

    res.status(200).json({"data":albumIds});
    console.log(date);
    
  }, date);
});


export {filterByDateRouter};

