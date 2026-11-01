import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './app/hooks';
import { selectGameMode } from './features/game/gameSlice';
import './App.css';

import AlbumView from './components/AlbumView';
import QuestionView from './components/QuestionView';
import Header from './components/Header';
import ErrorBanner from './components/ErrorBanner';
import RequireAlias from './components/RequireAlias';
import PlayerView from './components/PlayerView';
import AlbumIntroView from './components/AlbumIntroView';

function App() {
    const gameMode = useAppSelector(selectGameMode);
    return (
        <BrowserRouter>
            <div className="Initial" data-testid="app-1">
                <Header />
                <ErrorBanner />
                <Routes>
                    <Route path="/" element={<AlbumIntroView />} />
                    <Route path="/album" element={<RequireAlias><AlbumView /></RequireAlias>} />
                    <Route path="/quest" element={<RequireAlias><QuestionView /></RequireAlias>} />
                    <Route path="/players" element={
                        <RequireAlias>{
                            gameMode === undefined ? null :
                            gameMode === 'solo' ? <Navigate to="/album" replace /> : <PlayerView />
                        }</RequireAlias>
                    } />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
