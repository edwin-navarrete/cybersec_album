# Ciberalbum — Project Structure Memory

Mobile-first (responsive) trivia + sticker-album game about cybersecurity. Players answer single/multiple-choice questions; each correct answer earns comic-strip stickers that fill a 3x7 album. Spanish (`es`) and English (`en`). Game design details (modes, views, config) are in `README.md` (written in Spanish).

## Monorepo layout

Four independent npm packages plus a DB schema folder. The root `package.json` only wires Heroku deploy (`engines`: node 22.x, npm 10.x).

| Dir | Role | Stack |
|---|---|---|
| `client/` | Game UI (the app players use) | React 18, Redux Toolkit, react-router 6, MUI 5, i18next, axios, CRA (`react-scripts`) |
| `server/` | Game API; also serves the built `client/build` | Express 4, TypeScript, mysql2, express-validator, jest/ts-jest |
| `statClient/` | Stats dashboard UI (ranking + question performance) | React 18, MUI + x-date-pickers, dayjs, axios, CRA |
| `statServer/` | Stats API (read-only SQL aggregations) | Express, TypeScript, mysql2, body-parser |
| `db_schema/` | `ssolucio_cyberalbum.sql` (full schema incl. `player` table and `vw_user_answer` view), `sample_data.sql` | MySQL/MariaDB |

Root files: `Procfile` (`web: npm start --prefix server`), `.cpanel.yml` (empty), `.gitignore`, `docker-compose.yml` (local dev DB only, see Commands).

Data flow: `client` → `server` (`/api/*`) → MySQL ← `statServer` (`/album_stats`-style paths) ← `statClient`.

## Commands

- Local DB: `docker compose up -d` starts MariaDB 10.11 (`docker-compose.yml`) on `127.0.0.1:3306`. Defaults: `DB_PWD=devpass`, `DB_NAME=cyberalbum`, overridable via shell or root `.env`. The schema (`db_schema/ssolucio_cyberalbum.sql`) loads only on first start, when the `db-data` volume is empty. `docker compose down -v` wipes the data. Set `DB_HOST=127.0.0.1` in `server/.env`. Only the DB runs in Docker; run server and client on the host.
- Local `server/.env` must set `SERVER_PATH=` (empty). If it is unset, routes mount at `undefined/api`. `client/.env` needs `REACT_APP_API=http://localhost:8000/api`, since CRA does not read `local.env`.
- Root: `npm start` runs the server. `heroku-postbuild` installs and builds client + server.
- `server/`: `npm run dev` (nodemon + client via concurrently), `npm run build` (tsc → `dist/`), `npm start` (`node dist/app.js`), `npm test` (jest), `npm run lint`.
- `client/`: `npm start` (CRA dev, :3000), `npm run build`. The `test` script is `c test`, which looks like a typo for `react-scripts test`.
- `statServer/`: `npm start` (`tsc && node dist/app.js`). `dist/` is committed.
- `statClient/`: CRA scripts. `build/` is committed (cPanel deploy).

## Environment variables (names only; never commit values)

- `server/.env`: `DB_HOST`, `DB_USER`, `DB_PWD`, `DB_NAME`, `PORT` (default 5006), `SERVER_PATH` (route prefix), `CAPTCHA_SECRET` (empty disables the reCAPTCHA check), `CAPTCHA_API` (verify URL). Heroku uses `JAWSDB_MARIA_URL`, which overrides the `DB_*` vars.
- `client/` (`local.env`, `production.env`, and a `.env`): `REACT_APP_API` (API base URL), `CAPTCHAKEY` (public reCAPTCHA v3 key).
- `statServer/`: `DB_*`, `PORT`, `SERVER_PATH`, `UI_URL` (CORS origin).
- `statClient/`: `REACT_APP_API_URL` (defaults to the production stats URL).

Note: `client/production.env` is committed and contains a `CAPTCHA_KEY` entry. `.gitignore` lists it, so it was probably tracked before being ignored.

## `server/src`

- `app.ts`: loads dotenv, starts `Server`, handles SIGTERM.
- `models/server.ts`: `Server` class. Middlewares: cors, json, express-useragent, `recaptcha`. Mounts all routers under `${SERVER_PATH}/api`. Serves `../../../client/build` statically, with a `*` fallback to `index.html`.
- `models/recaptcha.ts`: validates the `g-recaptcha-response` header on GET/POST against Google. Results are memoized (`memoizee`). Responds 403 on failure. Skipped when `CAPTCHA_SECRET` is unset.
- `controllers/DBDriver.ts`: `Fetch` and `Insert` types.
- `controllers/mysqlDriver.ts`: singleton mysql2 pool (limit 10, 1s connection timeout) exposing `fetch` and `insert`.
- `controllers/entityDao.ts`: generic `EntityDAO<T>` with `get` (filter/order/limit/include/exclude), `post` (insert with optional upsert), `update`, `replace`. It converts camelCase ↔ snake_case, and the table name equals the entity name. `entityDao.spec.ts` covers it.
  - `get()` builds its WHERE values by string interpolation, not bound parameters. That is an SQL-injection risk if any filter value is not validated upstream.
- `interfaces/questions.ts`: `QuestionsLang` (appears unused).
- `routes/` (each file defines its own row interface and DAO subclass, and validates input with `validateInput`):
  - `album.ts`: `POST/GET /album`. Upserts an album, records user-agent info, sets `player_id` once.
  - `player.ts`: `GET/POST /player`. Creates or updates a player. In `coop` mode it assigns the player to a group (max 20, keeps ≥2 open groups, auto-generates unique tribe names like "Los Elfos Voladores"). Handles leader switching via the `is_leader` ordinal.
  - `questionRouter.ts`: `GET /question?lang=`. Parses the JSON `options` and `solution` columns.
  - `userAnswer.ts`: `GET/POST /userAnswer`.
  - `userSticker.ts`: `GET/POST /userSticker`.
  - `validateInput.ts`: returns 400 with the express-validator errors.
- `webpack.config.js` is a leftover (entry `src/index.ts` doesn't exist). The build is plain `tsc`.

## `client/src`

- `index.tsx`: Redux `Provider`, optional `GoogleReCaptchaProvider` (when `CAPTCHAKEY` is set), `./i18n`.
- `App.tsx` routes: `/` AlbumIntroView (register/continue), `/album` AlbumView, `/quest` QuestionView, `/players` PlayerView (team and leader).
- `app/store.ts`: a single `game` reducer. `app/hooks.ts`: typed hooks.
- `components/`: AlbumIntroView, AlbumView, QuestionView, PlayerView, StickerView, Gauge (progress), Header, ToggleLang (es/en).
- `i18n.ts`: UI strings for es/en.
- `features/game/`:
  - `gameSlice.ts`: state (`token`, `stickers`, `stickerCount`, `team`, `question`) and selectors (`selectGauge`, `selectUnclaimed`, `selectAchievement`, `selectStickerSpots`, ...).
  - `gameMiddleware.ts`: all async thunks (`fetchAlbum`, `changeLanguage`, `putAnswer`, `registerPlayer`, `glueSticker`, `nextQuestion`, `loadTeam`, `changeLeader`). Also wires the singletons `theAlbum`, `theQuiz`, and the DAOs. Holds `getLeaderDeadline` and the play-token factory selection.
  - `question.ts`: `Question` namespace with `QuestionDef`, `Answer`, `Quiz` (question generation and answer storage), and generic `DAO<T>`. The DAO is in-memory with HTTP sync to the API and the captcha token. Also `UserAnswerDAO`, `QuestionDefDAO`, and `shuffleQuestion` (it keeps "all of the above" last).
  - `sticker.ts`: `Game` namespace (config enums, `PlayToken` classes: Unlimited/Disabled/BusinessDay, and their factories, `PlayerDAO`) and `Sticker` namespace (`Reward`, `Album`, `UserStickerDAO`, `StickerDAO`).
  - `gameConfig.json`: `rewardStrategy`, `rewardSchema`, `quizStrategy`, `soloTokenStrategy`, `coopTokenStrategy`, `leaderTimeout` (documented in `README.md`).
  - `data/{es,en}/questionDB.json` and `stickerDB.json`: bundled content, 22 questions and 21 stickers per language. Questions have `id, type, question, options, solution, difficulty, feedback`. Stickers have `id, spot, weight, image`.
  - Specs: `gameMiddleware.spec.ts`, `gameSlice.spec.ts`, `question.spec.ts`, `sticker.spec.ts`, `test/sample*.json`.
- Client state also lives in `localStorage`: `albumId`, `playerId`, `playerName`, `groupId`, `isLeader`, `lang`, `startedOn`, `endedOn`, `playToken`, `modifiedOn`. Gameplay logic reads it directly, so it is part of the architecture.

## Database tables (`db_schema/ssolucio_cyberalbum.sql`)

- `album(album_id UUID PK, player_id, started_on, ended_on, language, os/platform/browser/version/is_mobile)`
- `user_answer(user_answer_id, album_id FK, question_id, success, latency, attempts, answered_on)`
- `user_sticker(user_sticker_id, album_id FK, sticker_id, in_album, added_on)`
- `question(question_id, lang, type, question, options JSON, solution JSON, difficulty, feedback)`
- `player(player_id, player_name UNIQUE, is_group, size, group_id, is_leader ordinal, modified_on)`
- View `vw_user_answer`, used by `statServer`.
- Timestamps are epoch milliseconds (`BIGINT`).

## `statServer/src`

`app.ts` mounts `${SERVER_PATH}/album`, `/user`, `/ranking`, `/questions`. `db.ts` uses a single mysql2 connection (not a pool). `models/` holds the SQL: `ranking_model` (ranking by date, with a hard-coded UTC-5 offset `-18000000`), `questions_model` (per-question attempts, success rate, average latency, filtered by `since`/`to`), `album`, `questions_answered`, `user_answer_model`. `types/` holds the interfaces. `routes/commonRoutes.ts` has `sanitizeDate` (accepts DD/MM/YYYY or YYYY-MM-DD). `ranking_model` interpolates `date` into SQL, but it is sanitized first.

## `statClient/src`

`App.tsx` routes: `/` ranking table (`components/table.tsx`), `/questions_perf` (`QuestionPerformanceTable.tsx`), `/configuration`. UI text is Spanish.

## Deployment

- Heroku: root `Procfile` plus `heroku-postbuild`. Uses a JawsDB MariaDB add-on. The README has the exact commands.
- cPanel: `client/` and `statClient/` are built for `4ssoluciones.com` (`/album_api`, `/album_stats`), and `statClient/build` is committed.

## Known quirks and gotchas

- `README.md` documents `thompson` as a `quizStrategy`, but the `QuizStrategy` enum and `Quiz.generate` only support `randomUnseen` and `easiestUnseen`. The README also has unfinished "Casos de uso" sections.
- `README.md` says the album grid is 3x7, which matches 21 stickers. `selectStickerSpots` uses 3 columns (A/B/C).
- Typos are part of the API surface: `bussinessDays`, `randomWeigthed`, `AlbumStiker`, `dificult`. Do not "fix" them without a repo-wide rename.
- `mysqlDriver.fetch` calls `connection.release()` in both the try and finally blocks (a double release).
- `entityDao.ts` ends with a stub `snakeToCamel` that throws "Function not implemented" (dead code).
- `server/package.json` lists `react-scripts`, `jest`, and `@types/*` under dependencies, and has a self-reference `cybersec_album: file:`. The same self-reference pattern is in `client` and `statClient`/`statServer`.
- The server serves the client from `../../../client/build`, relative to `server/dist/models`.
- Recent history: name validation (#136) and a reverted "restore album state" change (#111).
