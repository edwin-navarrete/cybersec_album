import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Chip, Typography } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import CloseIcon from '@mui/icons-material/Close';
import { QRCodeSVG } from 'qrcode.react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faUsers } from '@fortawesome/free-solid-svg-icons';
import { useApiData } from './common';
import { summarize } from './summary';
import { resolveJoinUrl } from './joinUrl';

interface RankRow {
  is_group: number;
  player_name: string | null;
  number_errors: number;
  total_latency: number;
  finished: boolean;
  answered: number;
  errors: number;
  rank: number;
  album_id: string;
}

const REFRESH_MS = 5000;
const TOP = 10;

// Paleta pensada para proyector: fondo oscuro, texto claro (contraste > 7:1).
const C = { bg: '#0b1f2e', panel: '#12293b', text: '#ffffff', muted: '#b8c7d3', accent: '#41e0d0', ok: '#7ddf9b', warn: '#ffcf70' };
const MEDAL = ['#f5c542', '#cfd8dc', '#d08a4e'];

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const clock = (t: number) => new Date(t).toLocaleTimeString();

/** Evita que la pantalla se apague mientras se proyecta (si el navegador lo permite). */
function useWakeLock() {
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    const acquire = () => nav.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => undefined);
    acquire();
    const onVisible = () => document.visibilityState === 'visible' && acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => undefined);
    };
  }, []);
}

function useFullscreen() {
  const [full, setFull] = useState(!!document.fullscreenElement);
  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const toggle = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => undefined);
  return { full, toggle };
}

function Name({ row }: { row: RankRow }) {
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <FontAwesomeIcon icon={row.is_group === 1 ? faUsers : faUser} style={{ color: C.muted, flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.player_name ?? 'Sin nombre'}</span>
    </Box>
  );
}

function Detail({ row }: { row: RankRow }) {
  return (
    <>
      {row.finished && <Chip size="small" label="Álbum completo" sx={{ bgcolor: C.ok, color: C.bg, fontWeight: 'bold' }} />}
      <span>{row.answered} resp.</span>
      <span>{Math.round(row.errors * 100)} % error</span>
      <span>{mmss(row.total_latency)}</span>
    </>
  );
}

function PodiumCard({ row, place }: { row: RankRow; place: 0 | 1 | 2 }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0, bgcolor: C.panel, borderTop: `8px solid ${MEDAL[place]}`, borderRadius: 2, p: 2, textAlign: 'center',
      order: place === 0 ? 2 : place === 1 ? 1 : 3, mt: place === 0 ? 0 : { md: 4 } }}>
      <Typography sx={{ fontSize: 'clamp(2rem, 4vw, 4rem)', fontWeight: 'bold', color: MEDAL[place], lineHeight: 1 }}>{place + 1}º</Typography>
      <Typography sx={{ fontSize: 'clamp(1.2rem, 2.4vw, 2.4rem)', fontWeight: 'bold', my: 1 }}><Name row={row} /></Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5, alignItems: 'center', color: C.muted, fontSize: 'clamp(0.9rem, 1.3vw, 1.3rem)' }}>
        <Detail row={row} />
      </Box>
    </Box>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Box sx={{ bgcolor: C.panel, borderRadius: 2, p: 2 }}>
      <Typography sx={{ color: C.muted, fontSize: 'clamp(0.85rem, 1.1vw, 1.1rem)' }}>{label}</Typography>
      <Typography sx={{ fontSize: 'clamp(1.8rem, 3.2vw, 3.2rem)', fontWeight: 'bold', lineHeight: 1.1 }}>{value}</Typography>
      {detail && <Typography sx={{ color: C.muted, fontSize: 'clamp(0.8rem, 1vw, 1rem)' }}>{detail}</Typography>}
    </Box>
  );
}

export default function Presenter() {
  const { data, loading, error, updatedAt } = useApiData<RankRow>('/ranking', {}, REFRESH_MS);
  const { full, toggle } = useFullscreen();
  useWakeLock();
  const url = useMemo(() => resolveJoinUrl(window.location.search, window.location.origin), []);

  const summary = useMemo(() => summarize(data), [data]);
  const top = data.slice(0, TOP);
  const offline = !!error && updatedAt !== null; // falló el sondeo pero hay datos viejos que mostrar

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: C.bg, color: C.text, p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box component="header" sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ bgcolor: 'white', borderRadius: 1, px: 1.5, py: 0.5, display: 'flex' }}>
          <img src={`${process.env.PUBLIC_URL}/logo.webp`} alt="4S Soluciones" height={44} />
        </Box>
        <Typography component="h1" sx={{ fontSize: 'clamp(1.6rem, 3vw, 3rem)', fontWeight: 'bold', flexGrow: 1 }}>Ranking en vivo</Typography>
        <Chip role="status" label={offline ? `Sin conexión · datos de ${clock(updatedAt!)}` : updatedAt ? `En vivo · ${clock(updatedAt)}` : 'Conectando…'}
          sx={{ bgcolor: offline ? C.warn : C.panel, color: offline ? C.bg : C.accent, fontWeight: 'bold' }} />
        <Button onClick={toggle} sx={{ color: C.text }} startIcon={full ? <FullscreenExitIcon /> : <FullscreenIcon />}>{full ? 'Salir de pantalla completa' : 'Pantalla completa'}</Button>
        <Button component={RouterLink} to="/" sx={{ color: C.muted }} startIcon={<CloseIcon />}>Cerrar</Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' }, flex: 1 }}>
        <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
          {loading && data.length === 0 ? (
            <Typography sx={{ color: C.muted, fontSize: '1.5rem' }}>Cargando…</Typography>
          ) : error && !updatedAt ? (
            <Typography role="alert" sx={{ color: C.warn, fontSize: '1.5rem' }}>No se pudo cargar el ranking: {error}</Typography>
          ) : top.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 8 }}>
              <Typography sx={{ fontSize: 'clamp(1.6rem, 3.4vw, 3.4rem)', fontWeight: 'bold' }}>Esperando a los primeros jugadores…</Typography>
              <Typography sx={{ color: C.muted, fontSize: 'clamp(1.1rem, 1.8vw, 1.8rem)', mt: 1 }}>Escanea el código QR para unirte</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start', mb: 3 }}>
                {top.slice(0, 3).map((r, i) => <PodiumCard key={r.album_id} row={r} place={i as 0 | 1 | 2} />)}
              </Box>
              <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {top.slice(3).map((r, i) => (
                  <Box component="li" key={r.album_id} sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: C.panel, borderRadius: 2, px: 2, py: 1,
                    fontSize: 'clamp(1.1rem, 1.9vw, 1.9rem)' }}>
                    <Typography component="span" sx={{ width: '2.5ch', fontWeight: 'bold', color: C.accent, fontSize: 'inherit' }}>{i + 4}</Typography>
                    <Box sx={{ flex: 1, minWidth: 0, fontWeight: 'bold' }}><Name row={r} /></Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', color: C.muted, fontSize: '0.7em', flexShrink: 0 }}><Detail row={r} /></Box>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>

        <Box component="aside" sx={{ width: { lg: 340 }, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ bgcolor: 'white', color: C.bg, borderRadius: 2, p: 2, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: '1.2rem', mb: 1 }}>¡Juega con nosotros!</Typography>
            <QRCodeSVG value={url} size={220} level="M" marginSize={1} style={{ width: '100%', maxWidth: 260, height: 'auto' }} title="Código QR para unirse al juego" />
            <Typography sx={{ fontWeight: 'bold', mt: 1, wordBreak: 'break-all', fontSize: '1.05rem' }}>{url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</Typography>
          </Box>
          <StatCard label="Participantes" value={String(summary.total)} />
          <StatCard label="Álbumes completados" value={String(summary.finished)} detail={summary.total ? `${summary.finishedPct} % de los participantes` : undefined} />
          <StatCard label="Preguntas respondidas" value={String(summary.answered)} />
          <StatCard label="Tasa de éxito" value={summary.success === null ? '—' : `${summary.success} %`} />
        </Box>
      </Box>
    </Box>
  );
}
