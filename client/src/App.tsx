import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './app/hooks';
import { selectGameMode } from './features/game/gameSlice';
import './App.css';

import AlbumView from './components/AlbumView';
import QuestionView from './components/QuestionView';
import Header from './components/Header';
import PlayerView from './components/PlayerView';
import AlbumIntroView from './components/AlbumIntroView';

function App() {
    const gameMode = useAppSelector(selectGameMode);
    return (
        <BrowserRouter>
            <div className="Initial" data-testid="app-1">
                <Header />
                <Routes>
                    <Route path="/" element={<AlbumIntroView />} />
                    <Route path="/album" element={<AlbumView />} />
                    <Route path="/quest" element={<QuestionView />} />
                    <Route path="/players" element={
                        gameMode === undefined ? null :
                        gameMode === 'solo' ? <Navigate to="/album" replace /> : <PlayerView />
                    } />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
