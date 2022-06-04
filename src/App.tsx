// import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import AlbumView from './components/AlbumView';
import QuestionView from './components/QuestionView';


function App() {
    // <Route path="/preguntas" element={<Preguntas />} />
    return (
        <BrowserRouter>
            <div className="Initial" data-testid="app-1">
                <div className="panel-bg">
                    <h1 className="navTitle">
                        4S Seguridad Didáctica
                    </h1>
                </div>
                <Routes>
                    <Route path="/" element={<AlbumView />} />
                    <Route path="/reto" element={<QuestionView />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
