import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import reportWebVitals from './reportWebVitals';

import { store } from './app/store';
import App from './App';
import './index.css';
import './i18n';

const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
    <React.StrictMode>
        <GoogleReCaptchaProvider reCaptchaKey="6LcyfW0gAAAAAG83fUNaYUF8X-x87Cg-Af5RPhnM">
            <Provider store={store}>
                <App />
            </Provider>
        </GoogleReCaptchaProvider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
