import { Question } from "../src/question";

export module Sticker {

    export interface StickerDef extends Question.Identifiable {
        spot: string
        weight: number
        image: string
    }


    export interface UserSticker extends Question.Identifiable {
        userId: string
        stickerId: number
        inAlbum?: boolean
        addedOn?: number
    }

    export type AlbumStiker = StickerDef & UserSticker

    export class Reward {
        album: Album
        stickerDAO: StickerDAO
        latencySchema: Map<number, number> // maxLatency-> stickerCount
        difficultySchema: Map<number, number> // maxDifficulty-> stickerCount

        constructor(album: Album, stickerDAO: StickerDAO) {
            this.album = album
            this.stickerDAO = stickerDAO
            // fibbonaccy reward
            this.latencySchema = new Map<number, number>([[2_000, 5], [5_000, 3], [7_000, 2], [Number.MAX_SAFE_INTEGER, 1]])
            this.difficultySchema = new Map<number, number>([[0.5, 1], [0.7, 2], [0.9, 3], [1, 5]])
        }

        async produceStickers(quiz: Question.Quiz): Promise<StickerDef[]> {
            let self = this
            // calc the number of stickers
            let answers = quiz.getAnswers()
            let count = answers.reduce((count, ans) => count + self.stickerCountFor(ans), 0);

            if (!count) return []

            return self.stickerDAO.findAll()
                .then(async stickers => {
                    // remove from spotMap those that are already available for the album
                    // unless the album is full
                    let owned = Array.from((await self.album.getStickers()).keys())
                    stickers = stickers.filter(s => !owned.includes(s.spot)) || stickers

                    // select random count of stickers based on weight
                    stickers.sort((a, b) => b.weight - a.weight)
                    let result = new Array()
                    let top = stickers.reduce((sum, s) => sum + s.weight, 0)

                    while (count--) {
                        let accum = 0
                        let rand = top * Math.random()
                        result.push(stickers.find(s => {
                            return (accum += s.weight) > rand
                        }))
                    }
                    return result
                })
        }

        // depending on latency or difficulty give a number of stickers
        stickerCountFor(answer: Question.Answer) {
            if (!answer.success) return 0
            let schema = this.difficultySchema
            let marker = answer.difficulty
            if (answer.latency) {
                schema = this.latencySchema
                marker = answer.latency
            }
            var closest = Array.from(schema.keys())
                .reduce((prev, key) => Math.max(key, prev), 0)
            for (const k of schema.keys()) {
                if (k > marker) closest = Math.min(closest, k)
            }
            return schema.get(closest)
        }
    }


    export class Album {
        stickerDAO: StickerDAO
        userStickerDAO: UserStickerDAO
        userId: string

        constructor(stickerDAO: StickerDAO, userStickerDAO: UserStickerDAO, userId: string) {
            this.stickerDAO = stickerDAO
            this.userStickerDAO = userStickerDAO
            this.userId = userId
        }

        // The sticker details mapped by spot
        async getStickers(): Promise<Map<string, AlbumStiker>> {
            let self = this
            // TODO: Should filter by userId in the future
            return this.userStickerDAO.findAll({ order: "+inAlbum" })
                .then(userStickers =>
                    self.stickerDAO.findAll({
                        include: userStickers.map(s => s.stickerId)
                    }).then(stickers => {
                        let stickerMap = new Map(userStickers.map(us => {
                            let s = stickers.find(s => s.id == us.stickerId)
                            let as = {
                                ...s,
                                id: us.id,
                                inAlbum: us.inAlbum,
                                userId: us.userId,
                                addedOn: us.addedOn,
                                stickerId: us.stickerId
                            } as AlbumStiker
                            return [s.spot, as]
                        }))
                        return stickerMap
                    }
                    ))

        }

        async glueSticker(albumStiker: AlbumStiker): Promise<UserSticker> {
            if (!albumStiker.inAlbum) {
                console.log(`Glued ${albumStiker.id} ${albumStiker.spot}`)
                albumStiker.inAlbum = true
                return this.userStickerDAO.upsert(albumStiker as UserSticker)
            }
        }

        async getAchievement(withUnclaimed?: boolean): Promise<number> {
            let allSpots = (new Set((await this.stickerDAO.findAll()).map(s => s.spot))).size
            let albumSpots = (await this.getStickers())
            var filled = withUnclaimed
                ? albumSpots.size
                : Array.from(albumSpots.values())
                    .reduce((cnt, s) => s.inAlbum ? cnt + 1 : cnt, 0)
            return (filled / allSpots)
        }
    }


    export class UserStickerDAO extends Question.DAO<UserSticker> {

        async upsert(sticker: UserSticker): Promise<UserSticker> {
            return new Promise(resolve => {
                if (!sticker.id) {
                    sticker.id = this.db.length + 1
                    sticker.addedOn = Date.now()
                    sticker.inAlbum = sticker.inAlbum || false
                    this.db.push(sticker)
                }
                else {
                    // just update some fields
                    let found = this.db.find(us => us.id == sticker.id)
                    found.inAlbum = sticker.inAlbum || false
                    found.addedOn = Date.now()
                    sticker = found
                }
                resolve(sticker)
            })
        }
    }


    export class StickerDAO extends Question.DAO<StickerDef> {
        constructor(stickerDB: StickerDef[]) {
            super(stickerDB)
        }
    }
}
