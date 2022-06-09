import { useState } from 'react';
import { AppDispatch } from './app/store'
import { useDispatch } from 'react-redux';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import i18n from "i18next"
import { changeLanguage } from './features/game/gameMiddleware';

export default function ToggleLang() {
    const [language, setLanguage] = useState('es');
    const dispatch = useDispatch() as AppDispatch;

    const handleLanguage = (
        _event: React.MouseEvent<HTMLElement>,
        newLanguage: string,
    ) => {
        setLanguage(newLanguage);
        dispatch(changeLanguage(newLanguage))
        i18n.changeLanguage(newLanguage);
    };

    return (
        <ToggleButtonGroup
            value={language}
            exclusive
            onChange={handleLanguage}
            aria-label="language"
            size="small"
        >
            <ToggleButton value="es" aria-label="left aligned">
                Español
            </ToggleButton>
            <ToggleButton value="en" aria-label="centered">
                English
            </ToggleButton>
        </ToggleButtonGroup>
    );
}
