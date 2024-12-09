import { useTranslation } from "react-i18next";
import Button from '@mui/material/Button';
import { useNavigate } from "react-router-dom";


const PlayerView = () => {
    const { t } = useTranslation(); // i18n
    const navigate = useNavigate();
    return (
        <section className="pageContainer">
            <header className="playersHeader">
                <h2><i className="fas fa-users"></i>Los ogros del pantano</h2>
                <p>Elije a un sucesor:</p>
            </header>
            <section className="playerContainer">
                <div className="playerRowContainer">
                    <div className="playerNameContainer"><p><i className="fas fa-crown"></i>(4h) Fernando Casanova</p></div>
                    <div className="playerStarsContainer">
                        <i className="fas fa-star"></i>
                    </div>
                    <div className="playerButtonContainer">
                        <Button variant="contained" disabled ><i className="fa-solid fa-share"></i><i className="fas fa-crown"></i></Button>
                    </div>
                </div>

                <div className="playerRowContainer">
                    <div className="playerNameContainer"><p>Gustavo Perez</p></div>
                    <div className="playerStarsContainer">
                        <i className="fas fa-star"></i><i className="fas fa-star"></i>
                    </div>
                    <div className="playerButtonContainer">
                        <Button variant="contained" ><i className="fa-solid fa-share"></i><i className="fas fa-crown"></i></Button>
                    </div>
                </div>
                <div className="playerRowContainer">
                    <div className="playerNameContainer"><p>Maribel García</p></div>
                    <div className="playerStarsContainer">
                        <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                    </div>
                    <div className="playerButtonContainer">
                        <Button variant="contained" ><i className="fa-solid fa-share"></i><i className="fas fa-crown"></i></Button>
                    </div>
                </div>
                <div className="playerRowContainer">
                    <div className="playerNameContainer"><p>Alvaro Duarte</p></div>
                    <div className="playerStarsContainer">
                       
                    </div>
                    <div className="playerButtonContainer">
                        <Button variant="contained" ><i className="fa-solid fa-share"></i><i className="fas fa-crown"></i></Button>
                    </div>
                </div>
                <div className="playerRowContainer">
                    <div className="playerNameContainer"><p>Juan Carlos Triviño</p></div>
                    <div className="playerStarsContainer">
                        <i className="fas fa-star"></i>
                    </div>
                    <div className="playerButtonContainer">
                        <Button variant="contained" ><i className="fa-solid fa-share"></i><i className="fas fa-crown"></i></Button>
                    </div>
                </div>
                <div className="playerRowContainer">
                    <div className="playerNameContainer"><p>Daniel Samper</p></div>
                    <div className="playerStarsContainer">
                        
                    </div>
                    <div className="playerButtonContainer">
                        <Button variant="contained" ><i className="fa-solid fa-share"></i><i className="fas fa-crown"></i></Button>
                    </div>
                </div>
                <div className="playerRowContainer">
                    <div className="playerNameContainer"><p>Julián Saldarriaga</p></div>
                    <div className="playerStarsContainer">
                        <i className="fas fa-star"></i><i className="fas fa-star"></i>
                    </div>
                    <div className="playerButtonContainer">
                        <Button variant="contained" ><i className="fa-solid fa-share"></i><i className="fas fa-crown"></i></Button>
                    </div>
                </div>
            </section>           
            <div className='buttonContainer'>
                <Button variant="contained" onClick={() => navigate("/")}>{t("button.back")}</Button>
            </div>
        </section>
    );
}

export default PlayerView;
