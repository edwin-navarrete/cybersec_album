// Same rules as server/src/models/questionSet.ts: the stats must cover the
// question set the game server is playing (QUESTION_SET, 'default' if unset).
const VALID_NAME = /^[A-Za-z0-9_.-]{1,50}$/;

export const getQuestionSet = (raw: string | undefined = process.env.QUESTION_SET): string => {
  const value = (raw ?? '').trim();
  return VALID_NAME.test(value) ? value : 'default';
};
