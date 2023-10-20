import * as dotenv from "dotenv";
import express from "express";
import * as bodyParser from "body-parser";
import { albumRouter } from "./routes/albumRouter";
import { user_answerRouter } from './routes/user_answerRouter'
import { rankingRouter } from './routes/rankingRouter';
import { questionsRouter, questionsRouterinfo } from "./routes/questionsRouter";
import cors from 'cors'

const app = express();
dotenv.config();

app.use(cors({ origin: process.env.UI_URL })); // Habilitar CORS


app.use(bodyParser.json());
app.use(`${process.env.SERVER_PATH}/album`, albumRouter);
app.use(`${process.env.SERVER_PATH}/user`, user_answerRouter)
app.use(`${process.env.SERVER_PATH}/ranking`, rankingRouter)
app.use(`${process.env.SERVER_PATH}/questions`, questionsRouter);
app.use(`${process.env.SERVER_PATH}/questions`, questionsRouterinfo);

app.listen(process.env.PORT, () => {
    console.log("Node server started running " + process.env.PORT);

});
