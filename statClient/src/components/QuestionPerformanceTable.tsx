import React, { useMemo, useState } from 'react';
import { LinearProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Box, Typography } from '@mui/material';
import { Dayjs } from 'dayjs';
import { DateFilter, DownloadButton, Page, QueryState, SearchBox, toApiDate, useApiData } from './common';

interface IQuestionData {
  questionId: number;
  question: string;
  attempts: number;
  avgLatency: string;
  successProb: string;
}

type SortKey = keyof IQuestionData;

const COLUMNS: { key: SortKey; label: string; align: 'left' | 'center' }[] = [
  { key: 'questionId', label: 'ID', align: 'center' },
  { key: 'question', label: 'Pregunta', align: 'left' },
  { key: 'attempts', label: 'Intentos', align: 'center' },
  { key: 'avgLatency', label: 'Tiempo promedio (s)', align: 'center' },
  { key: 'successProb', label: 'Éxito', align: 'left' },
];

export default function QuestionPerformanceTable() {
  const [since, setSince] = useState<Dayjs | null>(null);
  const [to, setTo] = useState<Dayjs | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>(
    // Por defecto, las preguntas que más se fallan primero: son las que hay que revisar.
    { key: 'successProb', dir: 'asc' }
  );

  const { data, loading, error, reload } = useApiData<IQuestionData>('/questions', { since: toApiDate(since), to: toApiDate(to) });
  const invalidRange = !!since && !!to && since.isAfter(to, 'day');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = data.filter((r) => !q || r.question.toLowerCase().includes(q) || String(r.questionId) === q);
    const sign = sort.dir === 'asc' ? 1 : -1;
    const val = (r: IQuestionData) => (sort.key === 'question' ? r.question : Number(r[sort.key]));
    // Desempate: más intentos primero (un 0 % sobre 40 intentos pesa más que sobre 1).
    return [...filtered].sort((a, b) =>
      val(a) < val(b) ? -sign : val(a) > val(b) ? sign : b.attempts - a.attempts
    );
  }, [data, search, sort]);

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'question' ? 'asc' : 'desc' }));

  return (
    <Page
      title="Desempeño de preguntas"
      actions={
        <>
          <SearchBox value={search} onChange={setSearch} placeholder="Buscar pregunta" />
          <DateFilter label="Desde" value={since} onChange={setSince} />
          <DateFilter label="Hasta" value={to} onChange={setTo} />
          <DownloadButton path="/export/questions.csv" params={{ since: toApiDate(since), to: toApiDate(to) }} disabled={loading || !!error} />
        </>
      }
    >
      {invalidRange && (
        <Typography color="error" variant="body2" sx={{ mb: 1 }}>La fecha "Desde" es posterior a "Hasta"; no habrá resultados.</Typography>
      )}
      <TableContainer component={Paper} sx={{ flex: 1, minHeight: 0 }}>
        <Table size="small" aria-label="Desempeño de preguntas" stickyHeader>
          <TableHead>
            <TableRow>
              {COLUMNS.map((c) => (
                <TableCell key={c.key} align={c.align} sortDirection={sort.key === c.key ? sort.dir : false}>
                  <TableSortLabel active={sort.key === c.key} direction={sort.key === c.key ? sort.dir : 'asc'} onClick={() => onSort(c.key)}>
                    {c.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && !error && rows.map((r) => {
              const pct = Math.round(parseFloat(r.successProb) * 100);
              return (
                <TableRow key={r.questionId} hover>
                  <TableCell align="center">{r.questionId}</TableCell>
                  <TableCell>{r.question}</TableCell>
                  <TableCell align="center">{r.attempts}</TableCell>
                  <TableCell align="center">{Math.round(parseFloat(r.avgLatency))}</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress variant="determinate" value={Number.isFinite(pct) ? pct : 0}
                        color={pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'error'} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                      <Typography variant="body2" sx={{ width: 42, textAlign: 'right' }}>{pct} %</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <QueryState loading={loading} error={error} empty={rows.length === 0} onRetry={reload} />
      </TableContainer>
    </Page>
  );
}
