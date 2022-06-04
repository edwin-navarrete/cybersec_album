// import React from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../app/store'

import { glueSticker } from '../features/game/gameMiddleware';
import { Sticker } from '../features/game/sticker';
import PropTypes from 'prop-types';
import '../index.css';

interface StickerProps {
    sticker: Sticker.AlbumStiker
}

const StickerView = (props: StickerProps) => {
    const dispatch = useDispatch() as AppDispatch;
    const { spot, image, inAlbum } = props.sticker;

    const handleGlue = () =>{
        // let spot = event.currentTarget.attributes.getNamedItem("alt")
        // console.log(spot)
        dispatch(glueSticker(props.sticker))
    }

    return (
        <div className="stickerFrame" key={spot}>
            <img src={image} key={spot+"_img"} className={inAlbum ? 'sticker' : 'stickerHint'} onClick={handleGlue} alt={spot} />
        </div>
    );
};

StickerView.propTypes = {
    sticker: PropTypes.any.isRequired
};

export default StickerView;
