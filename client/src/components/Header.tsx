import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
    const { t } = useTranslation();
    const location = useLocation();
    const backRoutes = ["/quest", "/players"];
    const showBackButton = backRoutes.includes(location.pathname);
    return (<div className="navTitle">
            {showBackButton && (
                <Link to="/album" className="back-button">←</Link>
            )}
        <h2>{t('album.title')}</h2>
    </div>)
}
