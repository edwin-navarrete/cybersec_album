"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = __importStar(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
const express_1 = __importDefault(require("express"));
const albumRouter_1 = require("./routes/albumRouter");
const questionsRouter_1 = require("./routes/questionsRouter");
const rankingRouter_1 = require("./routes/rankingRouter");
const user_answerRouter_1 = require("./routes/user_answerRouter");
const auth_1 = require("./models/auth");
const authRouter_1 = require("./routes/authRouter");
const requireAuth_1 = require("./middleware/requireAuth");
const app = (0, express_1.default)();
dotenv.config();
const authConfig = (0, auth_1.loadAuthConfig)(); // lanza si faltan credenciales: no se arranca abierto
const protect = (0, requireAuth_1.requireAuth)(authConfig);
app.set("trust proxy", 1); // detrás de proxy (cPanel/Heroku) para que req.ip sea la del cliente
app.use((0, cors_1.default)({ origin: process.env.UI_URL })); // Habilitar CORS
//app.use(cors())
app.use(bodyParser.json());
app.use(`${process.env.SERVER_PATH}/auth`, (0, authRouter_1.createAuthRouter)(authConfig));
app.use(`${process.env.SERVER_PATH}/album`, protect, albumRouter_1.albumRouter);
app.use(`${process.env.SERVER_PATH}/user`, protect, user_answerRouter_1.user_answerRouter);
app.use(`${process.env.SERVER_PATH}/ranking`, protect, rankingRouter_1.rankingRouter);
app.use(`${process.env.SERVER_PATH}/questions`, protect, questionsRouter_1.questionsRouter);
app.listen(process.env.PORT, () => {
    console.log("Node server started running " + process.env.PORT);
});
//# sourceMappingURL=app.js.map