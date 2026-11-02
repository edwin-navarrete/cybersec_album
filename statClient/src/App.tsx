import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import EnhancedTable from './components/table';
import Configuracion from './components/configuracion';
import Layout from './components/header';
import Login from './components/Login';
import QuestionPerformanceTable from './components/QuestionPerformanceTable';
import { AuthProvider, RequireAuth } from './auth/AuthContext';

const Protected = ({ children }: { children: React.ReactElement }) => (
  <RequireAuth>
    <Layout>{children}</Layout>
  </RequireAuth>
);

export default function App() {
  return (
    <>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Protected><EnhancedTable /></Protected>} />
            <Route path="/questions_perf" element={<Protected><QuestionPerformanceTable /></Protected>} />
            <Route path="/configuration" element={<Protected><Configuracion /></Protected>} />
            <Route path="*" element={<Protected><NotFound /></Protected>} />
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
}

function NotFound() {
  return <p>Ha llegado a una página que no existe.</p>;
}
