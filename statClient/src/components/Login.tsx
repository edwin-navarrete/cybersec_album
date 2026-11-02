import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { errorText } from '../auth/api';

export default function Login() {
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to={from} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(user.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 2 }}>
      <Paper component="form" onSubmit={submit} elevation={3} sx={{ p: 4, width: '100%', maxWidth: 380 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <img src={`${process.env.PUBLIC_URL}/logo.webp`} alt="4S Soluciones" height={64} style={{ marginBottom: 16 }} />
          <Typography variant="h5" fontWeight="bold">Panel de estadísticas</Typography>
          <Typography variant="body2" color="text.secondary">Administrador</Typography>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField label="Usuario" value={user} onChange={(e) => setUser(e.target.value)}
          autoComplete="username" autoFocus required fullWidth margin="normal" />
        <TextField label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password" required fullWidth margin="normal" />
        <Button type="submit" variant="contained" fullWidth size="large" disabled={busy || !user || !password} sx={{ mt: 2 }}>
          {busy ? <CircularProgress size={24} /> : 'Ingresar'}
        </Button>
      </Paper>
    </Box>
  );
}
