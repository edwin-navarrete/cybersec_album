import React from 'react';
import EnhancedTable from './components/table'
import Configuracion from './components/configuracion'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from './components/header';

export default function App() {
  return (
    <>
    <Header />
    <Router>
      <Routes>
        <Route path="/" element={<EnhancedTable />} />
        <Route path="/configuracion" element={<Configuracion />}  />
        <Route path="*" element={NotFound()}  />
      </Routes>
    </Router>
    </>
  );
}

function NotFound() {
  return <>Ha llegado a una página que no existe</>;
}

