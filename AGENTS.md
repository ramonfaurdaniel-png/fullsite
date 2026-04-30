# AGENTS.md — Guía para agentes que trabajan en este repo

> Este archivo lo lee Claude Code (local + GitHub Action) automáticamente al iniciar sesión.
> Todo lo que esté aquí se aplica a cualquier agente que toque el código.
> Si algo cambia en el repo, **actualiza este archivo en el mismo commit**.

---

## 1 · Identidad del repo

- **Nombre:** `fullsite`
- **Owner:** ramonfaurdaniel-png
- **Visibilidad:** privado (creo)
- **Propósito:** dashboard interno "War Room" para AMALAY Coffee (cliente pilot de Fullsite). NO es la landing pública de Fullsite — esa vive en otro repo (`fullsite-web`).
- **Deploy:** GitHub Pages, branch `main`, root del repo
- **URL pública:** https://ramonfaurdaniel-png.github.io/fullsite/

---

## 2 · Archivos que SÍ importan (los reales)

| Path | Tamaño | Qué es | URL pública |
|------|--------|--------|-------------|
| `/fullsite.html` | 253 KB | **War Room dashboard principal**. D3.js, conecta a Supabase + n8n + Telegram bot. **Este es el archivo que más se modifica.** | `/fullsite/fullsite.html` |
| `/index.html` | 50 KB | Landing/index del repo (vieja, casi no se toca) | `/fullsite/` |
| `/eventos.html` | 633 KB | Sistema de reservaciones de AMALAY. **OJO:** este archivo realmente debería vivir en el repo `amalay-`, no aquí. Si se toca, también hay que sincronizar al otro repo. | `/fullsite/eventos.html` |
| `/.github/workflows/claude.yml` | — | Configuración de Claude Code GitHub Action (Sonnet 4.6, modo autónomo Nivel 3) |
| `/CLAUDE.md` | — | (legacy) Instrucciones viejas de graphify. **Reemplazado por este AGENTS.md.** |
| `/AGENTS.md` | — | Este archivo. |
| `/package.json` + `/bun.lock` | — | Dependencias de Bun + Vitest (para tests) |
| `/tests/` | — | Suite de tests con Vitest |

---

## 3 · Archivos zombi (NO TOCAR, NO LEER, NO EDITAR)

Estos archivos existen en disco pero **están abandonados**. Si Claude Code los lee, se confunde sobre cuál es el código real. Trátalos como readonly:

- `/fullsite_backup.html` — backup viejo del War Room (10 abril)
- `/fullsite_prueba.html` — experimento abandonado
- `/graph-view.html` + `/graph-view_backup.html` — experimentos de graphify
- `/graphify-big-index.js`, `/graphify-index.js`, `/graphify-combined-html.txt` — código de la herramienta `graphify` que ya no se usa
- `/graphify-out/` — output de graphify, abandonado
- `/fullsite/` (subcarpeta) — **versiones antiguas duplicadas** de fullsite.html e index.html. NO se sirven por GitHub Pages. Son fósiles.
- `/char_0.png` ... `/char_5.png` — assets de avatar que ya no se usan
- `/TEST_PERMS.md` — archivo de test de permisos (10 abril 2026), basura, se puede borrar
- `/n8n-gbp-reviews.json` — workflow de n8n exportado (debería vivir en otro lado, está aquí por inercia)
- `/supabase-reviews.sql` — migration suelta (debería vivir en `/migrations/` cuando se cree)

**Regla:** si vas a editar algo y el archivo aparece en esta lista, **detente y pregunta al usuario primero**. No los borres en automático tampoco — Daniel los va a limpiar manualmente cuando tenga tiempo.

---

## 4 · Stack técnico

### Frontend
- **HTML/CSS/JS vanilla** — no React, no Vue, no build step
- **D3.js** vía CDN para visualizaciones del War Room
- **Tailwind** vía CDN para estilos rápidos
- **Single-file architecture** — todo el JS y CSS embebido en el `.html`. Sin imports externos custom (solo CDNs).

### Backend / data
- **Supabase** (`qjiomlvudfmzuvqvhwpk.supabase.co`)
  - Frontend usa `anon key` con prefijo `sb_publishable_` (formato nuevo)
  - n8n / Make.com usan `service_role key` (formato `sb_secret_`)
  - **NUNCA hardcodear keys en commits** — siempre vía variables de entorno o secrets de GitHub
- **n8n cloud** (`danielramonfaur.app.n8n.cloud`) para orquestación
- **Telegram Bot** (chat_id: `7654040494`) para notificaciones
- **Groq API** (Gemini 2.0 Flash) para el bot del War Room
- **Anthropic Claude Opus** para el parser de Wansoft AutoSync

### Tests
- **Vitest** vía Bun (`bun test`)
- Tests viven en `/tests/`
- Antes de cada PR el agente debe correr tests si modifica lógica

---

## 5 · Workflow de cambios

### Para Claude Code en LOCAL (la Mac de Daniel)

1. **Lee** este AGENTS.md primero (siempre)
2. **Verifica** que el archivo a editar es uno de los reales (sección 2), no un zombi (sección 3)
3. Para archivos HTML grandes (>1000 líneas como `fullsite.html`):
   - Usa **lectura completa → str_replace targeted → escritura** en lugar de `sed` o ediciones por número de línea
   - Si el `str_replace` falla por match no único, usa `re.DOTALL` regex como fallback
4. **No hagas `git push` automáticamente** — siempre pide confirmación
5. **No corras `rm -rf`, `sudo`, ni nada destructivo** — están en denylist

### Para Claude Code GitHub Action (modo autónomo)

El workflow `.github/workflows/claude.yml` se dispara con:
- Comentarios en issues que mencionen `@claude`
- Issues nuevos con `@claude` en el body
- PRs nuevos o sincronizados (cualquier PR, sin tag)

**Modo autónomo Nivel 3:** el agente:
- Crea su propia branch
- Commitea cambios
- **Pushea la branch (NO crea PR — el workflow lo hace solo después)**
- El workflow auto-mergea si los checks pasan

Custom instructions críticas (ya están en `claude.yml`):
> "After committing and pushing your changes, your job is done. Do NOT try to create PRs or run gh commands — the workflow handles that automatically after you finish."

### Para cambios en el War Room dashboard (`fullsite.html`)

Pasos típicos cuando un usuario pide "agregar X al War Room":
1. Lee `fullsite.html` completo
2. Encuentra la sección relevante (busca por comentarios `<!-- ... -->` o IDs)
3. Agrega/modifica con `str_replace`
4. **NO toques** la lógica de conexión a Supabase ni a n8n sin avisar — son frágiles
5. Test local abriendo `fullsite.html` en navegador
6. Commit con mensaje descriptivo: `feat(war-room): add X to dashboard`

---

## 6 · Convenciones de commits

Formato: `<tipo>(<scope opcional>): <descripción corta>`

Tipos comunes:
- `feat` — nueva funcionalidad
- `fix` — corrección de bug
- `chore` — cambios menores (lint, deps, etc.)
- `docs` — solo documentación
- `refactor` — cambios sin alterar comportamiento
- `test` — solo tests

Scopes comunes en este repo:
- `war-room` — cambios a `fullsite.html`
- `eventos` — cambios a `eventos.html`
- `landing` — cambios a `index.html`
- `ci` — cambios al workflow de GitHub Actions
- `docs` — cambios a CLAUDE.md, AGENTS.md, README

Ejemplos buenos:
- `feat(war-room): add Refrescar datos button to header`
- `fix(eventos): correct timezone for Mexico City reservations`
- `chore: bump bun lockfile`

---

## 7 · Restricciones de seguridad

### NUNCA, bajo ninguna circunstancia
- Commitear API keys, tokens, passwords, o `.env` files
- Modificar `.github/workflows/*` sin que Daniel apruebe explícitamente (afecta la autonomía del agente)
- Borrar archivos de la lista de zombi sin confirmación humana (Daniel los va a limpiar él)
- Hacer `git push --force` o `git reset --hard` en `main`
- Hacer commits directos a `main` desde el agente — siempre branch nueva
- Tocar el directorio `node_modules/`

### Siempre que dudes
- Pregunta primero, ejecuta después
- Si el cambio toca producción de AMALAY (sitio en `cafeamalay.com`, base de datos, n8n workflows), **avisa al usuario antes** — AMALAY es el negocio de la mamá de Daniel y no debe romperse

---

## 8 · Cosas que pueden romper sin avisar

Cosas conocidas que han fallado antes y por qué:

1. **n8n race condition** en webhooks de Telegram → fix con `await fetch()` secuencial dentro de un solo Code node
2. **Make.com Custom Webhook** vs Mailhook — usa Custom Webhook para HTTP POST de Supabase
3. **Supabase POST necesita header** `Prefer: return=representation` para devolver el UUID insertado
4. **n8n credenciales Anthropic** — usa "Predefined Credential Type" (no manual header) para evitar caracteres invisibles del paste
5. **GoDaddy DNS de cafeamalay.com** — A record correcto es `185.199.108.153` (no `192...`)
6. **Wansoft AutoSync extension** parsea `document.body.innerText`, NO la DOM (Wansoft usa AngularJS y no tiene `<table>` real)

---

## 9 · Glosario rápido

- **War Room** — el dashboard `fullsite.html` con D3.js que muestra KPIs en tiempo real de AMALAY
- **AutoSync** — Chrome extension que parsea Wansoft (POS) cada 20 min y sube a Supabase
- **AMALAY** — Coffee shop en San Pedro Garza García, cliente pilot. Owner: Mónica Gracia (mamá de Daniel)
- **Fullsite** — la agencia de Daniel, repo principal de código
- **fullsite-web** — repo SEPARADO con la landing pública de la agencia (no este)
- **amalay-** — repo SEPARADO con el sitio cafeamalay.com (no este)
- **Eduardo Ezquivel** — contacto de Wansoft con quien Daniel busca integración API directa
- **Mónica** — mamá de Daniel, owner de AMALAY, recibe notificaciones por WhatsApp +52 81 8254 3303

---

## 10 · TODOs activos del repo

(Que un agente puede atacar si Daniel se lo pide explícitamente)

- [ ] Borrar archivos zombi de la sección 3 (cuando Daniel apruebe)
- [ ] Mover `eventos.html` al repo `amalay-` y borrarlo de aquí
- [ ] Mover `n8n-gbp-reviews.json` a un directorio `/n8n-workflows/` o a su propio repo
- [ ] Crear `/migrations/` y mover `supabase-reviews.sql` ahí
- [ ] Borrar `CLAUDE.md` legacy una vez confirmado que AGENTS.md ya cubre todo
- [ ] Considerar separar `fullsite.html` en archivos modulares si crece más

---

**Última actualización:** 29 abril 2026 (sesión inicial de redacción)
**Mantenedor:** Daniel Ramonfaur (`ramonfaurdaniel-png`)
