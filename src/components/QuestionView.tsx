// import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import '../index.css';
import { selectQuestion, QuestionState } from '../features/game/gameSlice';
import { putAnswer } from '../features/game/gameMiddleware';
import { AppDispatch } from '../app/store'

const QuestionView = () => {
    const questionState = useSelector(selectQuestion);
    const navigate = useNavigate();
    const dispatch = useDispatch() as AppDispatch;
    const attempts: number[] = []

    const sendAttempt: React.MouseEventHandler<HTMLInputElement> = (event) => {
        attempts.push(+event.currentTarget.value)
        if (questionState && attempts.length >= questionState.solution.length) {
            dispatch(putAnswer({
                response: attempts,
                latency: 3_000
            }))
        }
    }

    function renderFeedback(success?: boolean) {
        if (success === true) {
            return (<label className="feedbackMsg">Felicitaciones! Reclama cada láminas con un click y sigue jugando!</label>)
        }
        if (success === false) {
            return (<label className="feedbackMsg">Te equivocaste pero sigue intentándolo!</label>)
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
                        onClick={sendAttempt} />
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
            </div>
        </section>
    );
};

export default QuestionView;
