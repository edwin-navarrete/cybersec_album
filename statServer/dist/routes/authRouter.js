"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../models/auth");
const requireAuth_1 = require("../middleware/requireAuth");
function createAuthRouter(cfg) {
    const router = express_1.default.Router();
    const limiter = new auth_1.LoginLimiter();
    router.post("/login", (req, res) => {
        var _a, _b;
        const key = (_a = req.ip) !== null && _a !== void 0 ? _a : "unknown";
        const wait = limiter.retryAfterMs(key);
        if (wait > 0) {
            res.set("Retry-After", String(Math.ceil(wait / 1000)));
            return res.status(429).json({ errorMessage: "Demasiados intentos. Intenta más tarde." });
        }
        const { user, password } = (_b = req.body) !== null && _b !== void 0 ? _b : {};
        if (!(0, auth_1.checkCredentials)(cfg, user, password)) {
            limiter.fail(key);
            return res.status(401).json({ errorMessage: "Usuario o contraseña incorrectos" });
        }
        limiter.success(key);
        const { token, expiresAt } = (0, auth_1.issueToken)(cfg);
        res.status(200).json({ token, expiresAt, user: cfg.user });
    });
    // Permite al cliente validar su token guardado al abrir la app.
    router.get("/me", (0, requireAuth_1.requireAuth)(cfg), (_req, res) => {
        res.status(200).json({ user: res.locals.user });
    });
    return router;
}
exports.createAuthRouter = createAuthRouter;
//# sourceMappingURL=authRouter.js.map