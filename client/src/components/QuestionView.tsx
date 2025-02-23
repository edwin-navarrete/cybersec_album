// import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {  GoogleReCaptcha } from 'react-google-recaptcha-v3';

import '../index.css';
import { selectQuestion, selectScore, selectUnclaimed, updateToken, QuestionState } from '../features/game/gameSlice';
import { putAnswer, getPlayTokenFactory, nextQuestion } from '../features/game/gameMiddleware';

import { AppDispatch } from '../app/store'
import Button from '@mui/material/Button';
import { Question } from '../features/game/question';

import Rating from "@mui/material/Rating";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const QuestionView = () => {
    const score = useSelector(selectScore);
    const questionState = useSelector(selectQuestion);
    const unclaimed = useSelector(selectUnclaimed);
    const navigate = useNavigate();
    const dispatch = useDispatch() as AppDispatch;
    const { t } = useTranslation(); // i18n

    const handleCaptcha = useCallback((token : string) => {
        // console.log(token.slice(-5));
        dispatch(updateToken(token));
        // eslint-disable-next-line
    }, [dispatch, questionState]);

    const hasGroupId = localStorage.getItem('groupId') !== null && localStorage.getItem('groupId') !== undefined;
    const handleTeamRedirect = () => {
        navigate('/players');
    };

    const handleAlbumRedirect = () => {
        navigate('/album');
    };

    let timeLimit = Math.floor((questionState?.difficulty || 0.5) * 15 + 6)
    let optCount = questionState?.options.length || 4;

    const [timer, setTimer] = useState(-1)
    const [timestamp, setTimestamp] = useState(-1)

    // go to album if answered enough to fill the album
    // useEffect(() => { achievement && navigate("/album") })
    useEffect(() => {
        let interval: NodeJS.Timer;
        if (questionState?.success === undefined) {
            if (timer === 0) {
                dispatch(putAnswer({
                    response: [],
                    latency: Date.now() - timestamp
                }))
                setOptState(new Array(optCount).fill(false))
                setTimer(timeLimit)
            }
            else if (timer > 0) interval = setInterval(() => setTimer(timer - 1), 1000);
            else if (timer === -1){
                setTimestamp(Date.now())
                setTimer(timeLimit)
            };
        }
        return () => interval && clearInterval(interval);
    }, [questionState?.success, timer, timeLimit, dispatch, optCount, timestamp]);


    const [optState, setOptState] = useState(
        new Array(optCount).fill(false)
    );

    const sendAttempt: React.ChangeEventHandler<HTMLInputElement> = (event) => {
        let position = +event.currentTarget.value;
        const newOptState = optState.map((b, i) => i === position ? !b : b);
        setOptState(newOptState);
        let attempts = newOptState.reduce((cnt, chk) => chk ? cnt + 1 : cnt, 0)
        if (questionState && attempts >= questionState.solution.length) {
            let response = newOptState.map((b, i) => b ? i : null).filter(i => i !== null) as number[];
            dispatch(putAnswer({
                response: response,
                latency: Date.now() - timestamp
            }))
            setOptState(new Array(optCount).fill(false))
        }
    }

    function handleNewQuestion() {
        setTimer(-1)
        dispatch(nextQuestion())
    }

    function renderFeedback(success?: boolean | null, score?: Question.QuestionScore) {
        if (success === true) {
            if (unclaimed === 0 && score) {
                return (
                    <div className="feedbackFrame">
                        <label className="feedbackMsg">{t("quiz.success_score")}</label>
                        <div className="scoreDetails">
                            <Box display="flex" alignItems="center" gap={2} marginTop={2}>
                                <Rating
                                    name="score-rating"
                                    value={(score.score * 10) / 2} // Convertir a rango 0-5
                                    precision={0.1}
                                    readOnly
                                />
                                <Typography variant="h6">
                                    {t("quiz.score", {score: score.score})}
                                </Typography>
                            </Box>
                            <p>{t("quiz.expert",{ perc: score.expert/score.total})}</p>
                            <p>{t("quiz.proficient",{ perc: score.proficient/score.total})}</p>
                            <p>{t("quiz.beginner",{ perc: score.beginner/score.total})}</p>
                            <p>{t("quiz.total", { value: score.total})}</p>
                        </div>
                    </div>
                );
            } else {
                return (<div className="feedbackFrame">
                    <label className="feedbackMsg">{t("quiz.success")}</label>
                    <p className="rewardMsg">{t("quiz.reward", { number: unclaimed })}ooo</p>
                </div>)
            }
        }
        if (success === false || success === null) {
            return (<div>
                {questionState?.feedback && <p className="feedbackContent">{questionState.feedback}</p>}
                <p className="feedbackMsg">{t("quiz.fail")}</p>
            </div>)
        }
        return null
    }

    function getFeedbackClass(index: number, solution: number[], wrong?: number[], success?: boolean | null) {
        if (success === undefined) return "questionOption";
        if (solution.includes(index)) return "questionOption correct";
        if (wrong && wrong.includes(index)) return "questionOption wrong";
        return "questionOption";
    }

    function renderQuestion(questionState?: QuestionState, score?: Question.QuestionScore) {
        const isCoop = !!localStorage.getItem("groupId")
        const isLeader = +(localStorage.getItem("isLeader") ?? 0);
        let message = ''
        if(isCoop && !isLeader){
            message += t("quiz.notLeader");
        }
        else {
            const tokenFactory = getPlayTokenFactory(isCoop);
            const playToken = localStorage.getItem("playToken") ?? '';
            const token = tokenFactory.loadToken(playToken);
            if(token.isInvalid()){
                message += t("quiz.playDisabled",{timeDesc: token.validPeriod()}) ;
            }
        }
        const getImageSrc = () => {
            if (isCoop && !isLeader) return { src: "../waitleader.jpeg", alt: "Wait for Leader" };
            return { src: "../sandtimer.gif", alt: "Wait for your turn" };
        };

        if(message){
            const imageProps = getImageSrc();
            return (
                <div className='questionFrame'>
                    <img src={imageProps.src} alt={imageProps.alt}></img>
                <p>{message}</p>{isCoop && (<><p>{t("quiz.leaderHint")}<i className="fas fa-users"></i></p></>) }
            </div>);
        }
    
        if (!questionState) return (<div className='questionFrame' />);

        const captchaKey = process.env.CAPTCHAKEY;

        const { question, options, success, solution, wrong } = questionState
        return (<div className='questionFrame' >
            { captchaKey && <GoogleReCaptcha action="viewQuestion" onVerify={handleCaptcha}/> }
            <h3>{question}</h3>
            {solution.length > 1 && <h4>{t("quiz.multipleWrn")}</h4>}
            {options.map((option, i) =>
                <label key={i} className={getFeedbackClass(i, solution, wrong, success)}>
                    <input type="checkbox"
                        disabled={success !== undefined}
                        value={i}
                        checked={optState[i]}
                        onChange={sendAttempt} />
                    {option}
                </label>)}
            {questionState?.success === undefined && <div id="timer">
                <div id="seconds">{timer}<span>{t("timer.secs")}</span></div>
            </div>}
            {renderFeedback(success, score)}
        </div>);
    }

    return (
        <section className="pageContainer">
            <section className="questionContainer" data-testid="container-a">
                {renderQuestion(questionState, score)}
            </section>
            <div className='buttonContainer'>
                <div className='buttonGrp'>
                {unclaimed > 0 && <Button 
                    size="small"
                    className="glowingBtn"
                    onClick={handleAlbumRedirect}
                    startIcon={<i className="fas fa-hand-holding-heart"></i>}
                    variant="contained">{t("button.claim")}
                 </Button>}
                {questionState?.success !== undefined && 
                    <Button size='small' variant="contained" onClick={handleNewQuestion} startIcon={<i className="fas fa-hand-fist"></i>}>
                    {t("button.try")}
                    </Button>}
                {hasGroupId && ( <Button size='small' variant="contained"  onClick={handleTeamRedirect}>
                        <i className="fas fa-users" />
                    </Button>)}
                </div>
            </div>
        </section>
    );
};

export default QuestionView;
