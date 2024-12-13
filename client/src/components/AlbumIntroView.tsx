import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { GoogleReCaptcha } from 'react-google-recaptcha-v3';

import { selectStickers, selectStickerSpots, selectAchievement, updateToken } from '../features/game/gameSlice';
import { fetchAlbum, nextQuestion, registerPlayer } from '../features/game/gameMiddleware';
import { AppDispatch, RootState } from '../app/store'
import Gauge from './Gauge';
import StickerView from './StickerView';
import ToggleLang from './ToggleLang';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';

const AlbumIntroView = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch() as AppDispatch;
    const { t } = useTranslation();
    const [gameMode, setGameMode] = useState('solo');
    const [playerName, setPlayerName] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    useEffect(() => {
        var player = localStorage.getItem('playerName')
        player && setPlayerName(player);
    }, []);

    const handleGameMode = (
        _event: React.MouseEvent<HTMLElement>,
        newMode: string,
    ) => {
        setGameMode(newMode);
    };

    const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        setPlayerName(event.target.value);
        setErrorMessage(null); 
    };

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (playerName.trim() === '') {
            setErrorMessage("emptyName.err");
            return;
        }
        dispatch(registerPlayer({ playerName, gameMode }))
        .unwrap()
        .then(() => {
            setErrorMessage(null);
            navigate("/album/")
        })
        .catch((error) => {
            if (error.message === "DUPLICATE_NAME") {
                setErrorMessage("dupName.err");
            } else {
                setErrorMessage("registration.err");
            }
        });
    }

    return (
        <section className="pageContainer">
            <form className="registrationForm" onSubmit={handleSubmit}>
                <div className="formHeader">
                    {ToggleLang()}
                </div>
                <div className="formHeader">
                    <h2>
                    {t("welcome.hdr")}  
                    </h2>
                    <p>{t("welcome.txt")}</p>
                </div>
                <div className="playerNameField">
                    <TextField
                        id="playerName"
                        type="text"
                        variant="standard"
                        value={playerName}
                        onChange={handleNameChange}
                        placeholder={t("hint.register")}
                        error={!!errorMessage}
                        fullWidth // Ocupa todo el ancho disponible
                    />
                    {errorMessage && <p className="errorMessage">{t(errorMessage)}</p>}
                </div>
                <div className="gameModeSelector">
                    <p>{t("gameMode.label")}</p>
                    <ToggleButtonGroup
                        value={gameMode}
                        exclusive
                        onChange={handleGameMode}
                        aria-label="gameMode"
                        size="medium" // Ajusta el tamaño a 'medium' para más visibilidad
                    >
                        <ToggleButton value="solo" aria-label="solo">
                            <div className="languageToggle">
                                <i className="fas fa-user"></i>{t("gameMode.solo")}
                            </div>
                        </ToggleButton>
                        <ToggleButton value="coop" aria-label="cooperative">
                            <div className="languageToggle">
                                <i className="fas fa-users"></i>{t("gameMode.coop")}
                            </div>
                        </ToggleButton>
                    </ToggleButtonGroup>
                </div>
                <div className="formActions">
                    <Button type="submit" className="glowingBtn" variant="contained" color="primary" size="large">
                        <div className="languageToggle">
                            {t("button.register")}<i className="fas fa-arrow-right"></i>
                        </div>
                    </Button>
                </div>
            </form>
        </section>

    );
};
export default AlbumIntroView;
