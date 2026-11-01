import { stripOf, stripSpots, nextSpot, attentionSpot, completedStrips, stripProgress } from './strips'

const spots = ['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C']
const own = (...list: Array<[string, boolean]>) => list.map(([spot, inAlbum]) => ({ spot, inAlbum }))

describe('strips', () => {
    it('reads the strip number from the spot', () => {
        expect(stripOf('1A')).toBe(1)
        expect(stripOf('7C')).toBe(7)
        expect(stripOf('12B')).toBe(12)
    })

    it('lists the panels of a strip', () => {
        expect(stripSpots(2, spots)).toEqual(['2A', '2B', '2C'])
    })

    it('finds the next panel in album order', () => {
        expect(nextSpot(spots, [])).toBe('1A')
        expect(nextSpot(spots, own(['1A', true], ['1B', false]))).toBe('1C')
        expect(nextSpot(spots, spots.map(s => ({ spot: s, inAlbum: true })))).toBeUndefined()
    })

    it('only completes a strip when every panel is glued, not just won', () => {
        const stickers = own(['1A', true], ['1B', true], ['1C', false], ['2A', true])
        expect(completedStrips(spots, stickers)).toEqual([])
        expect(completedStrips(spots, own(['1A', true], ['1B', true], ['1C', true], ['2A', true]))).toEqual([1])
    })

    it('asks to claim what was won before announcing the next panel', () => {
        expect(attentionSpot(spots, own(['1A', true], ['1B', false], ['1C', false]))).toBe('1B')
        expect(attentionSpot(spots, own(['1A', true], ['1B', true]))).toBe('1C')
        expect(attentionSpot(spots, [])).toBe('1A')
        expect(attentionSpot(spots, spots.map(s => ({ spot: s, inAlbum: true })))).toBeUndefined()
    })

    it('does not move to the next strip while panels of the current one are unclaimed', () => {
        expect(stripProgress(spots, own(['1A', true], ['1B', false], ['1C', false])))
            .toEqual({ strip: 1, total: 3, claimed: 1, pending: 2, size: 3 })
    })

    it('moves on once the strip is fully glued', () => {
        expect(stripProgress(spots, own(['1A', true], ['1B', true], ['1C', true], ['2A', false])))
            .toEqual({ strip: 2, total: 3, claimed: 0, pending: 1, size: 3 })
        expect(stripProgress(spots, [])).toEqual({ strip: 1, total: 3, claimed: 0, pending: 0, size: 3 })
        expect(stripProgress(spots, spots.map(s => ({ spot: s, inAlbum: true })))).toBeUndefined()
    })
})
