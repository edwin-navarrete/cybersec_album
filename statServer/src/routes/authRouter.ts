import express, { Request, Response } from "express";
import { AuthConfig, checkCredentials, issueToken, LoginLimiter } from "../models/auth";
import { requireAuth } from "../middleware/requireAuth";

export function createAuthRouter(cfg: AuthConfig) {
  const router = express.Router();
  const limiter = new LoginLimiter();

  router.post("/login", (req: Request, res: Response) => {
    const key = req.ip ?? "unknown";
    const wait = limiter.retryAfterMs(key);
    if (wait > 0) {
      res.set("Retry-After", String(Math.ceil(wait / 1000)));
      return res.status(429).json({ errorMessage: "Demasiados intentos. Intenta más tarde." });
    }
    const { user, password } = req.body ?? {};
    if (!checkCredentials(cfg, user, password)) {
      limiter.fail(key);
      return res.status(401).json({ errorMessage: "Usuario o contraseña incorrectos" });
    }
    limiter.success(key);
    const { token, expiresAt } = issueToken(cfg);
    res.status(200).json({ token, expiresAt, user: cfg.user });
  });

  // Permite al cliente validar su token guardado al abrir la app.
  router.get("/me", requireAuth(cfg), (_req, res) => {
    res.status(200).json({ user: res.locals.user });
  });

  return router;
}
