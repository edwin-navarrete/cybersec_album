import ToggleLang from './ToggleLang';
import { useTranslation } from 'react-i18next';

export default function Header() {
    const { t } = useTranslation();
    return (<div className="navTitle">
        <h2>{t('album.title')}</h2>
    </div>)
}
