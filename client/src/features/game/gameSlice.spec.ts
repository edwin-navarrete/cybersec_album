import { selectStickerSpots, AlbumState } from './gameSlice'

describe.only('gameSlide', () => {
    it.only('should do a full cycle', () => {
        const state = {
            game: { stickerCount: 7 } as AlbumState
        }
        let spots = selectStickerSpots(state)
        expect(spots).toEqual(['1A', '1B', '1C', '2A', '2B', '2C', '3A'])
    })
})
