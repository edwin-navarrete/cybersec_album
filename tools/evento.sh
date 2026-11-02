#!/usr/bin/env bash
# Ciclo de vida de una app de evento en Heroku: juego + estadísticas en una sola URL.
#
#   tools/evento.sh crear    <app> [opciones]   crea la app, la BD, el esquema y despliega
#   tools/evento.sh exportar <app> [opciones]   baja los CSV (y un respaldo de la BD) a eventos/<app>-<fecha>/
#   tools/evento.sh destruir <app> [opciones]   exporta, pide confirmación y destruye la app (y su BD)
#   tools/evento.sh estado   <app>              URLs, dynos y add-ons
#
# Opciones de `crear`:
#   --set <nombre>       set de preguntas (QUESTION_SET), por defecto "default"
#   --mode solo|coop|both  modo de juego (GAME_MODE), por defecto "both"
#   --dyno <tipo>        tipo de dyno web, por defecto "basic" (eco se duerme: no sirve en un evento)
#   --db-plan <plan>     plan de JawsDB MySQL, por defecto "kitefin" (gratis, 5 MB y 10 conexiones;
#                        mira `heroku addons:plans jawsdb` y usa uno de pago para eventos grandes)
#   --ref <git-ref>      qué desplegar, por defecto "main"
#   --user <u> --password <p>   credenciales del panel; si no, usuario "presentador" y clave al azar
# Opciones de `exportar`:
#   --dir <carpeta>      destino (por defecto eventos/<app>-<fecha>)
#   --url <https://..> --user <u> --password <p>   exportar de un servidor que no sea Heroku
#   (con DB_URL=mysql://... en el entorno también respalda la BD en ese caso)
# Opciones de `destruir`:
#   --sin-exportar       no exportar antes (se pierden los datos)      --yes   no pedir confirmación
# Generales:
#   --dry-run            solo muestra lo que haría, sin tocar nada
#
# Requiere: heroku (con sesión iniciada), git, node, openssl, curl y el cliente mysql/mysqldump.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DRY=0
say() { printf '%s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
step() { printf '\n==> %s\n' "$*"; }

# Ejecuta (o, con --dry-run, solo muestra) un comando.
run() { printf '+ %s\n' "$*"; [ "$DRY" = 1 ] || "$@"; }
# Igual, pero devuelve su salida; en --dry-run devuelve el valor de ejemplo ($FAKE).
val() { local fake="$1"; shift; if [ "$DRY" = 1 ]; then printf '+ %s\n' "$*" >&2; printf '%s' "$fake"; else "$@"; fi; }

need() { for c in "$@"; do command -v "$c" >/dev/null 2>&1 || { [ "$DRY" = 1 ] && say "(dry-run) falta '$c'" || die "falta '$c' en el PATH"; }; done; }

usage() { sed -n '2,31p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

# --- valores por defecto y lectura de opciones -------------------------------------------
CMD="${1:-}"; [ -n "$CMD" ] || usage 1
[ "$CMD" = "-h" ] || [ "$CMD" = "--help" ] && usage 0
APP="${2:-}"; [ -n "$APP" ] || die "falta el nombre de la app (ver --help)"
shift 2 || true
SET=default MODE=both DYNO=basic DBPLAN=kitefin REF=main
USER_ARG="" PASS_ARG="" OUT_DIR="" URL_ARG="" EXPORT=1 YES=0
while [ $# -gt 0 ]; do
  case "$1" in
    --set) SET="$2"; shift 2;;
    --mode) MODE="$2"; shift 2;;
    --dyno) DYNO="$2"; shift 2;;
    --db-plan) DBPLAN="$2"; shift 2;;
    --ref) REF="$2"; shift 2;;
    --user) USER_ARG="$2"; shift 2;;
    --password) PASS_ARG="$2"; shift 2;;
    --dir) OUT_DIR="$2"; shift 2;;
    --url) URL_ARG="${2%/}"; shift 2;;
    --sin-exportar) EXPORT=0; shift;;
    --yes) YES=1; shift;;
    --dry-run) DRY=1; shift;;
    -h|--help) usage 0;;
    *) die "opción desconocida: $1";;
  esac
done

# Heroku: 3 a 30 caracteres, minúsculas, números y guiones, empieza por letra.
[[ "$APP" =~ ^[a-z][a-z0-9-]{2,29}$ ]] || die "nombre de app inválido '$APP' (3-30 caracteres: minúsculas, números y guiones; empieza por letra)"
[[ "$SET" =~ ^[A-Za-z0-9_.-]{1,50}$ ]] || die "set de preguntas inválido '$SET'"
case "$MODE" in solo|coop|both) ;; *) die "--mode debe ser solo, coop o both";; esac

# Divide una URL de BD en HOST/PORT/USER/PASS/NAME (sin eval: una línea por valor).
parse_db_url() {
  { read -r DBH; read -r DBPORT; read -r DBU; read -r DBP; read -r DBN; } < <(
    DBURL="$1" node -e '
      const u = new URL(process.env.DBURL), d = (s) => { try { return decodeURIComponent(s) } catch { return s } };
      console.log([u.hostname, u.port || "3306", d(u.username), d(u.password), u.pathname.split("/")[1]].join("\n"))')
}

app_url() {
  if [ "$DRY" = 1 ]; then printf '+ heroku apps:info --json -a %s\n' "$APP" >&2; printf 'https://%s.herokuapp.com' "$APP"; return; fi
  heroku apps:info --json -a "$APP" | node -pe 'JSON.parse(require("fs").readFileSync(0)).app.web_url.replace(/\/$/, "")'
}

# mysql contra la BD del evento; la clave va por entorno, no por la línea de comandos.
db_mysql() { MYSQL_PWD="$DBP" mysql --default-character-set=utf8mb4 -h "$DBH" -P "$DBPORT" -u "$DBU" "$@"; }

# Inicia sesión en el panel y escribe el token. Usuario y clave viajan como JSON armado por node.
api_login() { # url usuario clave
  USERV="$2" PASSV="$3" node -e 'process.stdout.write(JSON.stringify({ user: process.env.USERV, password: process.env.PASSV }))' |
    curl -fsS --max-time 30 -X POST -H 'content-type: application/json' --data @- "$1/api/stats/auth/login" |
    node -pe 'JSON.parse(require("fs").readFileSync(0)).token' 2>/dev/null
}

# ============================== crear ======================================================
cmd_crear() {
  need heroku git node openssl curl mysql
  local sql_base="$ROOT/db_schema/ssolucio_cyberalbum.sql" sql_set=""
  [ -f "$sql_base" ] || die "no encuentro $sql_base"
  if [ "$SET" != "default" ]; then
    sql_set="$ROOT/db_schema/themes/${SET}_questions.sql"
    [ -f "$sql_set" ] || die "el set '$SET' necesita $sql_set (los sets distintos de 'default' traen su SQL de preguntas)"
  fi
  git -C "$ROOT" rev-parse --verify --quiet "$REF^{commit}" >/dev/null || die "no existe la referencia git '$REF'"
  [ "$DRY" = 1 ] || heroku auth:whoami >/dev/null 2>&1 || die "no hay sesión de Heroku: ejecuta 'heroku login'"

  local user="${USER_ARG:-presentador}" pass="${PASS_ARG:-}"
  [ -n "$pass" ] || pass="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-16)"
  local secret; secret="$(openssl rand -base64 48 | tr -d '\n')"
  local remote="heroku-$APP"

  step "1/7 Crear la app '$APP'"
  run heroku create "$APP" --remote "$remote"
  step "2/7 Base de datos (JawsDB MySQL, plan $DBPLAN)"
  run heroku addons:create "jawsdb:$DBPLAN" -a "$APP" --wait
  step "3/7 Variables de configuración"
  # La contraseña y el secreto pasan por la línea de comandos de esta máquina un instante.
  run heroku config:set -a "$APP" "STATS_USER=$user" "STATS_PASSWORD=$pass" "STATS_TOKEN_SECRET=$secret" \
      "GAME_MODE=$MODE" "QUESTION_SET=$SET"

  step "4/7 Cargar el esquema y las preguntas"
  local dburl; dburl="$(val 'mysql://user:pass@db.example.com:3306/dbname' heroku config:get JAWSDB_URL -a "$APP")"
  [ -n "$dburl" ] || die "la app no tiene JAWSDB_URL (¿falló el add-on?)"
  parse_db_url "$dburl"
  local tables=0
  [ "$DRY" = 1 ] || tables="$(db_mysql -N "$DBN" -e 'SHOW TABLES' | wc -l | tr -d ' ')"
  [ "$tables" = "0" ] || die "la BD ya tiene $tables tablas y el esquema hace DROP TABLE: no se carga"
  printf '+ mysql (%s@%s/%s) < %s\n' "$DBU" "$DBH" "$DBN" "${sql_base#$ROOT/}"
  [ "$DRY" = 1 ] || db_mysql "$DBN" < "$sql_base"
  if [ -n "$sql_set" ]; then
    printf '+ mysql (%s@%s/%s) < %s\n' "$DBU" "$DBH" "$DBN" "${sql_set#$ROOT/}"
    [ "$DRY" = 1 ] || db_mysql "$DBN" < "$sql_set"
  fi

  step "5/7 Desplegar '$REF' (construye juego, panel y servidor: tarda unos minutos)"
  run git -C "$ROOT" push "$remote" "$REF:main"
  step "6/7 Tipo de dyno: $DYNO"
  run heroku ps:type "web=$DYNO" -a "$APP"

  step "7/7 Comprobación"
  local url; url="$(app_url)"
  check() { # nombre ruta [curl...]
    local name="$1" path="$2"; shift 2
    local code; code="$(val 200 curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$@" "$url$path")"
    [ "$code" = "200" ] && say "  ok   $name ($path)" || { say "  FALLA $name ($path) → HTTP $code"; FAILED=1; }
  }
  FAILED=0
  check "juego" "/"
  check "configuración" "/api/config"
  check "preguntas" "/api/question?lang=es"
  check "panel de estadísticas" "/stats/"
  if [ "$DRY" = 1 ]; then say "  ok   login del panel (dry-run)"
  elif [ -n "$(api_login "$url" "$user" "$pass" 2>/dev/null)" ]; then say "  ok   login del panel"
  else say "  FALLA login del panel"; FAILED=1; fi

  say ""
  say "Evento listo: $APP"
  say "  Jugadores (compartir esta URL):  $url/"
  say "  Panel de estadísticas:           $url/stats/"
  say "  Pantalla del presentador:        $url/stats/presenter"
  say "  Usuario del panel:               $user"
  say "  Contraseña del panel:            $pass     <- guárdala: no se vuelve a mostrar"
  say "  Al terminar:                     tools/evento.sh destruir $APP"
  [ "$FAILED" = 0 ] || die "alguna comprobación falló: revisa 'heroku logs --tail -a $APP'"
}

# ============================== exportar ===================================================
cmd_exportar() {
  need curl node
  local url="$URL_ARG" user="$USER_ARG" pass="$PASS_ARG" dburl="${DB_URL:-}"
  if [ -z "$url" ]; then
    need heroku
    url="$(app_url)"
    user="$(val presentador heroku config:get STATS_USER -a "$APP")"
    pass="$(val secreto heroku config:get STATS_PASSWORD -a "$APP")"
    dburl="$(val '' heroku config:get JAWSDB_URL -a "$APP")"
  fi
  [ -n "$user" ] && [ -n "$pass" ] || die "faltan --user y --password (o que la app tenga STATS_USER/STATS_PASSWORD)"
  local dir="${OUT_DIR:-$ROOT/eventos/$APP-$(date +%Y%m%d-%H%M)}"

  step "Exportar $APP desde $url a ${dir#$ROOT/}"
  local token=faketoken
  if [ "$DRY" != 1 ]; then
    token="$(api_login "$url" "$user" "$pass")" && [ -n "$token" ] ||
      die "no se pudo iniciar sesión en $url/api/stats (¿usuario o clave incorrectos, o la app está apagada?)"
  else
    printf '+ POST %s/api/stats/auth/login\n' "$url"
  fi
  run mkdir -p "$dir"
  local f
  for f in "ranking.csv:export/ranking.csv" "desempeno-preguntas.csv:export/questions.csv"; do
    local file="${f%%:*}" path="${f#*:}"
    printf '+ GET %s/api/stats/%s -> %s\n' "$url" "$path" "$file"
    [ "$DRY" = 1 ] || curl -fsS --max-time 60 -H "Authorization: Bearer $token" -o "$dir/$file" "$url/api/stats/$path" \
      || die "falló la descarga de $path"
    [ "$DRY" = 1 ] || [ -s "$dir/$file" ] || die "$file quedó vacío"
  done
  if [ -n "$dburl" ] && command -v mysqldump >/dev/null 2>&1; then
    parse_db_url "$dburl"
    printf '+ mysqldump %s@%s/%s -> respaldo.sql\n' "$DBU" "$DBH" "$DBN"
    [ "$DRY" = 1 ] || MYSQL_PWD="$DBP" mysqldump --single-transaction --no-tablespaces -h "$DBH" -P "$DBPORT" -u "$DBU" "$DBN" > "$dir/respaldo.sql" \
      || die "falló el respaldo de la BD"
  else
    say "  (sin respaldo SQL: falta mysqldump o la URL de la BD)"
  fi
  say ""
  if [ "$DRY" = 1 ]; then say "(dry-run) no se descargó nada; se exportaría en $dir"; else
    say "Exportado en $dir"
    ls -l "$dir" | tail -n +2 | awk '{print "  " $5 " bytes  " $9}'
  fi
  say "Estos archivos tienen nombres de jugadores: no los subas al repositorio (eventos/ está en .gitignore)."
  EXPORT_DIR="$dir"
}

# ============================== destruir ===================================================
cmd_destruir() {
  need heroku
  if [ "$EXPORT" = 1 ]; then
    step "Antes de destruir: exportar los resultados"
    cmd_exportar
  else
    say "ATENCIÓN: --sin-exportar, los datos se perderán."
  fi
  if [ "$YES" != 1 ] && [ "$DRY" != 1 ]; then
    printf '\nEsto destruye la app "%s" y su base de datos. Escribe el nombre de la app para confirmar: ' "$APP"
    local answer; read -r answer
    [ "$answer" = "$APP" ] || die "no coincide, no se destruyó nada"
  fi
  step "Destruir '$APP'"
  run heroku apps:destroy -a "$APP" --confirm "$APP"
  if [ "$DRY" = 1 ]; then say "(dry-run) no se destruyó nada"; else say "Listo. Los resultados quedaron en ${EXPORT_DIR:-(no se exportó)}"; fi
}

# ============================== estado =====================================================
cmd_estado() {
  need heroku
  local url; url="$(app_url)"
  say "Jugadores:   $url/"
  say "Panel:        $url/stats/"
  say "Presentador:  $url/stats/presenter"
  run heroku ps -a "$APP"
  run heroku addons -a "$APP"
}

case "$CMD" in
  crear) cmd_crear;;
  exportar) cmd_exportar;;
  destruir) cmd_destruir;;
  estado) cmd_estado;;
  *) die "comando desconocido '$CMD' (crear, exportar, destruir, estado)";;
esac
