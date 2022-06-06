import { createSlice, createSelector } from '@reduxjs/toolkit';
import { Sticker } from "./sticker";
import { Question } from "./question";
import { RootState } from '../../app/store';
import { putAnswer, glueSticker, nextQuestion, fetchAlbum } from "./gameMiddleware";

import stickersDB from './stickerDB.json';

export type QuestionState = Question.QuestionDef & Feedback

export interface Attempt {
    response: number[],
    latency?: number
}

export interface Feedback {
    wrong?: number[]
    success?: boolean
}

export type FeedbackAndStickers = Feedback & {
    stickers: Sticker.AlbumStiker[]
}

export interface AlbumState {
    stickerCount: number,
    stickers: Sticker.AlbumStiker[],
    question?: QuestionState
}

// { "userId": "ME", "inAlbum": true, "stickerId": 1, "id": 1, "spot": "1A", "weight": 16, "image": "sticker/3ad5b52db38cea1ea24eefa8f9dba6ceX.gif" }
const initialState: AlbumState = {
    stickerCount: stickersDB.length,
    stickers: []
};

// Selector for the question
export const selectQuestion = (state: RootState) => state.game.question;

// Selector for album stickers
export const selectStickers = (state: RootState) => state.game.stickers;

// Selector for sticker spots
export const selectStickerSpots = createSelector((state: RootState) => state.game.stickerCount, (stickerCount) => {
    const letters = ['A', 'B', 'C']
    return [...Array(stickerCount).keys()].map(i => `${Math.floor(i / 3) + 1}${letters[i % 3]}`)
});

// Selector returns true when album is full
export const selectAchievement = (state: RootState) => {
    let claimed = state.game.stickers.filter(s => s.inAlbum)
    return claimed.length === state.game.stickerCount
};


export const abumSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
    },
    extraReducers: builder => {
        builder.addCase(putAnswer.fulfilled, (state, action) => {
            state.stickers = action.payload.stickers
            if (state.question) {
                state.question.success = action.payload.success;
                state.question.wrong = action.payload.wrong;
            }
        });
        builder.addCase(fetchAlbum.fulfilled, (state, action) => {
            state.stickers = action.payload
        });
        builder.addCase(glueSticker.fulfilled, (state, action) => {
            state.stickers = action.payload
        });
        builder.addCase(nextQuestion.fulfilled, (state, action) => {
            state.question = action.payload
        });
    }
})

export default abumSlice.reducer;
