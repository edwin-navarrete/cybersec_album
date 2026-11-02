import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ClearIcon from '@mui/icons-material/Clear';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import { api, errorText } from '../auth/api';

/** Carga `path` con `params`; se vuelve a pedir cuando cambian, y expone loading/error/reload. */
export function useApiData<T>(path: string, params: Record<string, string | undefined>, refreshMs?: number) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const key = JSON.stringify(params);

  // `silent` (sondeo): no muestra el cargando ni borra lo que ya hay; si falla, conserva los datos y marca el error.
  const load = useCallback((silent = false) => {
    let cancelled = false;
    if (!silent) {
      setLoading(true);
      setError('');
    }
    const clean = Object.fromEntries(Object.entries(JSON.parse(key)).filter(([, v]) => v));
    api
      .get<{ data: T[] }>(path, { params: clean })
      .then((res) => {
        if (cancelled) return;
        setData(res.data.data);
        setError('');
        setUpdatedAt(Date.now());
      })
      .catch((e) => !cancelled && setError(errorText(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [path, key]);

  useEffect(() => load(), [load]);

  useEffect(() => {
    if (!refreshMs) return;
    const id = setInterval(() => load(true), refreshMs);
    return () => clearInterval(id);
  }, [load, refreshMs]);

  return { data, loading, error, updatedAt, reload: () => load() };
}

export function DateFilter({ label, value, onChange }: { label: string; value: Dayjs | null; onChange: (d: Dayjs | null) => void }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={label}
        value={value}
        onChange={(d) => onChange(d && d.isValid() ? d : null)}
        format="DD/MM/YYYY"
        slotProps={{ textField: { size: 'small', sx: { width: 170 } }, actionBar: { actions: ['clear', 'today'] } }}
      />
    </LocalizationProvider>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <TextField
      size="small"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton size="small" aria-label="Limpiar búsqueda" onClick={() => onChange('')}><ClearIcon fontSize="small" /></IconButton>
          </InputAdornment>
        ) : undefined,
      }}
    />
  );
}

/** Estados de una consulta: cargando / error con reintento / vacío. Devuelve null si hay datos. */
export function QueryState({ loading, error, empty, onRetry, emptyText = 'No hay datos para este filtro.' }:
  { loading: boolean; error: string; empty: boolean; onRetry: () => void; emptyText?: string }) {
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress aria-label="Cargando" /></Box>;
  if (error) return <Alert severity="error" action={<Button color="inherit" size="small" onClick={onRetry}>Reintentar</Button>} sx={{ m: 2 }}>{error}</Alert>;
  if (empty) return <Alert severity="info" sx={{ m: 2 }}>{emptyText}</Alert>;
  return null;
}

/** Descarga un CSV del servidor con el token de la sesión y los filtros activos. */
export function DownloadButton({ path, params, disabled }: { path: string; params: Record<string, string | undefined>; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const download = async () => {
    setBusy(true);
    setError('');
    try {
      const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
      const res = await api.get<Blob>(path, { params: clean, responseType: 'blob' });
      const name = /filename="([^"]+)"/.exec(String(res.headers['content-disposition'] ?? ''))?.[1] ?? 'estadisticas.csv';
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tooltip title={error || 'Descargar los datos filtrados en CSV (se abre en Excel)'}>
      <span>
        <Button variant="outlined" size="small" color={error ? 'error' : 'primary'} onClick={download} disabled={busy || disabled}
          startIcon={busy ? <CircularProgress size={16} /> : <DownloadIcon />}>
          {error ? 'Reintentar descarga' : 'CSV'}
        </Button>
      </span>
    </Tooltip>
  );
}

export const toApiDate = (d: Dayjs | null) => (d ? d.format('YYYY-MM-DD') : undefined);

export function Page({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>{actions}</Box>
      </Box>
      {children}
    </Box>
  );
}
