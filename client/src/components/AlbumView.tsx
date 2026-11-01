import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { GoogleReCaptcha } from 'react-google-recaptcha-v3';
import { selectStickers, selectStickerSpots, selectAchievement, selectGameMode, selectAlbumError, updateToken } from '../features/game/gameSlice';
import { fetchAlbum, nextQuestion, registerPlayer } from '../features/game/gameMiddleware';
import { AppDispatch, RootState } from '../app/store'
import Gauge from './Gauge';
import StickerView from './StickerView';
import { announcesNextPanel, attentionSpot, completedStrips, stripProgress, stripOf } from '../features/game/strips';

const AlbumView = () => {
    const dispatch = useDispatch() as AppDispatch;
    const spots = useSelector(selectStickerSpots);
    const stickers = useSelector(selectStickers);
    const isComplete = useSelector((state: RootState) => selectAchievement(state, true));
    const isFull = useSelector(selectAchievement);
    const allowedMode = useSelector(selectGameMode);
    const albumError = useSelector(selectAlbumError);

    // Load initial album state
    useEffect(() => {
        dispatch(fetchAlbum());
    }, [dispatch]);

    const hasGroupId = localStorage.getItem('groupId') !== null && localStorage.getItem('groupId') !== undefined;
    const handleTeamRedirect = () => {
        navigate('/players');
    };


    const navigate = useNavigate();
    const { t } = useTranslation();

    const [splash, setSplash] = useState(true);
    const [intro, setIntro] = useState(true);
    const [playerName, setPlayerName] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        var player = localStorage.getItem('playerName')
        player && setPlayerName(player);
        setTimeout(() => {
            setIntro(false);
        }, 5500);
    }, []);

    const handleCaptcha = useCallback(async (token : string) => {
        // console.log(token.slice(-5));
        dispatch(updateToken(token));
        // eslint-disable-next-line
    }, [dispatch, stickers]);

    function handleMoreStickers() {
        dispatch(nextQuestion())
        navigate("/quest")
    }

    // Strip goals: the album rows are 3-panel comic strips
    // Nothing to announce while the album could not be opened
    const strips = announcesNextPanel() && !albumError
    const next = strips ? attentionSpot(spots, stickers) : undefined
    const doneStrips = strips ? completedStrips(spots, stickers) : []
    // The intro character covers the bottom bar of a brand new album
    const progress = strips && !isComplete && !(intro && stickers.length === 1) ? stripProgress(spots, stickers) : undefined

    // Celebrate when gluing a sticker finishes a strip (not when loading the album)
    const lastDone = useRef<number | null>(null)
    const [bannerStrip, setBannerStrip] = useState<number | null>(null)
    useEffect(() => {
        if (!strips || stickers.length === 0) return
        const done = completedStrips(spots, stickers)
        if (lastDone.current !== null && done.length > lastDone.current) {
            setBannerStrip(done[done.length - 1])
        }
        lastDone.current = done.length
    }, [strips, spots, stickers])
    useEffect(() => {
        if (bannerStrip === null) return
        const id = setTimeout(() => setBannerStrip(null), 3000)
        return () => clearTimeout(id)
    }, [bannerStrip])

    function getStickerView(spot: string) {
        let sticker = stickers.filter(s => s.spot === spot)
        if (sticker.length) {
            return (<StickerView key={spot} sticker={sticker[0]} stripDone={doneStrips.includes(stripOf(spot))} highlight={spot === next} />)
        }
        else {
            return (<div className={spot === next ? "emptySpot nextSpot" : "emptySpot"} key={spot}>
                <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" className="sticker" alt={spot} />
            </div>)
        }
    }

    function showIntro() {
        return intro && (<div className='introSplash'><span className="introMsg bubble-bottom-left">{t("introMsg")}</span></div>);
    }

    const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        setPlayerName(event.target.value);
        setErrorMessage(null); 
    };


    function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (playerName.trim() === '') {
            setErrorMessage(t("emptyName.err"));
            return;
        }
        dispatch(registerPlayer({ playerName, gameMode: allowedMode === 'coop' ? 'coop' : 'solo'}))
        .unwrap()
        .then(() => {
            setErrorMessage(null); 
            setSplash(false);
        })
        .catch((error) => {
            if (error.message === "DUPLICATE_NAME") {
                setErrorMessage(t("dupName.err"));
            } else {
                setErrorMessage(t("registration.err"));
            }
        });
    }
    const playerId = localStorage.getItem("playerId");

    useEffect(() => {
        if (playerId && isFull) {
            setTimeout(() => {
                setSplash(false);
            }, 4500);
        }
    });
    function success() {
        return splash && (
            <form className='successSplash' onSubmit={handleSubmit}>
                <div className="successForm">
                    <p className="completed" >{t("quiz.completed")}</p>
                    {!playerId && (
                        <>
                            <TextField
                                id="playerName"
                                type="text"
                                variant="standard"
                                value={playerName}
                                onChange={handleNameChange}
                                placeholder={t("hint.register")}
                                error={!!errorMessage}
                                required
                            />
                            {errorMessage && <p className="errorMessage">{errorMessage}</p>}
                            <Button type="submit" className="glowingBtn">
                                {t("button.register")}
                            </Button>
                        </>
                    )}
                </div>
            </form>);
    }
    const captchaKey = process.env.CAPTCHAKEY;
    return (
        <section className="pageContainer">
            {captchaKey && <GoogleReCaptcha action="viewAlbum" onVerify={handleCaptcha}/>}
            <section className="albumContainer" data-testid="container-a" key='album0'>
                {spots.map((spot) => getStickerView(spot))}
            </section>
            {stickers.length === 1 && showIntro()}
            {albumError && (<div className="albumError" role="alert">
                <p>{t("album.err")}</p>
                <Button variant="contained" onClick={() => dispatch(fetchAlbum())}>{t("button.retry")}</Button>
            </div>)}
            {isFull && success()}
            {bannerStrip !== null && <div className="stripBanner" role="status">{t("strip.complete", { strip: bannerStrip })}</div>}
            <div className='buttonContainer' key='buttonBar0'>
                {progress && <p className="stripCaption">
                    {t("strip.label", { strip: progress.strip, total: progress.total, owned: progress.claimed, size: progress.size })}
                    {progress.pending > 0 && " " + t("strip.pending", { pending: progress.pending })}
                </p>}
                {Gauge()}
                <div className='buttonGrp'>
                {!isComplete && !albumError && <Button 
                    className={stickers.length === 1? "glowingBtn" : ""}
                    key='button0' variant="contained" 
                    onClick={handleMoreStickers}>{t("button.earn")}
                 </Button>}    
                {hasGroupId && (<Button variant="contained" onClick={handleTeamRedirect}>
                    <i className="fas fa-users"/></Button>)}
                </div>
            </div>
        </section>

    );
};
export default AlbumView;
