import { summarize } from './summary';

const row = (is_group: number, answered: number | null, number_errors: number | null, finished: boolean) =>
  ({ is_group, answered, number_errors, finished });

describe('summarize', () => {
  const rows = [row(0, 10, 2, true), row(0, null, null, false), row(1, 20, 10, false)];

  it('counts everything in general mode and treats null as 0', () => {
    expect(summarize(rows)).toEqual({ total: 3, finished: 1, finishedPct: 33, answered: 30, success: 60 });
  });

  it('filters by mode', () => {
    expect(summarize(rows, 'group')).toMatchObject({ total: 1, answered: 20, success: 50 });
    expect(summarize(rows, 'alone')).toMatchObject({ total: 2, finished: 1, finishedPct: 50, success: 80 });
  });

  it('has no success rate and no division by zero without answers', () => {
    expect(summarize([])).toEqual({ total: 0, finished: 0, finishedPct: 0, answered: 0, success: null });
    expect(summarize([row(0, null, null, false)]).success).toBeNull();
  });
});
