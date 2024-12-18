import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
    en: {
        translation: {
            "album.title": "4S CyberAlbum",
            "welcome.hdr":"Hey, get ready for action!",
            "welcome.txt":"Please register before starting.",
            "gameMode.solo":"Solo",
            "gameMode.coop":"Cooperative",
            "gameMode.label":"Choose the game mode:",
            "button.earn": "Earn Stickers",
            "button.team": "Team Game",
            "button.register": "Register",
            "button.continue": "Continue",
            "hint.register": "Enter your name",
            "timer.secs": "Seconds",
            "quiz.notLeader": "Sorry, only the leader can play, wait four you to be chosen.",
            "quiz.playDisabled":"Your next turn will be enabled on {{timeDesc}}.",
            "quiz.leaderHint":"Or also you could choose a new leader with the button: ",
            "quiz.multipleWrn": "(Select more than one answer)",
            "quiz.fail": "I'm sorry, but keep trying!",
            "quiz.success": "CONGRATULATIONS! Claim each sticker with a click and continue playing!",
            "quiz.completed": "YOU DID IT! Register and enjoy your completed album",
            "quiz.reward": "Now you have $t(stickers, {\"count\": {{number}} }) to claim.",
            "stickers_one": "{{count}} sticker",
            "stickers_other": "{{count}} stickers",
            "introMsg": "Hi! would you help me to fill the album? start down here!",
            "dupName.err": "Name is already taken. Please choose a different one.",
            "emptyName.err":"The name cannot be empty.",
            "registration.err": "Ocurrió un error al registrar el jugador. Inténtalo más tarde.",
            "nextLeader.hdr": "Choose a successor:",
            "dueLeader.hdr": "Choose a successor within {{dueLeader}}...",
        }
    },
    es: {
        translation: {
            "album.title": "CiberAlbum 4S",
            "welcome.hdr":"¡Oye, prepárate para la acción!",
            "welcome.txt":"Por favor, regístrate antes de comenzar.",
            "gameMode.solo":"Invidivual",
            "gameMode.coop":"Cooperativo",
            "gameMode.label":"Elige el modo de juego:",
            "button.earn": "Ganar Láminas",
            "button.team": "Juego en Equipo",
            "button.register": "Registrarse",
            "button.continue": "Continuar",
            "hint.register": "Ingresa tu nombre",
            "timer.secs": "Segundos",
            "quiz.notLeader": "Lo siento, sólo el líder puede jugar, espera a que seas elegido.",
            "quiz.leaderHint":"O también podrías elegir un nuevo líder con el botón: ",
            "quiz.playDisabled":"Tu siguiente turno se habilita el {{timeDesc}}.",
            "quiz.multipleWrn": "(Escoge más de una respuesta)",
            "quiz.fail": "Lo lamento, pero sigue intentándolo!",
            "quiz.success": "FELICITACIONES! Reclama cada lámina con un click y sigue jugando!",
            "quiz.completed": "LO LOGRASTE! Regístrate y disfruta tu álbum completado.",
            "quiz.reward": "Ahora tienes $t(stickers, {\"count\": {{number}} }) por reclamar.",
            "stickers_one": "{{count}} lámina",
            "stickers_other": "{{count}} láminas",
            "introMsg": "Hola! me ayudarías a llenar el album? empieza aquí abajo!",
            "dupName.err": "El nombre ya está en uso. Por favor, elige otro.",
            "emptyName.err":"El nombre no puede estar vacío.",
            "registration.err": "Ocurrió un error al registrar el jugador. Inténtalo más tarde.",
            "nextLeader.hdr": "Elije a un sucesor:",
            "dueLeader.hdr": "Elije a successor dentro de {{dueLeader}}...",
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
