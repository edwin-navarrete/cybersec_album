import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import reportWebVitals from './reportWebVitals';

import { store } from './app/store';
import App from './App';
import './index.css';
import './i18n';
import { savedLanguage } from './i18n';
import { changeLanguage, fetchConfig } from './features/game/gameMiddleware';

const container = document.getElementById('root')!;
const root = createRoot(container);
const captchaKey = process.env.CAPTCHAKEY;

store.dispatch(fetchConfig());

// Stickers are bundled per language, so switch them when the player chose a non-default one
if (savedLanguage() !== 'es') {
  store.dispatch(changeLanguage(savedLanguage()));
}

root.render(
  <React.StrictMode>
    {captchaKey ? (
      <GoogleReCaptchaProvider reCaptchaKey={captchaKey}>
        <Provider store={store}>
          <App />
        </Provider>
      </GoogleReCaptchaProvider>
    ) : (
      <Provider store={store}>
        <App />
      </Provider>
    )}
  </React.StrictMode>
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
