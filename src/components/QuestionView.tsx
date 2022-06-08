// import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import '../index.css';
import { selectQuestion, QuestionState } from '../features/game/gameSlice';
import { putAnswer, nextQuestion } from '../features/game/gameMiddleware';
import { AppDispatch } from '../app/store'

const QuestionView = () => {
    const questionState = useSelector(selectQuestion);
    const navigate = useNavigate();
    const dispatch = useDispatch() as AppDispatch;
    let timeLimit = Math.floor((questionState?.difficulty || 0.5) * 2.5 + 10)

    const [timer, setTimer] = useState(timeLimit)
    let interval: NodeJS.Timer;
    useEffect(() => {
        if (questionState?.success === undefined) {
            if (timer === 0) {
                dispatch(putAnswer({
                    response: [],
                    latency: timeLimit - timer
                }))
                setOptState(new Array(optCount).fill(false))
                setTimer(timeLimit)
            }
            else if (timer > 0) {
                interval = setInterval(() => setTimer(timer - 1), 1000);
            };
        }
        return () => interval && clearInterval(interval);
    });


    let optCount = questionState?.options.length || 4
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
        console.log("handleNewQuestion", optCount, optState)
        setTimer(timeLimit)
        dispatch(nextQuestion())
    }

    function renderFeedback(success?: boolean) {
        if (success === true) {
            return (<label className="feedbackMsg">FELICITACIONES! Reclama cada lámina con un click y sigue jugando!</label>)
        }
        if (success === false) {
            return (<div>
                {questionState?.feedback && <p className="feedbackMsg">{questionState.feedback}</p>}
                <p className="feedbackMsg">Lo lamento, pero sigue intentándolo!</p>
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

        const { question, options, success, solution, wrong } = questionState
        return (<div className='questionFrame' >
            <h3>{question}</h3>
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
                <div id="seconds">{timer}<span>Segundos</span></div>
            </div>}
            {renderFeedback(success)}
        </div>);
    }

    return (
        <section className="pageContainer">
            <section className="preguntasContainer" data-testid="container-a">
                {renderQuestion(questionState)}
            </section>
            <div className='buttonContainer'>
                <input type="button" className="navBtn" value="Volver" onClick={() => navigate("/")}></input>
                {questionState?.success !== undefined && <input type="button" className="navBtn" value="Ganar láminas" onClick={handleNewQuestion}></input>}
            </div>
        </section>
    );
};

export default QuestionView;
