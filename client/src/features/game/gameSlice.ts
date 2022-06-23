import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { Sticker } from "./sticker";
import { Question } from "./question";
import { RootState } from '../../app/store';
import { changeLanguage, putAnswer, glueSticker, nextQuestion, fetchAlbum } from "./gameMiddleware";

import stickersDB from './data/es/stickerDB.json';

export type QuestionState = Question.QuestionDef & Feedback

export interface Attempt {
    response: number[],
    latency?: number
}

export interface Feedback {
    wrong?: number[]
    success?: boolean | null
}

export type FeedbackAndStickers = Feedback & {
    stickers: Sticker.AlbumStiker[]
}

export type QuestionsAndStickers = {
    questions: Question.QuestionDef[]
    stickers: Sticker.AlbumStiker[]
}

export interface AlbumState {
    token: string
    stickerCount: number
    stickers: Sticker.AlbumStiker[]
    question?: QuestionState
}

const initialState: AlbumState = {
    token: "",
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

// Selector returns true when album is full, has the argument withUnclaimed to determine if full including unclaimed
export const selectAchievement = (state: RootState, withUnclaimed?: boolean) => {
    let total = withUnclaimed ? state.game.stickers.length : state.game.stickers.reduce((cnt, s) => s.inAlbum ? cnt + 1 : cnt, 0);
    return total === state.game.stickerCount
};

// Selector returns percentage of completeness
export const selectGauge = (state: RootState) => {
    let claimed = state.game.stickers.reduce((cnt, s) => s.inAlbum ? cnt + 1 : cnt, 0);
    return claimed / state.game.stickerCount;
};

// Selector returns number of unclaimed stickers
export const selectUnclaimed = (state: RootState) => {
    return state.game.stickers.reduce((cnt, s) => !s.inAlbum ? cnt + 1 : cnt, 0);
};

export const abumSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        updateToken: (state, action: PayloadAction<string>) => {
          Question.DAO.token = action.payload || "";
          state.token = Question.DAO.token;
        }
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
        builder.addCase(changeLanguage.fulfilled, (state, action) => {
            if (state.question) {
                let found = action.payload.questions.find(q => q.id === state.question?.id);
                found && (state.question = { ...state.question, ...found });
            }
            state.stickers = action.payload.stickers;
        });
        builder.addCase(nextQuestion.fulfilled, (state, action) => {
            state.question = action.payload
        });
    }
})

export const { updateToken } = abumSlice.actions
export default abumSlice.reducer;
