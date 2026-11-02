import * as bodyParser from "body-parser";
import cors from 'cors';
import * as dotenv from "dotenv";
import express from "express";
import { albumRouter } from "./routes/albumRouter";
import { questionsRouter } from "./routes/questionsRouter";
import { rankingRouter } from './routes/rankingRouter';
import { user_answerRouter } from './routes/user_answerRouter';
import { loadAuthConfig } from "./models/auth";
import { createAuthRouter } from "./routes/authRouter";
import { requireAuth } from "./middleware/requireAuth";

const app = express();
dotenv.config();

const authConfig = loadAuthConfig(); // lanza si faltan credenciales: no se arranca abierto
const protect = requireAuth(authConfig);

app.set("trust proxy", 1); // detrás de proxy (cPanel/Heroku) para que req.ip sea la del cliente
app.use(cors({origin: process.env.UI_URL})); // Habilitar CORS
//app.use(cors())

app.use(bodyParser.json());
app.use(`${process.env.SERVER_PATH}/auth`, createAuthRouter(authConfig));
app.use(`${process.env.SERVER_PATH}/album`, protect, albumRouter);
app.use(`${process.env.SERVER_PATH}/user`, protect, user_answerRouter)
app.use(`${process.env.SERVER_PATH}/ranking`, protect, rankingRouter)
app.use(`${process.env.SERVER_PATH}/questions`, protect, questionsRouter);

app.listen(process.env.PORT, () => {
console.log("Node server started running " + process.env.PORT);

});
