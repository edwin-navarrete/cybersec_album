import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import AlbumView from './components/AlbumView';
import QuestionView from './components/QuestionView';
import Header from './components/Header';

import { AppDispatch } from './app/store'
import { fetchAlbum } from './features/game/gameMiddleware';

import { useDispatch } from 'react-redux';
import PlayerView from './components/PlayerView';

function App() {
    // Load initial state
    const dispatch = useDispatch() as AppDispatch;
    dispatch(fetchAlbum());

    return (
        <BrowserRouter>
            <div className="Initial" data-testid="app-1">
                {Header()}
                <Routes>
                    <Route path="/" element={<AlbumView />} />
                    <Route path="/reto" element={<QuestionView />} />
                    <Route path="/players" element={<PlayerView />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
