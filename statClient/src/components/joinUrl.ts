/**
 * URL que escanea el público. Por defecto, el origen de esta misma app (el juego está en `/`);
 * `?join=https://...` la sustituye (p. ej. si el presentador entra por una dirección interna).
 * Solo se acepta http(s): cualquier otra cosa se ignora.
 */
export function resolveJoinUrl(search: string, origin: string): string {
  try {
    const custom = new URLSearchParams(search).get('join');
    if (custom) {
      const u = new URL(custom);
      if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
    }
  } catch {
    /* URL inválida: se usa la de por defecto */
  }
  return `${origin}/`;
}
