import { useSelector } from 'react-redux';

import { selectGauge } from '../features/game/gameSlice';


export default function Gauge() {
    const gaugeVal = Math.floor(useSelector(selectGauge)*100);
    return (<div className="gauge">{gaugeVal} %</div>);
}
