// import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import '../index.css';
import { selectQuestion, QuestionState } from '../features/game/gameSlice';
import { putAnswer, nextQuestion } from '../features/game/gameMiddleware';
import { AppDispatch } from '../app/store'

const QuestionView = () => {
    const questionState = useSelector(selectQuestion);
    const navigate = useNavigate();
    const dispatch = useDispatch() as AppDispatch;
    let optCount = questionState?.options.length || 4
    const [checkedState, setCheckedState] = useState(
        new Array(optCount).fill(false)
    );

    const sendAttempt: React.ChangeEventHandler<HTMLInputElement> = (event) => {
        // debugger
        let position = +event.currentTarget.value;
        const newOptState = checkedState.map((item, index) =>
          index === position ? !item : item
        );
        setCheckedState(newOptState);
        let attempts = newOptState.reduce((cnt,chk)=> chk? cnt + 1: cnt, 0)
        if (questionState && attempts >= questionState.solution.length) {
            let response = newOptState.map((b, i) =>  b? i :null ).filter(i=>i!==null) as number[];
            dispatch(putAnswer({
                response: response,
                latency: 3_000
            }))
            setCheckedState(new Array(optCount).fill(false))
        }
    }

    function handleNewQuestion() {
        console.log("handleNewQuestion",optCount, checkedState)
        dispatch(nextQuestion())
    }

    function renderFeedback(success?: boolean) {
        if (success === true) {
            return (<label className="feedbackMsg">Felicitaciones! Reclama cada láminas con un click y sigue jugando!</label>)
        }
        if (success === false) {
            return (<label className="feedbackMsg">Lo lamento, pero sigue intentándolo!</label>)
        }
        return null
    }

    function getFeedbackClass(index: number, solution: number[], wrong?: number[], success?: boolean) {
        if (success === undefined) return "";
        if (solution.includes(index)) return "correct";
        if (wrong && wrong.includes(index)) return "wrong";
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
                        checked={checkedState[i]}
                        onChange={sendAttempt} />
                    {option}
                </label>)}
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
                {questionState?.success !== undefined && <input type="button" className="navBtn" value="Más láminas" onClick={handleNewQuestion}></input>}
            </div>
        </section>
    );
};

export default QuestionView;
