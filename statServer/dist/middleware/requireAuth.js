"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const auth_1 = require("../models/auth");
function requireAuth(cfg) {
    return (req, res, next) => {
        var _a;
        const header = (_a = req.headers.authorization) !== null && _a !== void 0 ? _a : "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : undefined;
        const user = (0, auth_1.verifyToken)(cfg, token);
        if (!user)
            return res.status(401).json({ errorMessage: "No autorizado" });
        res.locals.user = user;
        next();
    };
}
exports.requireAuth = requireAuth;
//# sourceMappingURL=requireAuth.js.map