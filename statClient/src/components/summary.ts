export interface SummarizableRow {
  is_group: number;
  answered: number | null;
  number_errors: number | null;
  finished: boolean;
}

export type Mode = 'general' | 'alone' | 'group';

export const inMode = (r: { is_group: number }, mode: Mode) => mode === 'general' || (mode === 'group') === (r.is_group === 1);

/** Resumen del evento. Quien aún no respondió trae null en respondidas/errores: cuenta como 0. */
export function summarize(rows: SummarizableRow[], mode: Mode = 'general') {
  const scope = rows.filter((r) => inMode(r, mode));
  const answered = scope.reduce((n, r) => n + (Number(r.answered) || 0), 0);
  const errors = scope.reduce((n, r) => n + (Number(r.number_errors) || 0), 0);
  const finished = scope.filter((r) => r.finished).length;
  return {
    total: scope.length,
    finished,
    finishedPct: scope.length > 0 ? Math.round((finished / scope.length) * 100) : 0,
    answered,
    success: answered > 0 ? Math.round((1 - errors / answered) * 100) : null,
  };
}
