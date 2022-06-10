import { useSelector } from 'react-redux';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';

import { selectGauge } from '../features/game/gameSlice';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" {...props} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">{`${Math.round(
                    props.value,
                )}%`}</Typography>
            </Box>
        </Box>
    );
}
export default function Gauge() {
    const gauge = Math.floor(useSelector(selectGauge) * 100);
    // <LinearProgress variant="buffer" value={progress} valueBuffer={buffer} />
    return (<Box sx={{ width: '100%' }}>
        <LinearProgressWithLabel value={gauge} />
    </Box>);
}
