// import { AnyAction } from 'redux'
// import { PayloadAction } from '@reduxjs/toolkit'
import { nextQuestion, putAnswer, glueSticker } from './gameMiddleware'
import { QuestionState, FeedbackAndStickers } from './gameSlice'
import { Sticker } from "./sticker";

describe('gameMiddleware', () => {

    beforeEach(() => {
        // Clear userStickerDAO and
    })

    it('should do a full cycle', async () => {
        // New Question works
        let dispatch = jest.fn()
        let state = jest.fn()
        let questionAction = await nextQuestion()(dispatch, state, {})

        expect(questionAction).toBeDefined()
        expect(questionAction.payload).toBeDefined()
        let question = questionAction.payload as QuestionState
        expect(questionAction.type).toEqual('question/nextQuestion/fulfilled')
        expect(question.options).toBeDefined()
        expect(question.solution).toBeDefined()

        // Putting a right answer will generate some stickers
        let attempt = {
            response: question.solution,
            latency: 1_000
        }
        state = jest.fn(() => { return { game: { question: question } } })
        let answerAction = await putAnswer(attempt)(dispatch, state, {})
        let feedback = answerAction.payload as FeedbackAndStickers
        expect(feedback).toBeDefined()
        expect(feedback.stickers.length).toBeGreaterThan(0)
        expect(feedback.success).toBeTruthy()
        expect(feedback.wrong && feedback.wrong.length).toEqual(0)
        expect(Array.from(feedback.stickers.values()).some((s: Sticker.UserSticker) => s.inAlbum)).toBeFalsy()

        // any sticker can be glued
        let originalSize = feedback.stickers.length;
        let sticker = feedback.stickers.values().next().value
        let stickerAction = await glueSticker(sticker)(dispatch, state, {})
        let album = stickerAction.payload as Sticker.AlbumStiker[];
        expect(album.length).toEqual(originalSize);
        expect(Array.from(album.values()).some((s: Sticker.UserSticker) => s.inAlbum)).toBeTruthy()
    });
})
