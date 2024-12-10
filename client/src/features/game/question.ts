import axios from "axios"

export module Question {

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

    export interface GameConfig {
        rewardStrategy: RewardStrategy,
        rewardSchema: RewardSchema,
        quizStrategy: QuizStrategy
    }

    enum QuestionType {
        single = "single",
        multiple = "multiple"
    }

    export interface Identifiable {
        id?: number
    }

    export interface QuestionDef extends Identifiable {
        type: QuestionType
        question: string
        options: string[]
        solution: number[]
        difficulty: number,
        feedback?: string
    }

    export interface Answer extends Identifiable {
        albumId: string
        questionId: number
        success?: boolean | null
        latency?: number
        attempts?: number
        answeredOn?: number
        difficulty?: number
    }

    interface QueryOptions {
        include?: any[]
        exclude?: any[]
        order?: string | string[] // "[-|+]field"
        limit?: number
    }

    export class Quiz {
        albumId: string
        userAnswerDAO: UserAnswerDAO
        questionDefDAO: QuestionDefDAO
        answers: Answer[]
        config: GameConfig

        constructor(config: GameConfig, userAnswerDAO: UserAnswerDAO, questionDefDAO: QuestionDefDAO, albumId: string) {
            this.albumId = albumId
            this.userAnswerDAO = userAnswerDAO
            this.questionDefDAO = questionDefDAO
            this.answers = []
            this.config = config
        }

        async generate(count: number): Promise<QuestionDef[]> {
            // Easiest unseen question first,
            // then the oldest failed questions
            // and then the oldest succeeded
            let self = this
            return this.userAnswerDAO.findAll({ order: ["+success", "+answeredOn"] })
                .then(answers => answers.map(answer => answer.questionId))
                .then(seen =>
                    self.questionDefDAO.findAll({
                        exclude: seen,
                        order: (this.config.quizStrategy === "randomUnseen" ? "__random" : "+difficulty"),
                        limit: count
                    }).then(unseen => {
                        let missingCnt = count - unseen.length
                        if (missingCnt > 0) {
                            // complete with seen
                            let missing = seen.slice(0, missingCnt)
                            return self.questionDefDAO.findAll({
                                include: missing
                            }).then(missingDefs => unseen.concat(missingDefs))
                        }
                        return unseen
                    })
                )

        }

        async putAnswer(question: QuestionDef, response: number[], latency?: number): Promise<Answer> {
            if (!question.id) throw new Error("question id is required")
            let answer: Answer = {
                albumId: this.albumId,
                questionId: question.id,
                success: response.length === question.solution.length
                    && response.reduce((a, b) => a && question.solution.includes(b), true),
                latency: latency,
                difficulty: question.difficulty
            }
            let store = {...answer};
            if(response.length === 0){
                store.success = null;
            }
            answer = await this.userAnswerDAO.put(store)
            this.answers.push(answer)
            return answer
        }

        getAnswers(): Answer[] {
            return this.answers
        }
    }

    function compare(x: any, y: any, field: string, desc: boolean) {
        if (field === "_random") return Math.floor(Math.random() * 3) - 1
        let a = x[field], b = y[field]
        if (a > b) return desc ? -1 : 1
        if (a < b) return desc ? 1 : -1
        return 0;
    }

    export class DAO<Type extends Identifiable>{
        db: Type[]
        static token: string = ""
        entrypoint: string

        constructor(entrypoint:string, initialDB: Type[]) {
            this.db = initialDB
            // verify no duplicated ids
            if (new Set(this.db.map(i => i.id)).size !== this.db.length)
                throw (new Error('Duplicated key value'));
            this.entrypoint = entrypoint
        }

        findAll(options?: QueryOptions): Promise<Type[]> {
            let db = this.db
            return new Promise(function(resolve) {
                options = options || {}
                let exclude = options.exclude || [];
                let include = options.include || [];
                let results = db.filter(q =>
                    (!include.length || include.includes(q.id)) && !exclude.includes(q.id));
                if (options.order) {
                    if (typeof options.order === "string") {
                        options.order = [options.order]
                    }
                    let ordering = options.order.reverse().map(o => {
                        return { desc: o.startsWith('-'), fld: o.substring(1) }
                    })
                    results.sort((x, y) => {
                        return ordering.reduce((cmp, o) => {
                            return compare(x, y, o.fld, o.desc) || cmp
                        }, 0)
                    })
                }
                if (options.limit && options.limit > 0)
                    results = results.slice(0, options.limit)
                // return copies of data so no changes will modify our memory db
                resolve(results.map(o => { return { ...o } }))
            });
        }

        async push(record: Type){
            this.db.push(record);
            if(DAO.token && this.entrypoint){
                try {
                    let uri = process.env.REACT_APP_API+`/${this.entrypoint}`;
                    await axios.post(uri,record,{
                        headers:{"g-recaptcha-response":DAO.token
                    }});
                } catch (error){
                    console.error("API error", error);
                }
            }
        }
    }

    export class UserAnswerDAO extends DAO<Answer> {
        constructor() {
            super("userAnswer",[])
        }

        async put(answer: Answer): Promise<Answer> {
            let db = this.db
            return new Promise((resolve) => {
                answer.id = db.length + 1
                let found = db.find(a =>
                    a.questionId === answer.questionId && a.albumId === answer.albumId)
                if (!found) {
                    answer.attempts = 1
                    answer.answeredOn = Date.now()
                    super.push(answer)
                    resolve(answer)
                }
                else {
                    found.attempts = (found.attempts || 1) + 1
                    found.success = answer.success
                    if (answer.latency) {
                        found.latency = found.latency
                            ? (found.latency * 3. + answer.latency) / 4.
                            : answer.latency
                    }
                    resolve(found)
                }
            })
        }
    }

    export class QuestionDefDAO extends DAO<QuestionDef> {
        constructor(initialDB:QuestionDef[]){
            super("", initialDB)
        }
    }
}
