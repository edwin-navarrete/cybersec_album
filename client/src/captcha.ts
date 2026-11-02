/*
    The public key of the site for reCAPTCHA, given when the client is built:

        REACT_APP_CAPTCHAKEY=<site key>

    Create React App only hands to the browser the variables that start with REACT_APP_: a
    variable with any other name (the code used to read CAPTCHAKEY) is always undefined.

    Without a key there is no captcha: that is how it is developed. A server that has
    CAPTCHA_SECRET asks for the token of every request, so the client of such a server
    must be built with the key.
*/
export function getCaptchaKey(): string | undefined {
    return process.env.REACT_APP_CAPTCHAKEY || undefined
}
