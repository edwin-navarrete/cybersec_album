import * as dotenv from "dotenv";
import express from "express";
import * as bodyParser from "body-parser";
import {albumRouter} from "./routes/albumRouter";
import { user_answerRouter } from './routes/user_answerRouter'
import { rankingRouter } from './routes/rankingRouter';
import { filterByDateRouter } from "./routes/filterByDateRouter";

const app = express();
dotenv.config();

app.use(bodyParser.json());
app.use("/album", albumRouter);
app.use("/user", user_answerRouter)
app.use("/ranking", rankingRouter)
app.use("/ranking2", filterByDateRouter)

app.listen(process.env.PORT, () => {
console.log("Node server started running " + process.env.PORT);

});

