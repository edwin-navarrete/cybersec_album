import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import AlbumView from './components/AlbumView';
import QuestionView from './components/QuestionView';
import Header from './components/Header';
import PlayerView from './components/PlayerView';

function App() {
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
