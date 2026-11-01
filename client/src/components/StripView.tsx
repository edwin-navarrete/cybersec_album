import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { AppDispatch } from '../app/store';
import { glueSticker } from '../features/game/gameMiddleware';
import { Sticker } from '../features/game/sticker';
import { stripOf, stripSpots } from '../features/game/strips';

interface StripViewProps {
    strip: number                    // the strip to show
    spots: string[]                  // all the album spots
    stickers: Sticker.AlbumStiker[]  // stickers the player already won
    target: string                   // the panel this question is for
}

// A strip with the panels already won; the won ones can be claimed with a click, as in the album
const StripView = ({ strip, spots, stickers, target }: StripViewProps) => {
    const { t } = useTranslation();
    const dispatch = useDispatch() as AppDispatch;

    return (
        <div className="stripView" data-testid="strip-view">
            <p className="stripCaption">
                {t("strip.label", {
                    strip,
                    total: new Set(spots.map(stripOf)).size,
                    owned: stripSpots(strip, spots).filter(s => stickers.some(k => k.spot === s)).length,
                    size: stripSpots(strip, spots).length
                })}
            </p>
            <div className="stripPanels">
                {stripSpots(strip, spots).map(spot => {
                    const won = stickers.find(s => s.spot === spot);
                    const isTarget = spot === target;
                    if (won) {
                        return (
                            <div key={spot} className={"stripPanel" + (isTarget ? " earned" : "")}>
                                <img src={won.image} className={won.inAlbum ? 'sticker' : 'stickerHint'} alt={spot}
                                    onClick={() => { if (!won.inAlbum) dispatch(glueSticker(won)); }} />
                            </div>
                        );
                    }
                    return <div key={spot} className={"stripPanel emptyPanel" + (isTarget ? " target" : "")} aria-label={spot} />;
                })}
            </div>
        </div>
    );
};

export default StripView;
