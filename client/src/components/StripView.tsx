import { useTranslation } from 'react-i18next';

import { Sticker } from '../features/game/sticker';
import { stripOf, stripSpots } from '../features/game/strips';

interface StripViewProps {
    spots: string[]                  // all the album spots
    stickers: Sticker.AlbumStiker[]  // stickers the player already won
    target: string                   // the panel this question is for
}

// The strip the player is working on, with the panel they are about to win
const StripView = ({ spots, stickers, target }: StripViewProps) => {
    const { t } = useTranslation();
    const strip = stripOf(target);

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
                                <img src={won.image} className={won.inAlbum ? 'sticker' : 'stickerHint'} alt={spot} />
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
