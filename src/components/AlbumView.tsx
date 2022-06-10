import { useSelector, useDispatch } from 'react-redux';

import { selectStickers, selectStickerSpots, selectAchievement } from '../features/game/gameSlice';
import { nextQuestion } from '../features/game/gameMiddleware';
import { AppDispatch } from '../app/store'
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import Gauge from './Gauge';

import StickerView from './StickerView';
import { useNavigate } from 'react-router-dom';

const AlbumView = () => {
    const dispatch = useDispatch() as AppDispatch;
    const spots = useSelector(selectStickerSpots);
    const stickers = useSelector(selectStickers);
    const isFull = useSelector(selectAchievement);
    const navigate = useNavigate();
    const { t } = useTranslation();

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

    return (
        <section className="pageContainer">
            {Gauge()}
            <section className="albumContainer" data-testid="container-a" key='album0'>
                {spots.map((spot) => getStickerView(spot))}
            </section>
            <div className='buttonContainer' key='buttonBar0'>
                {!isFull && <Button key='button0' variant="contained" onClick={handleMoreStickers}>{t("button.earn")}</Button>}
                {isFull && <img className="successIco" src="success.png" alt="lo lograste!" />}
            </div>
        </section>

    );
};
export default AlbumView;
