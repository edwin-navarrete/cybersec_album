import crypto from "crypto";

/**
 * Autenticación simple para el panel de estadísticas.
 * - Credenciales de administrador en variables de entorno (STATS_USER, STATS_PASSWORD).
 * - Token firmado con HMAC-SHA256 (formato `payload.firma`, payload = base64url JSON {sub, exp}).
 */

export interface AuthConfig {
  user: string;
  password: string;
  secret: string;
  ttlMs: number;
}

const MIN_SECRET_LENGTH = 32;

/** Lee la configuración; lanza si falta algo, para no arrancar un panel abierto. */
export function loadAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const { STATS_USER, STATS_PASSWORD, STATS_TOKEN_SECRET } = env;
  if (!STATS_USER || !STATS_PASSWORD) {
    throw new Error("Faltan STATS_USER y/o STATS_PASSWORD: el panel no arranca sin credenciales.");
  }
  if (!STATS_TOKEN_SECRET || STATS_TOKEN_SECRET.length < MIN_SECRET_LENGTH) {
    throw new Error(`STATS_TOKEN_SECRET debe tener al menos ${MIN_SECRET_LENGTH} caracteres.`);
  }
  const hours = Number(env.STATS_TOKEN_TTL_HOURS ?? 8);
  return {
    user: STATS_USER,
    password: STATS_PASSWORD,
    secret: STATS_TOKEN_SECRET,
    ttlMs: (Number.isFinite(hours) && hours > 0 ? hours : 8) * 3600 * 1000,
  };
}

/** Comparación en tiempo constante (hash previo para igualar longitudes). */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkCredentials(cfg: AuthConfig, user: unknown, password: unknown): boolean {
  if (typeof user !== "string" || typeof password !== "string") return false;
  // Se evalúan ambos para no revelar cuál falló por tiempo.
  const okUser = safeEqual(user, cfg.user);
  const okPass = safeEqual(password, cfg.password);
  return okUser && okPass;
}

function sign(secret: string, payload: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function issueToken(cfg: AuthConfig, now = Date.now()): { token: string; expiresAt: number } {
  const expiresAt = now + cfg.ttlMs;
  const payload = Buffer.from(JSON.stringify({ sub: cfg.user, exp: expiresAt })).toString("base64url");
  return { token: `${payload}.${sign(cfg.secret, payload)}`, expiresAt };
}

/** Devuelve el usuario si el token es válido y no ha vencido; si no, null. */
export function verifyToken(cfg: AuthConfig, token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  if (!safeEqual(signature, sign(cfg.secret, payload))) return null;
  try {
    const { sub, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof sub !== "string" || typeof exp !== "number" || exp <= now) return null;
    return sub;
  } catch {
    return null;
  }
}

/** Limitador de intentos fallidos por clave (IP): MAX en la ventana → bloqueo hasta que expire. */
export class LoginLimiter {
  private fails = new Map<string, { count: number; first: number }>();
  constructor(private max = 5, private windowMs = 15 * 60 * 1000) {}

  retryAfterMs(key: string, now = Date.now()): number {
    const e = this.fails.get(key);
    if (!e) return 0;
    if (now - e.first >= this.windowMs) {
      this.fails.delete(key);
      return 0;
    }
    return e.count >= this.max ? this.windowMs - (now - e.first) : 0;
  }

  fail(key: string, now = Date.now()) {
    const e = this.fails.get(key);
    if (!e || now - e.first >= this.windowMs) this.fails.set(key, { count: 1, first: now });
    else e.count++;
  }

  success(key: string) {
    this.fails.delete(key);
  }
}
