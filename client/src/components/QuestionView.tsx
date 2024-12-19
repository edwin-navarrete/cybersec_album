// import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {  GoogleReCaptcha } from 'react-google-recaptcha-v3';

import '../index.css';
import { selectQuestion, selectUnclaimed, selectAchievement, updateToken, QuestionState } from '../features/game/gameSlice';
import { putAnswer, getPlayTokenFactory } from '../features/game/gameMiddleware';

import { AppDispatch, RootState } from '../app/store'
import Button from '@mui/material/Button';

const QuestionView = () => {
    const questionState = useSelector(selectQuestion);
    const unclaimed = useSelector(selectUnclaimed);
    const achievement = useSelector((state: RootState) => selectAchievement(state, true));
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

    let timeLimit = Math.floor((questionState?.difficulty || 0.5) * 15 + 6)
    let optCount = questionState?.options.length || 4;

    const [timer, setTimer] = useState(-1)
    const [timestamp, setTimestamp] = useState(-1)

    // go to album if answered enough to fill the album
    useEffect(() => { achievement && navigate("/album") })
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

    function renderFeedback(success?: boolean | null) {
        if (success === true) {
            return (<div className="feedbackFrame">
                <label className="feedbackMsg">{t("quiz.success")}</label>
                <p className="rewardMsg">{t("quiz.reward", { number: unclaimed })}</p>
            </div>)
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

    function renderQuestion(questionState?: QuestionState) {
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
            {renderFeedback(success)}
        </div>);
    }

    return (
        <section className="pageContainer">
            <section className="questionContainer" data-testid="container-a">
                {renderQuestion(questionState)}
            </section>
            <div className='buttonContainer'>
                <div className='buttonGrp'>
                {hasGroupId && ( <Button variant="contained"  onClick={handleTeamRedirect}>
                        <i className="fas fa-users" />
                    </Button>)}
                </div>
            </div>
        </section>
    );
};

export default QuestionView;
