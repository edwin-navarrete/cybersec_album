import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import { selectSaveError, dismissSaveError } from '../features/game/gameSlice';

// Progress could not be saved and, in a team album, the game cannot go on offline
const ErrorBanner = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const saveError = useAppSelector(selectSaveError);
    if (!saveError) return null;
    return (
        <div className="errorBanner" role="alert" onClick={() => dispatch(dismissSaveError())}>
            {t("save.err")}
        </div>
    );
};

export default ErrorBanner;
