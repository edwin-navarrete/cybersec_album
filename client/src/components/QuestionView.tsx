// import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {  GoogleReCaptcha } from 'react-google-recaptcha-v3';

import '../index.css';
import { selectQuestion, selectUnclaimed, selectAchievement, selectStickers, selectStickerSpots, updateToken, QuestionState } from '../features/game/gameSlice';
import { announcesNextPanel, nextSpot, stripsToShow, completedStrips } from '../features/game/strips';
import { timeLimitFor, netLatencyMs } from '../features/game/questionTime';
import StripView from './StripView';
import { putAnswer, nextQuestion, getPlayTokenFactory } from '../features/game/gameMiddleware';

import { AppDispatch, RootState } from '../app/store'
import Button from '@mui/material/Button';

const QuestionView = () => {
    const questionState = useSelector(selectQuestion);
    const unclaimed = useSelector(selectUnclaimed);
    const achievement = useSelector((state: RootState) => selectAchievement(state, true));
    const stickers = useSelector(selectStickers);
    const spots = useSelector(selectStickerSpots);
    // Panel this question is for: fixed while answering so the reveal shows in place
    const targetPanel = useRef<string | undefined>(undefined);
    if (questionState?.success === undefined) targetPanel.current = nextSpot(spots, stickers);
    // Strips shown while this question lasts: one that appeared (it had something to claim)
    // stays after its stickers are claimed, until the next question
    const shownStrips = useRef<number[]>([]);
    const shownFor = useRef<number | undefined>(undefined);
    if (questionState?.id !== shownFor.current) {
        shownFor.current = questionState?.id;
        shownStrips.current = [];
    }
    if (targetPanel.current) {
        shownStrips.current = Array.from(new Set([...shownStrips.current, ...stripsToShow(spots, stickers, targetPanel.current)]))
            .sort((a, b) => a - b);
    }
    // Strips completed (every panel claimed) when the question started, to know if this
    // question finished one: that is the moment to go and see the album
    const completedAtStart = useRef(0);
    const doneStrips = announcesNextPanel() ? completedStrips(spots, stickers) : [];
    if (questionState?.success === undefined) completedAtStart.current = doneStrips.length;
    const justCompleted = questionState?.success !== undefined && doneStrips.length > completedAtStart.current
        ? doneStrips[doneStrips.length - 1] : undefined;
    const [bannerStrip, setBannerStrip] = useState<number | null>(null);
    useEffect(() => { if (justCompleted !== undefined) setBannerStrip(justCompleted) }, [justCompleted]);
    useEffect(() => {
        if (bannerStrip === null) return;
        const id = setTimeout(() => setBannerStrip(null), 3000);
        return () => clearTimeout(id);
    }, [bannerStrip]);

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

    // Reading plus thinking time; the latency kept is the time taken minus the reading
    const timeLimit = questionState ? timeLimitFor(questionState) : 0
    const latencySince = (started: number) => questionState ? netLatencyMs(Date.now() - started, questionState) : 0
    let optCount = questionState?.options.length || 4;

    const [timer, setTimer] = useState(-1)
    const [timestamp, setTimestamp] = useState(-1)

    // go to album if answered enough to fill the album
    useEffect(() => { achievement && navigate("/album") })
    useEffect(() => {
        let interval: NodeJS.Timer;
        // The clock starts when there is a question to read, not before
        if (questionState && questionState.success === undefined) {
            if (timer === 0) {
                dispatch(putAnswer({
                    response: [],
                    latency: latencySince(timestamp)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questionState?.success, timer, timeLimit, dispatch, optCount, timestamp]);


    const [optState, setOptState] = useState(
        new Array(optCount).fill(false)
    );
    const [loadingNext, setLoadingNext] = useState(false);

    // The same view serves one question after another: each one starts from scratch
    useEffect(() => {
        setTimer(-1)
        setOptState(new Array(optCount).fill(false))
        setLoadingNext(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questionState?.id]);

    // Next question without going back to the album
    function handleNext() {
        setLoadingNext(true)
        dispatch(nextQuestion()).then(() => setLoadingNext(false))
    }

    const sendAttempt: React.ChangeEventHandler<HTMLInputElement> = (event) => {
        let position = +event.currentTarget.value;
        const newOptState = optState.map((b, i) => i === position ? !b : b);
        setOptState(newOptState);
        let attempts = newOptState.reduce((cnt, chk) => chk ? cnt + 1 : cnt, 0)
        if (questionState && attempts >= questionState.solution.length) {
            let response = newOptState.map((b, i) => b ? i : null).filter(i => i !== null) as number[];
            dispatch(putAnswer({
                response: response,
                latency: latencySince(timestamp)
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
            {announcesNextPanel() && targetPanel.current &&
                shownStrips.current.map(strip =>
                    <StripView key={strip} strip={strip} spots={spots} stickers={stickers} target={targetPanel.current!} />)}
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

    const answered = questionState?.success !== undefined;

    return (
        <section className="pageContainer">
            <section className="questionContainer" data-testid="container-a">
                {renderQuestion(questionState)}
            </section>
            {bannerStrip !== null && <div className="stripBanner" role="status">{t("strip.complete", { strip: bannerStrip })}</div>}
            <div className='buttonContainer'>
                {answered && justCompleted === undefined && unclaimed > 0 &&
                    <p className="stripCaption">{t("quiz.claimFirst")}</p>}
                <div className='buttonGrp'>
                {answered && (justCompleted !== undefined
                    // a strip was finished: that is the moment to see the album
                    ? <Button variant="contained" onClick={() => navigate("/album")}>{t("button.album")}</Button>
                    // otherwise keep going, once what was won is claimed
                    : <Button variant="contained" disabled={unclaimed > 0 || loadingNext} onClick={handleNext}>{t("button.earn")}</Button>)}
                {hasGroupId && ( <Button variant="contained"  onClick={handleTeamRedirect}>
                        <i className="fas fa-users" />
                    </Button>)}
                </div>
            </div>
        </section>
    );
};

export default QuestionView;
