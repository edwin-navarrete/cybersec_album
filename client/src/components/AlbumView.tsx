import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { GoogleReCaptcha } from 'react-google-recaptcha-v3';

import { selectStickers, selectStickerSpots, selectAchievement, updateToken } from '../features/game/gameSlice';
import { nextQuestion, stickerSample, glueSticker, registerPlayer } from '../features/game/gameMiddleware';
import { AppDispatch } from '../app/store'
import Gauge from './Gauge';
import StickerView from './StickerView';

const AlbumView = () => {
    const dispatch = useDispatch() as AppDispatch;
    const spots = useSelector(selectStickerSpots);
    const stickers = useSelector(selectStickers);
    const isFull = useSelector(selectAchievement);

    const navigate = useNavigate();
    const { t } = useTranslation();

    const [splash, setSplash] = useState(true);
    const [intro, setIntro] = useState(true);
    const [playerName, setPlayerName] = useState('');

    useEffect(() => {
        var player = localStorage.getItem('playerName')
        player && setPlayerName(player);
        setTimeout(() => {
            setIntro(false);
        }, 5500);
    });

    const handleCaptcha = useCallback(async (token : string) => {
        // console.log(token.slice(-5));
        dispatch(updateToken(token));
        if(stickers.length === 1 && !stickers[0].inAlbum) dispatch(glueSticker(await stickerSample))
        // eslint-disable-next-line
    }, [dispatch, stickers]);

    function handleMoreStickers() {
        dispatch(nextQuestion())
        navigate("/reto/")
    }

    function getStickerView(spot: string) {
        let sticker = stickers.filter(s => s.spot === spot)
        if (sticker.length) {
            return (<StickerView key={spot} sticker={sticker[0]} />)
        }
        else {
            return (<div className="emptySpot" key={spot}>
                <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" className="sticker" alt={spot} />
            </div>)
        }
    }

    function showIntro() {
        return intro && (<div className='introSplash'><span className="introMsg bubble-bottom-left">{t("introMsg")}</span></div>);
    }

    const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        setPlayerName(event.target.value);
    };


    function handleSubmit() {
        if (playerName.trim() !== '') {
            dispatch(registerPlayer(playerName));
            setSplash(false);
        }
    }

    function success() {
        return splash && (
            <form className='successSplash' onSubmit={handleSubmit}>
                <div className="successForm">
                    <p className="completed" >{t("quiz.completed")}</p>
                    <TextField
                        id="playerName"
                        type="text"
                        variant="standard"
                        value={playerName}
                        onChange={handleNameChange}
                        placeholder={t("hint.register")}
                        required />
                    <Button type="submit" className="glowingBtn">{t("button.register")}</Button>
                </div>
            </form>);
    }

    return (
        <section className="pageContainer">

            <GoogleReCaptcha action="viewAlbum" onVerify={handleCaptcha}/>
            <section className="albumContainer" data-testid="container-a" key='album0'>
                {spots.map((spot) => getStickerView(spot))}
            </section>
            {stickers.length === 1 && showIntro()}
            {isFull && success()}
            <div className='buttonContainer' key='buttonBar0'>
                {Gauge()}
                {!isFull && <Button className={stickers.length === 1? "glowingBtn" : ""} key='button0' variant="contained" onClick={handleMoreStickers}>{t("button.earn")}</Button>}
            </div>
        </section>

    );
};
export default AlbumView;
