import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import {  GoogleReCaptcha } from 'react-google-recaptcha-v3';

import { selectStickers, selectStickerSpots, selectAchievement } from '../features/game/gameSlice';
import { nextQuestion } from '../features/game/gameMiddleware';
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

    useEffect(() => {
        if (isFull) {
            console.log("setTimeout");
            setTimeout(() => {
                setSplash(false);
            }, 4500);
        }
    });

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

    function success() {
        return splash && (<div className='successSplash'><span className="completed">{t("quiz.completed")}</span></div>);
    }

    function handleCaptcha(token : string){
        // FIXME send token to backend for verification
    }

    return (
        <section className="pageContainer">
            <GoogleReCaptcha action="viewAlbum" onVerify={handleCaptcha}/>
            <section className="albumContainer" data-testid="container-a" key='album0'>
                {spots.map((spot) => getStickerView(spot))}
            </section>
            {isFull && success()}
            <div className='buttonContainer' key='buttonBar0'>
                {Gauge()}
                {!isFull && <Button key='button0' variant="contained" onClick={handleMoreStickers}>{t("button.earn")}</Button>}
            </div>
        </section>

    );
};
export default AlbumView;
