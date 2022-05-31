export module Question {

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
        difficulty: number
    }


    export interface Answer extends Identifiable {
        userId: string
        questionId: number
        success: boolean
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
        userId: string
        userAnswerDAO: UserAnswerDAO
        questionDefDAO: QuestionDefDAO
        answers: Answer[]

        constructor(userAnswerDAO: UserAnswerDAO, questionDefDAO: QuestionDefDAO, userId: string) {
            this.userId = userId
            this.userAnswerDAO = userAnswerDAO
            this.questionDefDAO = questionDefDAO
            this.answers = []
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
                        order: "+difficulty",
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
            let answer: Answer = {
                userId: this.userId,
                questionId: question.id,
                success: response.length == question.solution.length
                    && response.reduce((a, b) => a && question.solution.includes(b), true),
                latency: latency,
                difficulty: question.difficulty
            }

            answer = await this.userAnswerDAO.put(answer)
            this.answers.push(answer)
            return answer
        }

        getAnswers(): Answer[] {
            return this.answers
        }
    }

    function compare(x: any, y: any, field: string, desc: boolean) {
        let a = x[field], b = y[field]
        if (a > b) return desc ? -1 : 1
        if (a < b) return desc ? 1 : -1
        return 0;
    }

    export class DAO<Type extends Identifiable>{
        readonly db: Type[]

        constructor(initialDB: Type[]) {
            this.db = initialDB
            // verify no duplicated ids
            if (new Set(this.db.map(i => i.id)).size != this.db.length)
                throw (new Error('Duplicated key value'));
        }

        findAll(options?: QueryOptions): Promise<Type[]> {
            let db = this.db
            return new Promise(function(resolve) {
                let exclude = (options && options.exclude) || [];
                let include = (options && options.include) || [];
                let results = db.filter(q =>
                    (!include.length || include.includes(q.id)) && !exclude.includes(q.id));
                if (options && options.order) {
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
                if (options && options.limit > 0)
                    results = results.slice(0, options.limit)
                // return copies of data so no changes will modify our memory db
                resolve(results.map(o => { return { ...o } }))
            });
        }
    }

    export class UserAnswerDAO extends DAO<Answer> {
        constructor() {
            super([])
        }

        async put(answer: Answer): Promise<Answer> {
            let db = this.db
            return new Promise((resolve) => {
                answer.id = db.length + 1
                let found = db.find(a =>
                    a.questionId == answer.questionId && a.userId == answer.userId)
                if (!found) {
                    answer.attempts = 1
                    answer.answeredOn = Date.now()
                    db.push(answer)
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
        constructor(json: QuestionDef[]) {
            super(json)
        }
    }
}
