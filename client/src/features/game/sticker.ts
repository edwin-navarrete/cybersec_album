import axios from "axios"
import { Question } from "./question";
import {v4 as uuidv4 } from "uuid"

function getNextBusinessDay(date:Date) {
    const dayOfWeek = date.getDay();
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + (dayOfWeek > 4 ? 8 - dayOfWeek : 1));
    return nextDay;
}

export namespace Game {

    export interface GameConfig {
        rewardStrategy: RewardStrategy,
        rewardSchema: RewardSchema,
        quizStrategy: QuizStrategy,
        soloTokenStrategy: PlayTokenStrategy,
        coopTokenStrategy: PlayTokenStrategy,
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
        bussinessDays = "bussinessDays",
        unlimited = "unlimited"
    }

    /*
        A play token determines when is allowed to play. Currently based on Date.now().
        validPeriod returns an independent from language representing the period of time where it become valid.
        toString returns a string representation

        NOTE:
        New token iplementations must be in AbstractPlayTokenFactory.register
    */
    export interface PlayToken {
        isInvalid: () => number; // 0 means valid, -1 means is still pending, 1 means it has expired
        validPeriod:  () => string;
        spend: () => void;
    }

    export class UnlimitedToken implements PlayToken {
        isInvalid ():number {
            return 0
        }
        validPeriod(): string{
            return '∞';
        }
        spend() {
        }
    }

    export class DisabledToken implements PlayToken {
        isInvalid ():number {
            return 1
        }
        validPeriod(): string{
            return '??';
        }
        spend() {
        }
    }

    /*
        Represents a Token that is valid on a specific business day only. (From the very first hour of the day to the end of the day)
        If is expired or being spent, it is automatically moved to the next n-th 
        where n is given by increment .
     */
    export class BusinessDayToken implements PlayToken {
        increment: number;
        startDate: number;

        // Set the startDate to the first businessDay given by businessDay (transformed to 1..5). If zero then next biz day
        constructor(businessDay: number = 1, increment: number = 1){
            businessDay = Math.round(Math.max(( (businessDay + 4) % 5 ) + 1, 1));
            this.increment = Math.round(Math.max(increment, 1));
            this.startDate = this.moveStart((i, bizDay) => bizDay.getDay() === businessDay);
        }


        isInvalid():number {
            const now =Date.now();
            const expirationTime = this.startDate + 24 * 60 * 60 * 1000;
            return now < this.startDate ? -1 : now >= expirationTime ? 1 : 0;
        }

        validPeriod(): string{
            const startDate = new Date(this.startDate);
            return startDate.toISOString().split('T')[0];;
        };

        spend() {
            const status = this.isInvalid()
            if(status === 0){
                // If valid then increment
                this.moveStart((i) => i >= this.increment);
            }
            else if(status > 0){
                // If expired, allow to play as soon as posible
                this.moveStart(() => true);
            }
        }

        // Move to next n business day after now where n is given by this.increment
        moveStart(until: (i:number, bizDay:Date)=>boolean): number {
            let n = 0;
            let nextBizDay = new Date();
            while (!until(n, nextBizDay)) {
                nextBizDay = getNextBusinessDay(nextBizDay);
                n++;
            }
            nextBizDay.setHours(0, 0, 0, 0);
            this.startDate = nextBizDay.getTime();
            return this.startDate;
        }
    }
    
    export interface PlayTokenFactory {
        produceToken(): PlayToken
        storeToken(token:PlayToken):string
        loadToken(stored:string):PlayToken
    }

    abstract class AbstractPlayTokenFactory implements PlayTokenFactory {
        static register: Record<string,()=>PlayToken> = {
            'BusinessDayToken': () => new BusinessDayToken(),
            'UnlimitedToken': () => new UnlimitedToken(),
            'DisabledToken': () => new DisabledToken(),
        };

        abstract produceToken(): PlayToken;
        storeToken(token:PlayToken):string {
            if(!AbstractPlayTokenFactory.register[token.constructor.name] ){
                throw new Error(`Unssupported play token ${token.constructor.name}`);
            }
            const toStore = {
                className : token.constructor.name,
                data: token
            }
            return JSON.stringify(toStore);
        } 
        loadToken(stored:string):PlayToken{
            if(!stored) return new DisabledToken();
            const loaded = JSON.parse(stored);
            if(!AbstractPlayTokenFactory.register[loaded.className] || !loaded.data ){
                throw new Error(`Invalid stored token`);
            }
            const newToken:PlayToken = AbstractPlayTokenFactory.register[loaded.className]()
            Object.assign(newToken, loaded.data)
            return newToken;
        }
    }

    export class UnlimitedPlayTokenFactory extends AbstractPlayTokenFactory {
        produceToken(): PlayToken{
            return new UnlimitedToken();
        }
    }

    export class BussinessDaysPlayTokenFactory extends AbstractPlayTokenFactory{
        produceToken(): PlayToken {
            const groupId = localStorage.getItem("groupId")
            const leaderOrdinal = +(localStorage.getItem("isLeader") ?? 0)

            // for Solo next bizDay after yesterday, increment 1
            if(!groupId){
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const nxtBizDay = getNextBusinessDay(yesterday).getDay();
                return new BusinessDayToken(nxtBizDay, 1);
            }
            // for Coop, if is the leader choose a bizDay according to its ordinal and enable once every week
            if( leaderOrdinal > 0 ){
                return new BusinessDayToken(leaderOrdinal, 5);
            }
            else {
                // Disabled for others
                return new DisabledToken()
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
                    )
                )

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
                await super.push(sticker)
            }
            else {
                // just update some fields
                let found = this.db.find(us => us.id === sticker.id)
                if (!found) throw new Error("Invalid DB at UserStickerDAO")
                found.inAlbum = sticker.inAlbum || false
                found.addedOn = Date.now()
                await super.push(found)
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

