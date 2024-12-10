import { createAsyncThunk } from '@reduxjs/toolkit';
import {v4 as uuidv4 } from "uuid"

import { Question } from "./question";
import { Sticker } from "./sticker";
import stickersDB from './data/es/stickerDB.json';
import questionDB from './data/es/questionDB.json';
import config from './gameConfig.json';

import { RootState } from '../../app/store';
import { QuestionState, Attempt, QuestionsAndStickers, FeedbackAndStickers } from './gameSlice'

var ALBUM_ID = localStorage.getItem("albumId");
if(!ALBUM_ID){
    ALBUM_ID = uuidv4();
    localStorage.setItem("albumId", ALBUM_ID)
    localStorage.setItem("startedOn", Date.now().toString())
}

// backward compatibility
if(!localStorage.getItem("startedOn")){
    localStorage.setItem("startedOn", Date.now().toString())
}

const stickerDAO = new Sticker.StickerDAO(stickersDB as Sticker.StickerDef[])
export const userStickerDAO = new Sticker.UserStickerDAO([])
const theAlbum = new Sticker.Album(stickerDAO, userStickerDAO, ALBUM_ID)
const gameConfig = config as Question.GameConfig


const questionDefDAO = new Question.QuestionDefDAO(questionDB as Question.QuestionDef[])
const userAnswerDAO = new Question.UserAnswerDAO()
const theQuiz = new Question.Quiz(gameConfig, userAnswerDAO, questionDefDAO, ALBUM_ID)

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
        let newQuestions = await import(`./data/${newLanguage}/questionDB.json`);
        questionDefDAO.db = Array.from(newQuestions as Question.QuestionDef[]);
        let newStickers = await import(`./data/${newLanguage}/stickerDB.json`);
        stickerDAO.db = Array.from(newStickers as Sticker.StickerDef[]);
        let stickers = await theAlbum.getStickers()
        return { questions: questionDefDAO.db, stickers: Array.from(stickers.values()) }
    })

export const putAnswer = createAsyncThunk<FeedbackAndStickers, Attempt, { state: RootState }>
    ('question/putAnswer', async (attempt, thunkApi) => {
        const question = thunkApi.getState().game.question
        if (!question) throw new Error("Illegal answer without question")
        Question.DAO.token = thunkApi.getState().game.token;
        let answer = await theQuiz.putAnswer(question, attempt.response, attempt.latency)
        let reward = new Sticker.Reward(gameConfig, theAlbum, stickerDAO);
        let stickerDefs = await reward.produceStickers([answer])
        theAlbum.ownStickers(stickerDefs)
        let wrong = attempt.response.filter(r => !question.solution.includes(r))
        return {
            wrong: wrong,
            success: answer.success,
            stickers: Array.from((await theAlbum.getStickers()).values())
        } as FeedbackAndStickers;
    })

export const registerPlayer = createAsyncThunk<string, string>
    ('album/registerPlayer', async (playerName: string) => {
        await theAlbum.registerPlayer(playerName)
        return playerName
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
        let questions = await theQuiz.generate(1)
        if (!questions[0] || !questions[0].id) throw new Error('Illegal question in Middleware')
        return questions[0] as QuestionState
    })
