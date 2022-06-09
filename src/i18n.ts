import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
    en: {
        translation: {
            "album.title": "4S Didactic Security",
            "button.earn": "Earn Stickers",
            "button.back": "Go back",
            "timer.secs": "Seconds",
            "quiz.fail": "I'm sorry, but keep trying!",
            "quiz.success": "CONGRATULATIONS! Claim each sheet with a click and continue playing!"
        }
    },
    es: {
        translation: {
            "album.title": "4S Seguridad Didáctica",
            "button.earn": "Ganar Láminas",
            "button.back": "Volver",
            "timer.secs": "Segundos",
            "quiz.fail": "Lo lamento, pero sigue intentándolo!",
            "quiz.success": "FELICITACIONES! Reclama cada lámina con un click y sigue jugando!"
        }
    }
};

i18n
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
        resources,
        lng: "es", // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
        // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
        // if you're using a language detector, do not define the lng option

        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;
