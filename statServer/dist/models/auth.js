"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginLimiter = exports.verifyToken = exports.issueToken = exports.checkCredentials = exports.safeEqual = exports.loadAuthConfig = void 0;
const crypto_1 = __importDefault(require("crypto"));
const MIN_SECRET_LENGTH = 32;
/** Lee la configuración; lanza si falta algo, para no arrancar un panel abierto. */
function loadAuthConfig(env = process.env) {
    var _a;
    const { STATS_USER, STATS_PASSWORD, STATS_TOKEN_SECRET } = env;
    if (!STATS_USER || !STATS_PASSWORD) {
        throw new Error("Faltan STATS_USER y/o STATS_PASSWORD: el panel no arranca sin credenciales.");
    }
    if (!STATS_TOKEN_SECRET || STATS_TOKEN_SECRET.length < MIN_SECRET_LENGTH) {
        throw new Error(`STATS_TOKEN_SECRET debe tener al menos ${MIN_SECRET_LENGTH} caracteres.`);
    }
    const hours = Number((_a = env.STATS_TOKEN_TTL_HOURS) !== null && _a !== void 0 ? _a : 8);
    return {
        user: STATS_USER,
        password: STATS_PASSWORD,
        secret: STATS_TOKEN_SECRET,
        ttlMs: (Number.isFinite(hours) && hours > 0 ? hours : 8) * 3600 * 1000,
    };
}
exports.loadAuthConfig = loadAuthConfig;
/** Comparación en tiempo constante (hash previo para igualar longitudes). */
function safeEqual(a, b) {
    const ha = crypto_1.default.createHash("sha256").update(a).digest();
    const hb = crypto_1.default.createHash("sha256").update(b).digest();
    return crypto_1.default.timingSafeEqual(ha, hb);
}
exports.safeEqual = safeEqual;
function checkCredentials(cfg, user, password) {
    if (typeof user !== "string" || typeof password !== "string")
        return false;
    // Se evalúan ambos para no revelar cuál falló por tiempo.
    const okUser = safeEqual(user, cfg.user);
    const okPass = safeEqual(password, cfg.password);
    return okUser && okPass;
}
exports.checkCredentials = checkCredentials;
function sign(secret, payload) {
    return crypto_1.default.createHmac("sha256", secret).update(payload).digest("base64url");
}
function issueToken(cfg, now = Date.now()) {
    const expiresAt = now + cfg.ttlMs;
    const payload = Buffer.from(JSON.stringify({ sub: cfg.user, exp: expiresAt })).toString("base64url");
    return { token: `${payload}.${sign(cfg.secret, payload)}`, expiresAt };
}
exports.issueToken = issueToken;
/** Devuelve el usuario si el token es válido y no ha vencido; si no, null. */
function verifyToken(cfg, token, now = Date.now()) {
    if (!token)
        return null;
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra !== undefined)
        return null;
    if (!safeEqual(signature, sign(cfg.secret, payload)))
        return null;
    try {
        const { sub, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        if (typeof sub !== "string" || typeof exp !== "number" || exp <= now)
            return null;
        return sub;
    }
    catch (_a) {
        return null;
    }
}
exports.verifyToken = verifyToken;
/** Limitador de intentos fallidos por clave (IP): MAX en la ventana → bloqueo hasta que expire. */
class LoginLimiter {
    constructor(max = 5, windowMs = 15 * 60 * 1000) {
        this.max = max;
        this.windowMs = windowMs;
        this.fails = new Map();
    }
    retryAfterMs(key, now = Date.now()) {
        const e = this.fails.get(key);
        if (!e)
            return 0;
        if (now - e.first >= this.windowMs) {
            this.fails.delete(key);
            return 0;
        }
        return e.count >= this.max ? this.windowMs - (now - e.first) : 0;
    }
    fail(key, now = Date.now()) {
        const e = this.fails.get(key);
        if (!e || now - e.first >= this.windowMs)
            this.fails.set(key, { count: 1, first: now });
        else
            e.count++;
    }
    success(key) {
        this.fails.delete(key);
    }
}
exports.LoginLimiter = LoginLimiter;
//# sourceMappingURL=auth.js.map