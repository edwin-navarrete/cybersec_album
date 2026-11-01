import config from './gameConfig.json'

/*
    The album grid has 3 columns, so every row is a comic strip of 3 panels
    ("1A 1B 1C" is strip 1). These helpers derive the strip goals from the
    album spots and the stickers the player already owns.
*/

export const STRIP_SIZE = 3

export interface OwnedSticker {
    spot: string
    inAlbum?: boolean
}

// "2B" -> 2
export const stripOf = (spot: string): number => parseInt(spot, 10)

export const stripSpots = (strip: number, spots: string[]): string[] =>
    spots.filter(s => stripOf(s) === strip)

// Only the sequential reward gives the stickers in album order, so only then
// the next panel can be announced.
export const announcesNextPanel = (): boolean => config.rewardStrategy === 'sequential'

// First spot, in album order, that has no sticker yet
export const nextSpot = (spots: string[], stickers: OwnedSticker[]): string | undefined => {
    const owned = new Set(stickers.map(s => s.spot))
    return spots.find(s => !owned.has(s))
}

// Strips whose every panel was already glued into the album
export const completedStrips = (spots: string[], stickers: OwnedSticker[]): number[] => {
    const claimed = new Set(stickers.filter(s => s.inAlbum).map(s => s.spot))
    const strips = Array.from(new Set(spots.map(stripOf)))
    return strips.filter(n => stripSpots(n, spots).every(s => claimed.has(s)))
}

// Panel that needs the player's attention: first sticker won but not glued yet
// (it must be claimed before moving on), otherwise the first panel still missing.
export const attentionSpot = (spots: string[], stickers: OwnedSticker[]): string | undefined => {
    const unclaimed = new Set(stickers.filter(s => !s.inAlbum).map(s => s.spot))
    return spots.find(s => unclaimed.has(s)) ?? nextSpot(spots, stickers)
}

export interface StripProgress {
    strip: number   // first strip that is not completely glued
    total: number   // strips in the album
    claimed: number // panels of that strip already glued
    pending: number // panels of that strip won but still to claim
    size: number    // panels in that strip
}

// Progress of the first strip that is not completely glued, undefined when the album is done
export const stripProgress = (spots: string[], stickers: OwnedSticker[]): StripProgress | undefined => {
    const claimed = new Set(stickers.filter(s => s.inAlbum).map(s => s.spot))
    const first = spots.find(s => !claimed.has(s))
    if (!first) return undefined
    const strip = stripOf(first)
    const inStrip = stripSpots(strip, spots)
    const won = new Set(stickers.map(s => s.spot))
    return {
        strip,
        total: new Set(spots.map(stripOf)).size,
        claimed: inStrip.filter(s => claimed.has(s)).length,
        pending: inStrip.filter(s => won.has(s) && !claimed.has(s)).length,
        size: inStrip.length
    }
}

// Strips the question shows: the one of the panel being earned and every one that
// still has stickers to claim, so everything won can be claimed without leaving it.
export const stripsToShow = (spots: string[], stickers: OwnedSticker[], target: string): number[] => {
    const pending = stickers.filter(s => !s.inAlbum && spots.includes(s.spot)).map(s => stripOf(s.spot))
    return Array.from(new Set([stripOf(target), ...pending])).sort((a, b) => a - b)
}
