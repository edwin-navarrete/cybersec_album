import React from 'react';
import EnhancedTable from './components/table';
import Configuracion from './components/configuracion'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from './components/header';
import QuestionPerformanceTable from './components/QuestionPerformanceTable';

export default function App() {
  return (
    <>
    <Header />
    <Router>
      <Routes>
        <Route path="/" element={<EnhancedTable />} />
        <Route path="/questions_perf" element={<QuestionPerformanceTable />} />
        <Route path="/configuration" element={<Configuracion />}  />
        <Route path="*" element={NotFound()}  />
      </Routes>
    </Router>
    </>
  );
}

function NotFound() {
  return <>Ha llegado a una página que no existe</>;
}

