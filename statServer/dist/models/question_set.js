"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuestionSet = void 0;
// Same rules as server/src/models/questionSet.ts: the stats must cover the
// question set the game server is playing (QUESTION_SET, 'default' if unset).
const VALID_NAME = /^[A-Za-z0-9_.-]{1,50}$/;
const getQuestionSet = (raw = process.env.QUESTION_SET) => {
    const value = (raw !== null && raw !== void 0 ? raw : '').trim();
    return VALID_NAME.test(value) ? value : 'default';
};
exports.getQuestionSet = getQuestionSet;
//# sourceMappingURL=question_set.js.map