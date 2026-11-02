import React, { useMemo, useState } from 'react';
import {
  Box, Chip, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel,
  ToggleButton, ToggleButtonGroup, Tooltip,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Dayjs } from 'dayjs';
import { DateFilter, Page, QueryState, SearchBox, toApiDate, useApiData } from './common';

interface IData {
  is_group: number;
  player_name: string;
  started_on: number;
  number_errors: number;
  total_latency: number;
  finished: boolean;
  answered: number;
  errors: number;
  rank: number;
  album_id: string;
}

type SortKey = 'rank' | 'player_name' | 'number_errors' | 'answered' | 'finished' | 'total_latency' | 'errors' | 'started_on';
type Mode = 'general' | 'alone' | 'group';

const COLUMNS: { key: SortKey; label: string; align: 'left' | 'center'; hint?: string }[] = [
  { key: 'rank', label: 'Posición', align: 'left' },
  { key: 'player_name', label: 'Jugador', align: 'left' },
  { key: 'number_errors', label: 'Errores', align: 'center' },
  { key: 'answered', label: 'Respondidas', align: 'center', hint: 'Preguntas respondidas' },
  { key: 'finished', label: 'Álbum', align: 'center', hint: 'Álbum finalizado' },
  { key: 'total_latency', label: 'Tiempo (s)', align: 'center', hint: 'Tiempo total de respuesta, en segundos' },
  { key: 'errors', label: '% error', align: 'center', hint: 'Porcentaje de error' },
  { key: 'started_on', label: 'Inicio', align: 'left', hint: 'Fecha y hora de inicio' },
];

function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Paper variant="outlined" sx={{ flex: '1 1 150px', p: 1.5 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" fontWeight="bold" lineHeight={1.2}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{detail ?? '\u00A0'}</Typography>
    </Paper>
  );
}

export default function RankingTable() {
  const [date, setDate] = useState<Dayjs | null>(null);
  const [mode, setMode] = useState<Mode>('general');
  const [search, setSearch] = useState('');
  // Por defecto, el orden del servidor (la posición del ranking).
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'rank', dir: 'asc' });

  const { data, loading, error, reload } = useApiData<IData>('/ranking', { date: toApiDate(date) });

  // Resumen del modo y la fecha elegidos (sin la búsqueda: es un resumen del evento, no de la lista).
  const summary = useMemo(() => {
    const scope = data.filter((r) => mode === 'general' || (mode === 'group') === (r.is_group === 1));
    // Quien no ha respondido nada trae null en respondidas/errores.
    const answered = scope.reduce((n, r) => n + (Number(r.answered) || 0), 0);
    const errors = scope.reduce((n, r) => n + (Number(r.number_errors) || 0), 0);
    const finished = scope.filter((r) => r.finished).length;
    return {
      total: scope.length,
      finished,
      answered,
      success: answered > 0 ? Math.round((1 - errors / answered) * 100) : null,
    };
  }, [data, mode]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = data.filter(
      (r) => (mode === 'general' || (mode === 'group') === (r.is_group === 1)) && (!q || r.player_name.toLowerCase().includes(q))
    );
    const sign = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = sort.key === 'finished' ? Number(a.finished) : a[sort.key];
      const bv = sort.key === 'finished' ? Number(b.finished) : b[sort.key];
      return av < bv ? -sign : av > bv ? sign : 0;
    });
  }, [data, mode, search, sort]);

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  return (
    <Page
      title="Tabla de clasificación"
      actions={
        <>
          <SearchBox value={search} onChange={setSearch} placeholder="Buscar jugador" />
          <DateFilter label="Fecha" value={date} onChange={setDate} />
          <ToggleButtonGroup value={mode} exclusive size="small" aria-label="Modo de juego"
            onChange={(_, m: Mode | null) => m && setMode(m)}>
            <ToggleButton value="general">General</ToggleButton>
            <ToggleButton value="alone"><FontAwesomeIcon icon={faUser} style={{ marginRight: 6 }} />Individual</ToggleButton>
            <ToggleButton value="group"><FontAwesomeIcon icon={faUsers} style={{ marginRight: 6 }} />Equipo</ToggleButton>
          </ToggleButtonGroup>
        </>
      }
    >
      {!loading && !error && summary.total > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2, flexShrink: 0 }}>
          <StatCard label="Participantes" value={String(summary.total)} />
          <StatCard label="Álbumes completados" value={String(summary.finished)}
            detail={`${Math.round((summary.finished / summary.total) * 100)} % de los participantes`} />
          <StatCard label="Preguntas respondidas" value={String(summary.answered)} />
          <StatCard label="Tasa de éxito" value={summary.success === null ? '—' : `${summary.success} %`}
            detail="aciertos sobre preguntas respondidas" />
        </Box>
      )}
      <TableContainer component={Paper} sx={{ flex: 1, minHeight: 0 }}>
        <Table size="small" aria-label="Tabla de clasificación" stickyHeader>
          <TableHead>
            <TableRow>
              {COLUMNS.map((c) => (
                <TableCell key={c.key} align={c.align} sortDirection={sort.key === c.key ? sort.dir : false}>
                  <Tooltip title={c.hint ?? ''} disableHoverListener={!c.hint}>
                    <TableSortLabel active={sort.key === c.key} direction={sort.key === c.key ? sort.dir : 'asc'} onClick={() => onSort(c.key)}>
                      {c.label}
                    </TableSortLabel>
                  </Tooltip>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && !error && rows.map((r) => (
              <TableRow key={r.album_id} hover>
                <TableCell>{r.rank}</TableCell>
                <TableCell>
                  <FontAwesomeIcon icon={r.is_group === 1 ? faUsers : faUser} style={{ marginRight: 8, color: '#555' }} />
                  {r.player_name}
                </TableCell>
                <TableCell align="center">{r.number_errors}</TableCell>
                <TableCell align="center">{r.answered}</TableCell>
                <TableCell align="center">
                  <Chip size="small" label={r.finished ? 'Sí' : 'No'} color={r.finished ? 'success' : 'default'} variant={r.finished ? 'filled' : 'outlined'} />
                </TableCell>
                <TableCell align="center">{Math.round(r.total_latency)}</TableCell>
                <TableCell align="center">{Math.round(r.errors * 100)} %</TableCell>
                <TableCell>{new Date(r.started_on).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <QueryState loading={loading} error={error} empty={rows.length === 0} onRetry={reload}
          emptyText={search ? 'Ningún jugador coincide con la búsqueda.' : 'No hay resultados para este filtro.'} />
      </TableContainer>
    </Page>
  );
}
