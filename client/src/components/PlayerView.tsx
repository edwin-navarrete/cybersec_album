import { useTranslation } from "react-i18next";
import Button from '@mui/material/Button';
import { useNavigate } from "react-router-dom";
import { useEffect } from 'react';
import { AppDispatch } from "../app/store";
import { useDispatch, useSelector } from 'react-redux';
import { loadTeam } from "../features/game/gameMiddleware";
import { selectTeam, selectTeamName } from "../features/game/gameSlice";
import { Sticker } from "../features/game/sticker";

const PlayerView = () => {
    const { t } = useTranslation(); // i18n
    const navigate = useNavigate();
    const dispatch = useDispatch() as AppDispatch;
    const team = useSelector(selectTeam)
    const teamName = useSelector(selectTeamName)
    
    // Load team members
    useEffect(() => {
        dispatch(loadTeam());
    }, [dispatch]);

    function getLeaderTime(player: Sticker.Player) {
        const date =Date.parse(player.modifiedOn);
        return <>{date}</>
    }

    function getPlayerView(player: Sticker.Player) {
        return  <div className="playerRowContainer" key={player.id}>
                    <div className="playerNameContainer"><p>{player.isLeader && <i className="fas fa-crown"/>}{player.isLeader && getLeaderTime(player)} {player.playerName}</p></div>
                    <div className="playerStarsContainer">
                        {/* <i className="fas fa-star"></i> */}
                    </div>
                    <div className="playerButtonContainer">
                        <Button variant="contained" disabled={player.isLeader? true:false} ><i className="fa-solid fa-share"/><i className="fas fa-crown"/></Button>
                    </div>
                </div>
    }

    return (
        <section className="pageContainer">
            <header className="playersHeader">
                <h2><i className="fas fa-users"></i>{teamName}</h2>
                <p>{t("nextLeader.hdr")}</p>
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
