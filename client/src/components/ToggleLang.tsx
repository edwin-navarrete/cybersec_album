import i18n from "i18next"
import { useState } from 'react';
import { AppDispatch } from '../app/store'
import { useDispatch } from 'react-redux';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { changeLanguage } from '../features/game/gameMiddleware';

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
                <div className="languageToggle">
                    <img src="flag-spain.svg" alt="Español" className="flagIcon" />
                    Español
                </div>
            </ToggleButton>
            <ToggleButton value="en" aria-label="centered">
                <div className="languageToggle">
                    <img src="flag-uk.svg" alt="English" className="flagIcon" />
                    English
                </div>
            </ToggleButton>
        </ToggleButtonGroup>
    );
}
