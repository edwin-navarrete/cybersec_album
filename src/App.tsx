// import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import AlbumView from './components/AlbumView';
import QuestionView from './components/QuestionView';
import { AppDispatch } from './app/store'
import { fetchAlbum } from './features/game/gameMiddleware';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ToggleLang from './toggleLang';

function App() {
    // Load initial state
    const dispatch = useDispatch() as AppDispatch;
    const { t } = useTranslation(); // i18n
    dispatch(fetchAlbum());

    // <Route path="/preguntas" element={<Preguntas />} />
    return (
        <BrowserRouter>
            <div className="Initial" data-testid="app-1">
                <div className="navTitle">
                    <h1>
                        {t('album.title')}
                    </h1>
                    {ToggleLang()}
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
