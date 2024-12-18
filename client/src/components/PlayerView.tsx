import { useTranslation } from "react-i18next";
import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { AppDispatch } from "../app/store";
import { useDispatch, useSelector } from 'react-redux';
import { loadTeam, changeLeader, getLeaderDeadline } from "../features/game/gameMiddleware";
import { selectTeam, selectTeamName } from "../features/game/gameSlice";
import { Game } from "../features/game/sticker";

const PlayerView = () => {
    const { t } = useTranslation(); // i18n
    const dispatch = useDispatch() as AppDispatch;
    const team = useSelector(selectTeam)
    const teamName = useSelector(selectTeamName)
    const isLeader = localStorage.getItem('isLeader') ?? 0;
    const [dueLeader, setDueLeader] = useState('');

    // Load team members
    useEffect(() => {
        dispatch(loadTeam());
    }, [dispatch]);

    function getTimeDiff(from: number, to: number): string {
        const diff = Math.abs(from - to); // Diferencia en milisegundos
    
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
    
        return parts.length > 0 ? parts.join(' ') : '';
    }

    function getLeaderTime(player: Game.Player) {
        const [now, date, due] = getLeaderDeadline(player)
        if (due > 0 && dueLeader === '') setDueLeader(getTimeDiff(due ,now))
        return getTimeDiff(date, now)
    }

    function handleSwitchLeader(player: Game.Player){
        dispatch( changeLeader(player) );
    }


    function getPlayerView(player: Game.Player) {
        return  <div className="playerRowContainer" key={player.id}>
                    <div className="playerNameContainer"><p>{player.isLeader && <i className="fas fa-crown"/>}{player.isLeader && getLeaderTime(player)} {player.playerName}</p></div>
                    <div className="playerStarsContainer">
                        {/* <i className="fas fa-star"></i> */}
                    </div>
                    <div className="playerButtonContainer">
                        <Button 
                            variant="contained" 
                            disabled={ !!player.isLeader || (!isLeader && !!dueLeader) } 
                            onClick={() => player.id && handleSwitchLeader(player)} >
                            <i className="fa-solid fa-share"/><i className="fas fa-crown"/>
                        </Button>
                    </div>  
                </div>
    }

    return (
        <section className="pageContainer">
            <header className="playersHeader">
                <h2><i className="fas fa-users"></i>{teamName}</h2>
                 <p>{isLeader || !dueLeader? t("nextLeader.hdr") : t("dueLeader.hdr",{dueLeader:dueLeader})}</p>
            </header>
            <section className="playerContainer">
                { team.map(member => getPlayerView(member)) }
            </section>
        </section>
    );
}

export default PlayerView;
