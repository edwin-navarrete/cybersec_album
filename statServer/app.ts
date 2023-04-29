import * as dotenv from "dotenv";
import express from "express";
import * as bodyParser from "body-parser";
import {albumRouter} from "./routes/albumRouter";
import { user_answerRouter } from './routes/user_answerRouter'

const app = express();
dotenv.config();

app.use(bodyParser.json());
app.use("/album", albumRouter);
app.use("/user", user_answerRouter)

app.listen(process.env.PORT, () => {
console.log("Node server started running " + process.env.PORT);

});

