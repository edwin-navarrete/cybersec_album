import { useTranslation } from "react-i18next";
import Button from '@mui/material/Button';
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { AppDispatch } from "../app/store";
import { useDispatch, useSelector } from 'react-redux';
import { loadTeam, changeLeader } from "../features/game/gameMiddleware";
import { selectTeam, selectTeamName } from "../features/game/gameSlice";
import { Sticker } from "../features/game/sticker";

const PlayerView = () => {
    const { t } = useTranslation(); // i18n
    const navigate = useNavigate();
    const dispatch = useDispatch() as AppDispatch;
    const team = useSelector(selectTeam)
    const teamName = useSelector(selectTeamName)
    const isLeader = localStorage.getItem('isLeader') ?? 0;
    const LEADER_TIMEOUT = 2 * 24 * 60 * 60 * 1000; // 2d
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

    function getLeaderTime(player: Sticker.Player) {
        const date =Date.parse(player.modifiedOn);
        const now = Date.now()
        const due = LEADER_TIMEOUT + date;
        if (due > now && dueLeader === '') setDueLeader(getTimeDiff(due , Date.now()))
        return getTimeDiff(date, now)
    }

    function handleSwitchLeader(player: Sticker.Player){
        dispatch( changeLeader(player) );
    }


    function getPlayerView(player: Sticker.Player) {
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
            <div className='buttonContainer'>
                <Button variant="contained" onClick={() => navigate("/album")}>{t("button.back")}</Button>
            </div>
        </section>
    );
}

export default PlayerView;
