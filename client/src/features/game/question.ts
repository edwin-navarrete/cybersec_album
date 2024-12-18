import axios from "axios"
import { Game, Sticker } from "./sticker"
import { count } from "console"
import { randomInt } from "crypto"

function shuffleCollection(collection:any[]){
    for (let i = collection.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [collection[i], collection[j]] = [collection[j], collection[i]];
      }
}



export namespace Question {

    enum QuestionType {
        single = "single",
        multiple = "multiple"
    }

    // FIXME this one doesn't belong to Question namespace
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

    // FIXME this one doesn't belong to Question namespace
    export interface QueryOptions {
        filter?: Record<string,string>
        include?: any[]
        exclude?: any[]
        order?: string | string[] // "[-|+]field"
        limit?: number
    }

    /*
    Shuffles the options and maintain the solution correct. 
    It won't move the "all of the above" option.
    */
    function shuffleQuestion(q: QuestionDef): QuestionDef {
        const lastOption = q.options[q.options.length - 1].toLowerCase()
        const hasAllOfTheAbove = lastOption.includes("all of the above") || lastOption.includes("todas las anteriores");
      
        const itemsToShuffle = hasAllOfTheAbove 
          ? q.options.slice(0, -1) 
          : q.options;
      
        const paired = itemsToShuffle.map((option, index) => ({ option, index }));
      
        // Desordenar usando Fisher-Yates
        for (let i = paired.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [paired[i], paired[j]] = [paired[j], paired[i]];
        }
      
        const shuffledOptions = paired.map(p => p.option);
        const newSolution = paired
          .filter(p => q.solution.includes(p.index))
          .map(p => paired.indexOf(p));
      
        if (hasAllOfTheAbove) {
          shuffledOptions.push(q.options[q.options.length - 1]);
          if (q.solution.includes(q.options.length - 1)) {
            newSolution.push(shuffledOptions.length - 1);
          }
        }
        return {
          ...q,
          options: shuffledOptions,
          solution: newSolution
        };
      }

    export class Quiz {
        album: Sticker.Album
        userAnswerDAO: UserAnswerDAO
        questionDefDAO: QuestionDefDAO
        answers: Answer[]
        config: Game.GameConfig

        constructor(config: Game.GameConfig, userAnswerDAO: UserAnswerDAO, questionDefDAO: QuestionDefDAO, albumId: Sticker.Album) {
            this.album = albumId
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
            let curLanguage = localStorage.getItem("lang");
            return this.userAnswerDAO.findAll({ filter:{ albumId: await this.album.getAlbumId() }, order: ["+success", "+answeredOn"] })
                .then(answers => answers.map(answer => answer.questionId))
                .then(seen => {
                    return self.questionDefDAO.findAll({
                        filter:{ lang: curLanguage || 'es' },
                        exclude: seen,
                        order: (this.config.quizStrategy === "randomUnseen" ? "__random" : "+difficulty"),
                        limit: count
                    }).then(unseen => {
                        let missingCnt = count - unseen.length
                        if (missingCnt > 0) {
                            // complete with seen, randomly
                            shuffleCollection(seen)
                            let missing = seen.slice(0, missingCnt)
                            return self.questionDefDAO.findAll({
                                include: missing
                            }).then(missingDefs =>{
                                const result= unseen.concat(missingDefs);
                                return result.map( (q)=> shuffleQuestion(q) );
                            })
                        }
                        // Shuffle options and solutions
                        return unseen.map( (q)=> shuffleQuestion(q) )
                    })
                })
        }

        async putAnswer(question: QuestionDef, response: number[], latency?: number): Promise<Answer> {
            if (!question.id) throw new Error("question id is required")
            let answer: Answer = {
                albumId: await this.album.getAlbumId(),
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
        loaded: boolean = false 
        static token: string = ""
        entrypoint: string

        constructor(entrypoint:string, initialDB: Type[]) {
            this.db = initialDB
            // verify no duplicated ids
            if (new Set(this.db.map(i => i.id)).size !== this.db.length)
                throw (new Error('Duplicated key value'));
            this.entrypoint = entrypoint
        }

        async inMemFindAll(options: QueryOptions = {}): Promise<Type[]> {
            const { exclude = [], include = [], order, limit } = options;
            let results = this.db.filter(q =>
                (!include.length || include.includes(q.id)) && !exclude.includes(q.id)
            );
            if (order) {
                if (order === '__random'){
                    shuffleCollection(results)
                }
                else {
                    const orders = (Array.isArray(order) ? order : [order]).map(o => ({
                        desc: o.startsWith('-'),
                        fld: o.replace(/^[-+]/, '')
                    }));
        
                    results.sort((x, y) =>
                        orders.reduce((cmp, { fld, desc }) => cmp || compare(x, y, fld, desc), 0)
                    );
                }
            }
            if (limit && limit > 0) {
                results = results.slice(0, limit);
            }
            // return copies of data so no changes will modify our memory db
            return results.map(o => { return { ...o } })
        }

        async findAll(options: QueryOptions = {}): Promise<Type[]> {
            // NOTE reads from remote only once, then it works offline
            let self = this
            if(this.entrypoint && !self.loaded){
                let uri = process.env.REACT_APP_API+`/${this.entrypoint}`;
                return axios.get(uri,{
                    params: options.filter,
                    headers:{"g-recaptcha-response":DAO.token
                }})
                .then(response => {
                    self.loaded = true;
                    self.db = response.data.results.map((item: Record<string, any>)=>{ return {...item, id: item[self.entrypoint+'Id']}});
                    return this.inMemFindAll(options);
                })
                .catch(error => {
                    console.error('findAll failed', error)
                    return this.inMemFindAll();
                });
            }
            return this.inMemFindAll(options);
        }

        async push(record: Type){
            if(this.entrypoint){
                try {
                    let uri = process.env.REACT_APP_API+`/${this.entrypoint}`;
                    await axios.post(uri,record,{
                        headers:{"g-recaptcha-response":DAO.token
                    }});
                } catch (error){
                    console.error("API error", error);
                }
            }
            const index = this.db.findIndex(item => item.id === record.id);
            if (index !== -1) {
                Object.assign(this.db[index],record);
            }
            else {
                this.db.push(record);
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
                            ? (found.latency * 3. + answer.latency) / 4. // Moving average for latency
                            : answer.latency
                    }
                    super.push(found)
                    resolve(found)
                }
            })
        }
    }

    export class QuestionDefDAO extends DAO<QuestionDef> {
        constructor(initialDB:QuestionDef[]){
            super("question", initialDB)
        }

        async findAll(options: QueryOptions = {}): Promise<QuestionDef[]> {
            if(options.filter) {
                this.loaded = false
            }
            return super.findAll(options)
        }
    }
}
