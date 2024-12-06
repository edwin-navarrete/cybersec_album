import axios from "axios"
import { Question } from "./question";

export module Sticker {

    export interface StickerDef extends Question.Identifiable {
        spot: string
        weight: number
        image: string
    }


    export interface UserSticker extends Question.Identifiable {
        albumId: string
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
        config: Question.GameConfig

        constructor(config: Question.GameConfig, album: Album, stickerDAO: StickerDAO) {
            this.album = album
            this.stickerDAO = stickerDAO
            // fibbonaccy reward
            this.latencySchema = new Map<number, number>([[2_000, 5], [5_000, 3], [7_000, 2], [Number.MAX_SAFE_INTEGER, 1]])
            this.difficultySchema = new Map<number, number>([[1.6, 1], [2.1, 2], [Number.MAX_SAFE_INTEGER, 3]]);
            this.config = config;
        }

        async produceStickers(answers: Question.Answer[]): Promise<StickerDef[]> {
            let self = this
            // calc the number of stickers
            let count = answers.reduce((count, ans) => count + self.stickerCountFor(ans), 0);

            if (!count) return []

            return self.stickerDAO.findAll()
                .then(async stickers => {
                    // remove from spotMap those that are already available for the album
                    // unless the album is full
                    let owned = Array.from((await self.album.getStickers()).keys());
                    stickers = stickers.filter(s => !owned.includes(s.spot)) || stickers;
                    let result: StickerDef[] = [];

                    if (self.config.rewardStrategy === Question.RewardStrategy.randomWeigthed) {
                        // select random count of stickers based on weight
                        stickers.sort((a, b) => b.weight - a.weight);
                        let top = stickers.reduce((sum, s) => sum + s.weight, 0);

                        while (count--) {
                            let accum = 0
                            let rand = top * Math.random();
                            let f = stickers.find(s => {
                                return (accum += s.weight) > rand;
                            })
                            f && result.push(f)
                        }
                    }
                    else { // sequential
                        // select sequentially the stickers based on spot
                        stickers.sort((a, b) => a.spot.localeCompare(b.spot));
                        for (let i = 0; count-- > 0; i++) {
                            result.push(stickers[i % stickers.length]);
                        }
                    }
                    return result;
                })
        }

        // depending on latency or difficulty give a number of stickers
        stickerCountFor(answer: Question.Answer): number {
            if (!answer.success) return 0
            let schema = this.difficultySchema
            let marker = answer.difficulty || 0.5
            if (answer.latency && this.config.rewardSchema === Question.RewardSchema.latency) {
                schema = this.latencySchema
                marker = answer.latency
            }
            var closest = Array.from(schema.keys())
                .reduce((prev, key) => Math.max(key, prev), 0)
            for (const k of schema.keys()) {
                if (k > marker) closest = Math.min(closest, k)
            }
            return schema.get(closest) || 0
        }
    }


    export class Album {
        stickerDAO: StickerDAO
        userStickerDAO: UserStickerDAO
        albumId: string

        constructor(stickerDAO: StickerDAO, userStickerDAO: UserStickerDAO, albumId: string) {
            this.stickerDAO = stickerDAO
            this.userStickerDAO = userStickerDAO
            this.albumId = albumId
        }

        // FIXME The sticker details mapped by spot is not serializable! simplify to plain array
        async getStickers(): Promise<Map<string, AlbumStiker>> {
            let self = this
            // TODO: Should filter by albumId in the future
            return this.userStickerDAO.findAll({ order: "+inAlbum" })
                .then(userStickers =>
                    self.stickerDAO.findAll({
                        include: userStickers.map(s => s.stickerId)
                    }).then(stickers => {
                        let stickerMap = new Map(userStickers.map(us => {
                            let s = stickers.find(s => s.id === us.stickerId)
                            if (!s) throw new Error('Inconsistent stickers DB')
                            let as = {
                                ...s,
                                id: us.id,
                                inAlbum: us.inAlbum,
                                albumId: us.albumId,
                                addedOn: us.addedOn,
                                stickerId: us.stickerId
                            } as AlbumStiker
                            return [s.spot, as]
                        }))
                        return stickerMap
                    }
                    ))

        }

        async ownStickers(stickers: StickerDef[]): Promise<UserSticker[]> {
            let upserts = stickers.map(stickerDef => {
                if (!stickerDef.id) throw new Error("Invalid sticker in userSticker")
                return this.userStickerDAO.upsert({
                    albumId: this.albumId,
                    stickerId: stickerDef.id
                })
            })
            return Promise.all(upserts)
        }

        async registerPlayer(playerName: string): Promise<string> {
           localStorage.setItem("playerName", playerName);
           try {
                let uri = process.env.REACT_APP_API+`/album`;
                await axios.post(uri,{
                    albumId: localStorage.getItem("albumId"),
                    playerName: localStorage.getItem("playerName"),
                    startedOn: localStorage.getItem("startedOn"),
                    endedOn: localStorage.getItem("endedOn"),
                    language: navigator.language
                },{
                    headers:{"g-recaptcha-response": Question.DAO.token
                }});
            } catch (error){
                console.error("API error", error);
            }
            return playerName;
        }

        async glueSticker(albumStiker: AlbumStiker): Promise<UserSticker> {
            try{
                if (!albumStiker.inAlbum) {
                    albumStiker = { ...albumStiker, inAlbum: true };
                    // to trigger the start of the album
                    return this.userStickerDAO.upsert(albumStiker as UserSticker);
                }
                return new Promise((resolve) => resolve(albumStiker))
            }
            finally {
                await this.getAchievement();
            }
        }

        async getAchievement(withUnclaimed?: boolean): Promise<number> {
            let allSpots = (new Set((await this.stickerDAO.findAll()).map(s => s.spot))).size
            let albumSpots = (await this.getStickers())
            var filled = withUnclaimed
                ? albumSpots.size
                : Array.from(albumSpots.values())
                    .reduce((cnt, s) => s.inAlbum ? cnt + 1 : cnt, 0)
            if(filled === 1 || filled >= allSpots){
                // Album started or finished
                if(filled >= allSpots){
                    localStorage.setItem("endedOn", Date.now().toString());
                }
                else {
                    localStorage.removeItem("endedOn");
                }

                try {
                    let uri = process.env.REACT_APP_API+`/album`;
                    await axios.post(uri,{
                        albumId: localStorage.getItem("albumId"),
                        startedOn: localStorage.getItem("startedOn"),
                        endedOn: localStorage.getItem("endedOn"),
                        language: navigator.language
                    },{
                        headers:{"g-recaptcha-response": Question.DAO.token
                    }});
                } catch (error){
                    console.error("API error", error);
                }
            }
            return (filled / allSpots)
        }
    }


    export class UserStickerDAO extends Question.DAO<UserSticker> {
        constructor(initialDB:UserSticker[]) {
            super("userSticker",initialDB)
        }
        async upsert(sticker: UserSticker): Promise<UserSticker> {
            return new Promise(resolve => {
                if (!sticker.id) {
                    sticker.id = this.db.length + 1
                    sticker.addedOn = Date.now();
                    sticker.inAlbum = sticker.inAlbum || false;
                    super.push(sticker)
                }
                else {
                    // just update some fields
                    let found = this.db.find(us => us.id === sticker.id)
                    if (!found) throw new Error("Invalid DB at UserStickerDAO")
                    found.inAlbum = sticker.inAlbum || false
                    found.addedOn = Date.now()
                    super.push(found)
                    sticker = found
                }
                resolve(sticker)
            })
        }
    }

    export class StickerDAO extends Question.DAO<StickerDef> {
        constructor(initialDB:StickerDef[]) {
            super("",initialDB)
        }
    }
}
