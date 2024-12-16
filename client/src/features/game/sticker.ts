import axios from "axios"
import { Question } from "./question";
import {v4 as uuidv4 } from "uuid"

const MAX_DATE_VALUE = 864000000000000;

export namespace Game {

    export interface GameConfig {
        rewardStrategy: RewardStrategy,
        rewardSchema: RewardSchema,
        quizStrategy: QuizStrategy,
        playTokenStrategy: PlayTokenStrategy,
        leaderTimeout: number
    }

    export enum RewardStrategy {
        sequential = "sequential",
        randomWeigthed = "randomWeigthed"
    }

    export enum RewardSchema {
        latency = "latency",
        difficulty = "difficulty"
    }

    export enum QuizStrategy {
        randomUnseen = "randomUnseen",
        easiestUnseen = "easiestUnseen"
    }

    export enum PlayTokenStrategy {
        workingDays = "workingDays",
        unlimited = "unlimited"
    }


    export interface PlayToken {
        description: string // Describe the period of time when the player can play
        startDate: number
        endDate: number
    }
    
    export interface PlayTokenFactory {
        produceToken(leaderOrdinal:number): PlayToken
    }

    export class UnlimitedPlayTokenFactory implements PlayTokenFactory {
        produceToken(_leaderOrdinal:number): PlayToken{
            return {
                description:'',
                startDate: Date.now(),
                endDate: MAX_DATE_VALUE
            }
        }
    }

    export class WorkingDaysPlayTokenFactory implements PlayTokenFactory {
        produceToken(leaderOrdinal:number): PlayToken {
            // Returns a token so the player can play according to the following sequence:
            // the first leader (ordinal 1) can play on next monday, the second can play on next Tuesday.. the sixth on next Monday 
            const laborDay = ((leaderOrdinal - 1) % 5) + 1;
            const now = new Date(Date.now());
            let diff = laborDay - now.getDay()
            if(diff < 0){
                diff += 7;
            }
            const startDate = new Date(now);
            startDate.setDate(now.getDate() + diff);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);
            const formattedDate = startDate.toISOString().split('T')[0];

            return {
                description:`${formattedDate}`,
                startDate:startDate.getTime(),
                endDate:endDate.getTime(),
            }
        }
    }


    export interface Player extends Question.Identifiable {
        playerName: string
        isGroup: boolean
        isLeader: number
        modifiedOn: string
    }

    export class PlayerDAO extends Question.DAO<Player> {
        constructor(initialDB:Player[]){
            super("player", initialDB)
        }

        async findAll(options: Question.QueryOptions = {}): Promise<Player[]> {
            this.loaded = false
            return super.findAll(options)
        }
    }
}

export namespace Sticker {

    export interface StickerDef extends Question.Identifiable {
        spot: string
        weight: number
        image: string
    }

    export interface Player extends Question.Identifiable {
        playerName: string
        isGroup: boolean
        isLeader: number
        modifiedOn: string
    }

    export interface Team {
        teamName: string
        players: Player[]
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
        config: Game.GameConfig

        constructor(config: Game.GameConfig, album: Album, stickerDAO: StickerDAO) {
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

                    if (self.config.rewardStrategy === Game.RewardStrategy.randomWeigthed) {
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
            if (answer.latency && this.config.rewardSchema === Game.RewardSchema.latency) {
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

        constructor(stickerDAO: StickerDAO, userStickerDAO: UserStickerDAO) {
            this.stickerDAO = stickerDAO
            this.userStickerDAO = userStickerDAO
        }

        async getAlbumId(): Promise<string> {
            let albumId = localStorage.getItem("albumId");
            if(!albumId){
                try {
                    const playerId = localStorage.getItem("playerId");
                    const groupId = localStorage.getItem("groupId");
                    const isLeader = localStorage.getItem("isLeader");
                    const uri = process.env.REACT_APP_API+`/album`;
                    const headers = {"g-recaptcha-response": Question.DAO.token}
                    if( groupId && !isLeader ){
                        const getResp = await axios.get(uri,{
                            params: {playerId:groupId},
                            headers
                        });
                        albumId = getResp.data.results?.[0]?.albumId as string ?? 'undefined';
                    }
                    else {
                        albumId = uuidv4();
                        const ownerId = groupId ?? playerId;
                        const startedOn = Date.now().toString()
                        await axios.post(uri,{
                            albumId: albumId,
                            playerId: ownerId,
                            startedOn: startedOn,
                            language: navigator.language
                        }, { headers });
                        localStorage.setItem("startedOn", startedOn);
                    }
                } catch (error){
                    albumId = 'undefined';
                    console.error("API error", error);
                }
                localStorage.setItem("albumId", albumId);
            }
            return albumId;
        }

        // FIXME The sticker details mapped by spot is not serializable! simplify to plain array
        async getStickers(): Promise<Map<string, AlbumStiker>> {
            let self = this
            return this.userStickerDAO.findAll({ filter: { albumId: await this.getAlbumId() }, order: "+inAlbum" })
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

        async ownStickers(stickers: StickerDef[]): Promise<AlbumStiker[]> {
            const albumId = await this.getAlbumId()
            let upserts = stickers.map(stickerDef => {
                if (!stickerDef.id) throw new Error("Invalid sticker in userSticker")
                return this.userStickerDAO.upsert({
                    albumId: albumId,
                    stickerId: stickerDef.id
                }).then(userSticker => {
                    return {
                        ...userSticker,
                        ...stickerDef
                    }
                })
            })
            return Promise.all(upserts)
        }

        async registerPlayer(playerName: string, gameMode: string): Promise<string> {
           try {
                const playerId = localStorage.getItem("playerId");
                const apiResponse = await axios.post(process.env.REACT_APP_API+'/player',{
                    playerId: playerId,
                    playerName: playerName,
                    mode: gameMode,
                    lang: localStorage.getItem("lang") ?? 'es'
                },{
                    headers:{"g-recaptcha-response": Question.DAO.token
                }});
                const newPlayer = apiResponse.data
                localStorage.setItem("playerId", newPlayer.playerId);
                localStorage.setItem("playerName", playerName);
                newPlayer.groupId && localStorage.setItem("groupId", newPlayer.groupId);
                newPlayer.isLeader && localStorage.setItem("isLeader", newPlayer.isLeader);
                localStorage.setItem("modifiedOn", newPlayer.modifiedOn);
                
                // Register the album immediately
                await this.getAlbumId()
                return playerName;
            }  
            catch (error: any) {
                if (axios.isAxiosError(error) && error.response?.status === 409) {
                    throw new Error("DUPLICATE_NAME");
                } else {
                    console.error("API error", error);
                    throw new Error("GENERAL_ERROR");
                }
            }
        }

        async glueSticker(albumStiker: AlbumStiker): Promise<UserSticker> {
            try{
                if (!albumStiker.inAlbum) {
                    albumStiker = { ...albumStiker, inAlbum: true };
                    // to trigger the start of the album
                    return this.userStickerDAO.upsert(albumStiker as UserSticker);
                }
                return albumStiker
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
            return sticker;
        }
    }

    export class StickerDAO extends Question.DAO<StickerDef> {
        constructor(initialDB:StickerDef[]) {
            super("",initialDB)
        }
    }


}

