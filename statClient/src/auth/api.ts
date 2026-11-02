import axios from 'axios';

export const baseURL = process.env.REACT_APP_API_URL || 'https://4ssoluciones.com/album_stats';

const KEY = 'stats:session';

export interface Session {
  token: string;
  expiresAt: number;
  user: string;
}

/** La sesión vive en sessionStorage: se pierde al cerrar la pestaña (panel de administración). */
export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s.token && s.expiresAt > Date.now() ? s : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session | null) {
  try {
    if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* sin storage: la sesión dura lo que dure la página */
  }
}

let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const s = loadSession();
  if (s) config.headers.set('Authorization', `Bearer ${s.token}`);
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    // Token vencido o inválido en una ruta protegida (el login mismo responde 401 por credenciales).
    if (error.response?.status === 401 && !String(error.config?.url).includes('/auth/login')) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export function errorText(error: unknown): string {
  const e = error as any;
  if (e?.response?.data?.errorMessage) return e.response.data.errorMessage;
  if (e?.response) return `Error del servidor (${e.response.status})`;
  return 'No se pudo conectar con el servidor';
}
