import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  AppBar, Box, Button, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import BarChartIcon from '@mui/icons-material/BarChart';
import QuizIcon from '@mui/icons-material/Quiz';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import '../css/styles.css';
import { useAuth } from '../auth/AuthContext';

const drawerWidth = 240;

const ITEMS = [
  { to: '/', label: 'Tabla de clasificación', icon: <BarChartIcon /> },
  { to: '/questions_perf', label: 'Desempeño de preguntas', icon: <QuizIcon /> },
  { to: '/configuration', label: 'Configuración', icon: <SettingsIcon /> },
];

/** Marco de la app autenticada: barra superior, menú lateral y contenido. */
export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const { session, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" className="navbar" sx={{ flexShrink: 0 }}>
        <Toolbar>
          <IconButton color="inherit" aria-label="Abrir menú" onClick={() => setOpen(true)} edge="start" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            4S Soluciones | Administrador
          </Typography>
          {session && (
            <>
              <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>{session.user}</Typography>
              <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout}>Salir</Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Drawer open={open} onClose={() => setOpen(false)} sx={{ '& .MuiDrawer-paper': { width: drawerWidth } }}>
        <Toolbar><Typography variant="subtitle1" fontWeight="bold">Estadísticas</Typography></Toolbar>
        <Divider />
        <List>
          {ITEMS.map((i) => (
            <ListItemButton key={i.to} component={NavLink} to={i.to} selected={pathname === i.to} onClick={() => setOpen(false)}>
              <ListItemIcon>{i.icon}</ListItemIcon>
              <ListItemText primary={i.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: { xs: 1.5, sm: 3 } }}>{children}</Box>
    </Box>
  );
}
