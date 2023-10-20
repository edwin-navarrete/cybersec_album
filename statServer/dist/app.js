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
const dotenv = __importStar(require("dotenv"));
const express_1 = __importDefault(require("express"));
const bodyParser = __importStar(require("body-parser"));
const albumRouter_1 = require("./routes/albumRouter");
const user_answerRouter_1 = require("./routes/user_answerRouter");
const rankingRouter_1 = require("./routes/rankingRouter");
const questionsRouter_1 = require("./routes/questionsRouter");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
dotenv.config();
//app.use(cors({ origin: process.env.UI_URL })); // Habilitar CORS
app.use((0, cors_1.default)()); // Habilitar CORS
app.use(bodyParser.json());
app.use(`${process.env.SERVER_PATH}/album`, albumRouter_1.albumRouter);
app.use(`${process.env.SERVER_PATH}/user`, user_answerRouter_1.user_answerRouter);
app.use(`${process.env.SERVER_PATH}/ranking`, rankingRouter_1.rankingRouter);
app.use(`${process.env.SERVER_PATH}/questions`, questionsRouter_1.questionsRouter);
app.use(`${process.env.SERVER_PATH}/questions`, questionsRouter_1.questionsRouterinfo);
app.listen(process.env.PORT, () => {
    console.log("Node server started running " + process.env.PORT);
});
