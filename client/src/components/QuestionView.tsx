// import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import '../index.css';
import { selectQuestion, selectUnclaimed, QuestionState } from '../features/game/gameSlice';
import { putAnswer, nextQuestion } from '../features/game/gameMiddleware';

import { AppDispatch } from '../app/store'
import Button from '@mui/material/Button';

const QuestionView = () => {
    const questionState = useSelector(selectQuestion);
    const unclaimed = useSelector(selectUnclaimed);
    const navigate = useNavigate();
    const dispatch = useDispatch() as AppDispatch;
    const { t } = useTranslation(); // i18n

    let timeLimit = Math.floor((questionState?.difficulty || 0.5) * 15 + 6)
    let optCount = questionState?.options.length || 4;

    const [timer, setTimer] = useState(-1)
    useEffect(() => {
        let interval: NodeJS.Timer;
        if (questionState?.success === undefined) {
            if (timer === 0) {
                dispatch(putAnswer({
                    response: [],
                    latency: timeLimit - timer
                }))
                setOptState(new Array(optCount).fill(false))
                setTimer(timeLimit)
            }
            else if (timer > 0) interval = setInterval(() => setTimer(timer - 1), 1000);
            else if (timer === -1) setTimer(timeLimit);
        }
        return () => interval && clearInterval(interval);
    }, [questionState?.success, timer, timeLimit, dispatch, optCount]);


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
                latency: timeLimit - timer
            }))
            setOptState(new Array(optCount).fill(false))
        }
    }

    function handleNewQuestion() {
        setTimer(-1)
        dispatch(nextQuestion())
    }

    function renderFeedback(success?: boolean) {
        if (success === true) {
            return (<div className="feedbackFrame">
                <label className="feedbackMsg">{t("quiz.success")}</label>
                <p className="rewardMsg">{t("quiz.reward", { number: unclaimed })}</p>
            </div>)
        }
        if (success === false) {
            return (<div>
                {questionState?.feedback && <p className="feedbackMsg">{questionState.feedback}</p>}
                <p className="feedbackMsg">{t("quiz.fail")}</p>


            </div>)
        }
        return null
    }

    function getFeedbackClass(index: number, solution: number[], wrong?: number[], success?: boolean) {
        if (success === undefined) return "questionOption";
        if (solution.includes(index)) return "questionOption correct";
        if (wrong && wrong.includes(index)) return "questionOption wrong";
        return "questionOption";
    }

    function renderQuestion(questionState?: QuestionState) {
        if (!questionState) return (<div className='questionFrame' />);

        const { id, question, options, success, solution, wrong } = questionState
        return (<div className='questionFrame' >
            <h3>{id}:{question}</h3>
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
                <Button variant="contained" onClick={() => navigate("/")}>{t("button.back")}</Button>
                {questionState?.success !== undefined && <Button variant="contained" onClick={handleNewQuestion}>{t("button.earn")}</Button>}
            </div>
        </section>
    );
};

export default QuestionView;
