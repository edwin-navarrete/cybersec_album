import { createAsyncThunk } from '@reduxjs/toolkit';

import { Question } from "./question";
import { Game, Sticker } from "./sticker";
import stickersDB from './data/es/stickerDB.json';
import questionDB from './data/es/questionDB.json';
import config from './gameConfig.json';

import { RootState } from '../../app/store';
import { QuestionState, Attempt, QuestionsAndStickers, FeedbackAndStickers } from './gameSlice'

// backward compatibility
if(!localStorage.getItem("startedOn")){
    localStorage.setItem("startedOn", Date.now().toString())
}


const stickerDAO = new Sticker.StickerDAO(stickersDB as Sticker.StickerDef[])
export const userStickerDAO = new Sticker.UserStickerDAO([])
export const playerDefDAO = new Game.PlayerDAO([])

const theAlbum = new Sticker.Album(stickerDAO, userStickerDAO)
const gameConfig = config as Game.GameConfig;

// Available play token factories
const playTokenFactories: Record<Game.PlayTokenStrategy, () => Game.PlayTokenFactory> = {
    [Game.PlayTokenStrategy.bussinessDays]: () => new Game.BussinessDaysPlayTokenFactory(),
    [Game.PlayTokenStrategy.unlimited]: () => new Game.UnlimitedPlayTokenFactory(),
};

export const getPlayTokenFactory = (coopMode:boolean) : Game.PlayTokenFactory => {
    return coopMode? playTokenFactories[gameConfig.coopTokenStrategy]() : playTokenFactories[gameConfig.soloTokenStrategy]()
};

export const questionDefDAO = new Question.QuestionDefDAO(questionDB as Question.QuestionDef[])
export const userAnswerDAO = new Question.UserAnswerDAO()
const theQuiz = new Question.Quiz(gameConfig, userAnswerDAO, questionDefDAO, theAlbum)


export const fetchAlbum = createAsyncThunk<Sticker.AlbumStiker[]>
    ('album/fetch', async () => {
        let stickers = await theAlbum.getStickers()
        if(!stickers.size){
            // if first time, give the first sticker as a sample
            console.log("Adding Sample")
            let stickerSample = await stickerDAO.findAll({ include: [1] })
            let newStickers = await theAlbum.ownStickers(stickerSample);
            await theAlbum.glueSticker(newStickers[0]);
            stickers = await theAlbum.getStickers()
        }
        return Array.from(stickers.values())
    })

export const changeLanguage = createAsyncThunk<QuestionsAndStickers, string>
    ('album/lang', async (newLanguage) => {
        localStorage.setItem("lang", newLanguage);
        await questionDefDAO.findAll({ filter:{ lang:newLanguage } });
        let newStickers = await import(`./data/${newLanguage}/stickerDB.json`);
        stickerDAO.db = Array.from(newStickers as Sticker.StickerDef[]);
        let stickers = await theAlbum.getStickers()
        return { questions: questionDefDAO.db, stickers: Array.from(stickers.values()) }
    })

export const putAnswer = createAsyncThunk<FeedbackAndStickers, Attempt, { state: RootState }>
    ('question/putAnswer', async (attempt, thunkApi) => {
        // Store the answer
        const question = thunkApi.getState().game.question
        if (!question) throw new Error("Illegal answer without question")
        Question.DAO.token = thunkApi.getState().game.token;
        let answer = await theQuiz.putAnswer(question, attempt.response, attempt.latency)
        let reward = new Sticker.Reward(gameConfig, theAlbum, stickerDAO);
        const stickerDefs = await reward.produceStickers([answer])
        await theAlbum.ownStickers(stickerDefs);
        let wrong = attempt.response.filter(r => !question.solution.includes(r))
        return {
            wrong: wrong,
            success: answer.success,
            stickers: Array.from((await theAlbum.getStickers()).values())
        } as FeedbackAndStickers;
    })
// Define el tipo para los parámetros del thunk
interface RegisterPlayerPayload {
    playerName: string;
    gameMode: string;
}

export const registerPlayer = createAsyncThunk<string, RegisterPlayerPayload>
    ('album/registerPlayer', async ({ playerName, gameMode }) => {
        await theAlbum.registerPlayer(playerName, gameMode);
        return playerName;
    })

export const glueSticker = createAsyncThunk<Sticker.AlbumStiker[], Sticker.AlbumStiker>
    ('album/glueSticker', async (userSticker) => {
        await theAlbum.glueSticker(userSticker)
        // FIXME We might return the sticker instead of the whole album here
        let stickers = await theAlbum.getStickers()
        return Array.from(stickers.values())
    })

export const nextQuestion = createAsyncThunk<QuestionState>
    ('question/nextQuestion', async () => {
        const tokenFactory = getPlayTokenFactory(!!localStorage.getItem("groupId"));
        let playToken = localStorage.getItem("playToken");
        let token = null;
        // Create the token if not exists or it was previously disabled 
        if(!playToken || tokenFactory.loadToken(playToken).constructor.name === 'DisabledToken') {
            token = tokenFactory.produceToken();
        }
        else {
            // Spend the existing token
            token = tokenFactory.loadToken(playToken);
            token.spend()
        }
        playToken = tokenFactory.storeToken(token);
        localStorage.setItem("playToken", playToken);

        let questions = await theQuiz.generate(1)
        if (!questions[0] || !questions[0].id) throw new Error('Illegal question in Middleware')
        return questions[0] as QuestionState
    })

async function reloadTeam() {
    try {
        const groupId = localStorage.getItem("groupId");
        const playerId = localStorage.getItem("playerId") ?? -1;
        const theTeam = {} as Sticker.Team;
        if(groupId){
            const grpArr = await playerDefDAO.findAll({ filter:{  playerId:groupId } });
            theTeam.teamName = grpArr?.[0]?.playerName ?? 'Unknown'
            theTeam.players =  await playerDefDAO.findAll({ filter:{  groupId } });
            const updateIsLeader = (player: Game.Player) => {
                if (player.id === +playerId) {
                    localStorage.setItem("isLeader", String(player.isLeader));
                } else {
                    localStorage.removeItem("isLeader");
                }
            };
            theTeam.players.sort((a,b)=>{
                if( a.isLeader ){
                    updateIsLeader(a);
                    return -1;
                }
                if( b.isLeader ){
                    updateIsLeader(b);
                    return 1;
                }
                return a.playerName.localeCompare(b.playerName);
            })
        }
        return theTeam;
    } catch (error) {
        console.error("Error loading team:", error);
        throw error;
    }
}

export const loadTeam = createAsyncThunk<Sticker.Team>
    ('album/loadTeam', reloadTeam)

export const changeLeader = createAsyncThunk<Sticker.Team, Game.Player>
    ('album/changeLeader', async (leader : Game.Player) => {
        try {
            const groupId = localStorage.getItem("groupId");
            if(groupId){
                await playerDefDAO.push({ ...leader, isLeader: 1 } as Game.Player);       
            }
            return await reloadTeam()
        }
        catch(e){
            console.error(e);
            throw e;
        }
    })

/*
    Returns  now, player.modifiedOn, leaderDue 
*/
export const  getLeaderDeadline = (player: Game.Player):[number, number, number] => {
    const date =Date.parse(player.modifiedOn);
    const now = Date.now()
    if(!player.isLeader) return [now, date, 0];
    const due = gameConfig.leaderTimeout + date;
    return [now, date, (due > now )? due : 0]; 
}