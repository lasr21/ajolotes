# Ajolotes en Producción — Design Doc

Versión 1, 17 de septiembre de 2026. Autor: Luis (JSConf MX).

Minijuego web de 20 segundos para promover JSConf MX 2026, construido en un hackathon de la comunidad Claude y desplegado en Vercel. Este documento es la fuente de verdad del proyecto. `CLAUDE.md` resume las reglas y apunta aquí.

---

## 1. Resumen

Eliges tu stack (React, Vue, Angular o Svelte) y un accesorio. Tu ajolote nada 20 segundos comiéndose bugs de JavaScript mientras compite contra ajolotes bot. Al terminar, un Tech Lead (Claude) lee tus estadísticas y te escribe un code review sarcástico de dos oraciones, con liga a boletos de JSConf MX.

Objetivos, en orden:

1. Un demo de 60 segundos que funcione siempre, con o sin red.
2. Una herramienta de promoción de JSConf MX que se pueda compartir.

Principios:

- La IA está fuera del camino crítico: corre cuando la ronda ya terminó y siempre hay un respaldo.
- Todo lo que se ve es honesto: los bots están etiquetados como bots y no hay multijugador fingido.
- Simple antes que completo: nada de base de datos, cuentas ni tiempo real.

---

## 2. Alcance y prioridades

| Prioridad | Qué entra |
| --- | --- |
| P0 (el demo) | Camerino con 4 stacks y 2 accesorios (sombrero de charro, lentes de sol). Ronda de 20 s con 3 tipos de bug y 11 bots. Code review con Claude y respaldo. Pantalla de resultados con ranking, reseña y QR a boletos. |
| P1 | Tarjeta compartible (imagen OG + página `/r/[token]` + botón Compartir). Bugs especiales (funciona en mi máquina, deploy en viernes). 4 accesorios más. Pulido de animaciones. |
| P2 | Límite de uso por IP, medición de visitas por `?ref`, sonido, controles de teclado. |

Fuera de alcance: multijugador real, lobby o reloj global, chat, dibujo con foto, leaderboard global, cuentas de usuario, texto libre del usuario.

Si se acaba el tiempo se corta P2 y luego P1. El demo solo necesita P0.

---

## 3. Flujo y pantallas

Una sola página (`/`) con tres estados: `customize` → `playing` → `results`. "Jugar otra vez" regresa a `playing` con la misma configuración; un enlace "Cambiar ajolote" regresa a `customize`. La página `/r/[token]` es aparte (P1).

Diseño mobile first (390×844). En escritorio todo vive en una columna centrada con proporción 9:16; en resultados, el QR aparece a un lado.

### 3.1 Camerino (`customize`)

- Título como letrero de trajinera (ver §4): "Ajolotes en Producción".
- Subtítulo: "Tu ajolote contra los bugs de JavaScript. 20 segundos."
- Vista previa grande del ajolote (unos 280 px de ancho) sobre agua, que cambia al instante al elegir.
- "Tu stack": 4 botones (React, Vue, Angular, Svelte), cada uno con un punto de su color. Uno seleccionado siempre; por defecto React.
- "Tu accesorio": chips "Ninguno" + accesorios disponibles.
- Botón principal "Jugar".

### 3.2 Estanque (`playing`)

- Canvas a pantalla completa dentro de la columna 9:16. Fondo: agua (§4).
- HUD dibujado en el canvas: puntos arriba a la izquierda ("12 pts"), tiempo arriba al centro ("0:14", grande), lugar actual arriba a la derecha ("3.º").
- Cada bot lleva su nombre encima en 10 px con una pastilla "bot". El jugador lleva "tú".
- La ronda empieza al entrar a esta pantalla, sin cuenta regresiva.

### 3.3 Resultados (`results`)

- Puntos en grande y "Quedaste en el lugar {n} de {total}".
- Tarjeta "Tu code review": mientras llega, rota los mensajes de carga cada 1.2 s (§7.6); luego muestra la reseña.
- Top 5 del ranking con el jugador resaltado (si quedó fuera del top 5, aparece como sexta fila).
- Botones: "Jugar otra vez", "Compartir" (P1) y "Consigue tu boleto para JSConf MX".
- En pantallas de 900 px o más: QR a la liga de boletos, pensado para el demo en proyector.

### 3.4 Página compartida `/r/[token]` (P1)

- Muestra la imagen de la tarjeta y dos botones: "Juega tú también" (a `/`) y "Consigue tu boleto".
- Token inválido: "Esta tarjeta no es válida. Juega y saca la tuya." con el botón "Jugar".

---

## 4. Dirección visual

Concepto: un canal de Xochimilco en producción. El agua domina la pantalla, los paneles son claros y hay un solo momento memorable: el título pintado como el letrero de una trajinera, con letras en arco sobre un tablero de color y borde de tinta (SVG con `textPath`). Todo lo demás es sobrio.

| Token | Hex | Uso |
| --- | --- | --- |
| `agua` | `#0E4A55` | Fondo del estanque y de la app |
| `agua-profunda` | `#09343C` | Bordes del canvas, sombras, HUD |
| `lirio` | `#EAF4EF` | Paneles y tarjetas |
| `tinta` | `#2A1F2D` | Texto y contornos |
| `trajinera` | `#FFC83D` | Botón principal, bug dorado, tablero del título |
| `bug` | `#FFE27A` | Burbuja de bugs normales |
| `viernes` | `#C81E3A` | Burbuja de "deploy en viernes" (texto blanco) |

Tipografía:

- Fredoka 400 y 600 para títulos e interfaz. Escala: 14, 16, 20, 28, 40 px.
- JetBrains Mono 500 solo para contenido de código: bugs y valores.
- Cargar ambas con `next/font/google`.

Reglas:

- Sentence case, sin mayúsculas sostenidas, sin emojis y sin flechas en botones.
- Botones reales (`<button>`, `<a>`), targets de 44 px o más y foco visible.
- Respetar `prefers-reduced-motion`: sin burbujas decorativas y con ondulación mínima.
- Contraste de texto de al menos 4.5:1.

---

## 5. El ajolote y los accesorios

### 5.1 Asset base

`public/sprites/ajolote-base.svg` ya existe. No cambies su geometría.

- `viewBox="0 0 200 100"`, de perfil, mirando a la derecha, con la cola a la izquierda.
- Grupos: `#branquias`, `#cuerpo` (que contiene `#patas`, `#cuerpo-relleno`, `#panza` y `#contorno`), `#cabeza` y `#cara` (con `#mejilla`, `#ojos` y `#sonrisa`).
- Colores en variables dentro de su `<style>`: `--piel`, `--panza`, `--branquias`, `--contorno` (`#2A1F2D`) y `--grosor` (`4.5px`).
- Anclas en unidades del viewBox: cabeza `(152, 24)` y ojos `(171, 44)`. También existen como `#ancla-cabeza` y `#ancla-ojos`, pero en código usa constantes.

### 5.2 Paletas

`src/data/palettes.json` ya existe:

| Stack | piel | panza | branquias |
| --- | --- | --- | --- |
| React | `#61DAFB` | `#CFF4FE` | `#149ECA` |
| Vue | `#42B883` | `#C8EEDB` | `#2C8C63` |
| Angular | `#F0406A` | `#FBD0DC` | `#B8002A` |
| Svelte | `#FF6A33` | `#FFD6C4` | `#D93400` |

Se usan los colores de cada framework, nunca sus logos.

### 5.3 Horneado y rasterizado (`src/game/sprites.ts`)

Hay una sola función para el juego y para la tarjeta OG:

```ts
bakeAxolotlSvg(baseSvg: string, palette: Palette, accessory: AccessoryId): string
```

1. Reemplaza cada `var(--piel)`, `var(--panza)`, `var(--branquias)`, `var(--contorno)` y `var(--grosor)` por su valor literal. El resultado no debe tener variables CSS, porque el render de la tarjeta OG no las soporta.
2. Si hay accesorio, inserta su contenido antes del cierre `</svg>` dentro de `<g transform="translate(ax ay)">`, usando el ancla que le toca.
3. Devuelve el SVG como texto.

Para el canvas:

- Convierte el SVG horneado en `Blob` → `Image` → canvas fuera de pantalla a 2× el tamaño del sprite (120×60).
- Guarda el resultado en caché por `stack + accesorio`.
- Carga `ajolote-base.svg` una sola vez con `fetch`.

Si al probar la tarjeta OG los colores no aparecen, cambia las clases por atributos `fill` y `stroke` literales dentro de `bakeAxolotlSvg`.

### 5.4 Animación de nado

- Dibuja el sprite en 12 tiras verticales. Cada tira se desplaza en Y con `A · sin(ω·t − k·i)`, con la amplitud creciendo hacia la cola (`i = 0` en la cola). `A` máx. 2 unidades de mundo; `ω` proporcional a la velocidad.
- Voltea el sprite con el signo de la velocidad en X, con histéresis de 15 u/s para que no parpadee.
- Agrega un vaivén vertical leve de ±1 unidad a 1.5 Hz.
- Con `prefers-reduced-motion`: `A = 0.5` y sin vaivén.

### 5.5 Accesorios (`public/sprites/accessories/<id>.svg`)

Se dibujan en el mismo estilo: contorno `#2A1F2D` con grosor 4.5, formas planas y colores fijos. Van en las mismas unidades del viewBox de 200×100, con su punto de apoyo en `(0, 0)`: la base del sombrero o el centro de los lentes.

| id | Nombre en UI | Ancla | Prioridad |
| --- | --- | --- | --- |
| `charro` | Sombrero de charro | cabeza | P0 |
| `sunglasses` | Lentes de sol | ojos | P0 |
| `wizard` | Gorro de mago | cabeza | P1 |
| `hardhat` | Casco de obra | cabeza | P1 |
| `headphones` | Audífonos | cabeza | P1 |
| `crown` | Corona | cabeza | P1 |

El sombrero de charro es un guiño a Guadalajara, sede de JSConf MX 2026.

---

## 6. Mecánicas del juego

Todos los números viven en `src/game/config.ts`. Los valores de abajo son el punto de partida para ajustar jugando.

### 6.1 Mundo y ronda

| Constante | Valor | Nota |
| --- | --- | --- |
| `WORLD_W` × `WORLD_H` | 360 × 640 | Unidades lógicas, escaladas al contenedor 9:16 |
| `ROUND_SECONDS` | 20 | |
| `SPRITE_W` × `SPRITE_H` | 60 × 30 | Tamaño del ajolote en el mundo |
| `MOUTH_RADIUS` | 12 | Colisión: círculo en la punta de la cabeza (`x + 24·dir`, `y`) |
| `PLAYER_MAX_SPEED` | 240 u/s | |
| `PLAYER_STEER` | 8 /s | Suavizado hacia el objetivo |
| `TOUCH_OFFSET_Y` | 36 | En táctil, el objetivo queda arriba del dedo |
| `BOT_COUNT` | 11 | Repartidos entre los 4 stacks |
| `BOT_SPEED_SCALE` | 1.0 | Perilla global de dificultad |
| `MAX_BUGS` | 14 | En pantalla al mismo tiempo |
| `SPAWN_EVERY` | 0.35 s | Mientras haya menos de `MAX_BUGS` |
| `BUG_LIFETIME` | 6 s | Después se va nadando y cuenta como perdido |
| `STREAK_WINDOW` | 2 s | Máximo entre dos bugs para seguir en racha |
| `IDLE_SPEED` | 10 u/s | Debajo de esto cuenta como quieto |

Input: pointer events sobre el canvas con `touch-action: none`; el objetivo es la última posición del puntero. Si la pestaña se oculta, la ronda se pausa.

### 6.2 Bugs

Se dibujan como burbujas de texto en JetBrains Mono. No necesitan arte.

| Tipo (`BugType`) | Texto | Puntos | Movimiento | Aparición |
| --- | --- | --- | --- | --- |
| `undefined` | `undefined` | 1 | Lento, 25 u/s | 50 % |
| `nan` | `NaN` | 2 | Zigzag, 45 u/s | 30 % |
| `objectObject` | `[object Object]` | 3 | Muy lento, 15 u/s, burbuja grande | 20 % |
| `worksOnMyMachine` (P1) | `funciona en mi máquina` | 10 | 140 u/s, brillo dorado | Una vez por ronda, entre los 6 y 14 s; dura 3 s |
| `fridayDeploy` (P1) | `deploy en viernes` | −5 | 30 u/s, burbuja roja | Cada 5 s; dura 4 s |

El radio de colisión de cada bug es la mitad del ancho de su burbuja, con máximo 20.

### 6.3 Bots

Todos tienen un retraso de reacción de 0.15 a 0.3 s y una probabilidad del 10 % de ignorar un bug. Evitan "deploy en viernes", salvo Svelte (ver tabla).

| Stack | Velocidad | Cambia de objetivo | Estrategia | Chiste |
| --- | --- | --- | --- | --- |
| React | 215 | Cada 0.4 s | El más cercano | Re-renderiza de objetivo todo el tiempo |
| Vue | 195 | Cada 0.8 s | Mejor puntos/distancia | Balanceado |
| Angular | 160 | Cada 1.2 s | El de más puntos | Lento pero preciso, sin temblor |
| Svelte | 230 | Cada 0.6 s | El más cercano | 15 % de las veces se distrae y nada sin rumbo; 20 % se come el deploy en viernes |

Meta de ajuste: un jugador normal queda en el top 3 en unas 7 de cada 10 rondas. Se logra moviendo `BOT_SPEED_SCALE` y el retraso de reacción; es balance de dificultad, nunca se altera el marcador. Los empates los gana el jugador.

Los nombres salen de `src/data/bot-names.json`: 100 nombres, 25 por stack, de 16 caracteres o menos, estilo usuario dev en español o spanglish (`Senior_Tamal`, `CSS_Llorón`, `console.log_enjoyer`, `Vanilla_God`). Sin personas reales ni nada ofensivo.

### 6.4 Estadísticas de la ronda

```ts
type Stack = 'react' | 'vue' | 'angular' | 'svelte';
type AccessoryId = 'none' | 'charro' | 'sunglasses' | 'wizard' | 'hardhat' | 'headphones' | 'crown';
type BugType = 'undefined' | 'nan' | 'objectObject' | 'worksOnMyMachine' | 'fridayDeploy';

interface RoundStats {
  stack: Stack;
  accessory: AccessoryId;
  score: number;
  eaten: Record<BugType, number>;                         // lo que se comió el jugador
  missed: Record<Exclude<BugType, 'fridayDeploy'>, number>; // expiraron o se los comió un bot
  bestStreak: number;                                     // según STREAK_WINDOW
  idleSeconds: number;                                    // según IDLE_SPEED, redondeado
  place: number;                                          // 1 = primero
  totalPlayers: number;                                   // jugador + bots
  beatenBy: { name: string; stack: Stack } | null;        // el bot justo arriba; null si quedó 1.º
  winner: { name: string; stack: Stack; score: number } | null; // null si ganó el jugador
}
```

---

## 7. IA: el code review

### 7.1 Endpoint

`POST /api/review` (route handler, runtime de Node).

- Entrada: `RoundStats`, validado con zod (conteos entre 0 y 200, `score` entre −100 y 1000, enums cerrados).
- Salida: `{ review: string; source: 'ai' | 'fallback' }`.
- Nunca responde con error al cliente. Si la entrada es inválida, hay timeout o falla el modelo, responde 200 con una reseña de respaldo (§7.5).

### 7.2 Modelo

- Vercel AI SDK con `generateText` y el proveedor `@ai-sdk/anthropic`, que lee `ANTHROPIC_API_KEY`.
- Modelo desde `CLAUDE_MODEL` (por defecto `claude-haiku-4-5-20251001`, el más rápido).
- Timeout con `AbortSignal.timeout(REVIEW_TIMEOUT_MS)`, 4000 ms por defecto.
- Límite de unos 150 tokens de salida.

Posproceso: quitar comillas envolventes, cortar a 2 oraciones y a 280 caracteres, y sin saltos de línea.

Seguridad: el prompt solo recibe enums y números. Ningún texto escrito por el usuario entra al modelo, así que no hay superficie de prompt injection.

### 7.3 Prompt de sistema

```
Eres el Tech Lead de un equipo de JavaScript en México. Acabas de ver jugar a alguien una ronda de "Ajolotes en Producción", un minijuego donde un ajolote se come bugs de JavaScript, y le escribes un code review.

Reglas:
- Máximo 2 oraciones y 40 palabras.
- Menciona al menos un dato concreto de sus estadísticas (un tipo de bug, su lugar, su racha, el bot que le ganó).
- Búrlate del stack, del framework o de sus decisiones en el juego, nunca de la persona.
- Tono de compa sarcástico pero cariñoso, en español de México. Puedes usar jerga de JavaScript.
- Sin groserías, sin insultos, sin emojis, sin hashtags.
- Cierra con una invitación breve a JSConf MX.
- Responde solo con el texto del review, sin comillas.
```

### 7.4 Mensaje de usuario y ejemplos

Mensaje: `Estadísticas de la ronda:\n` + `JSON.stringify(stats)`. Antes del mensaje real, incluye estos ejemplos como turnos previos (usuario → asistente):

- Vue, 2.º lugar, `eaten.nan: 9`, `missed.objectObject: 4`, ganó `Senior_Tamal` (Angular):
  "Te comiste 9 NaN pero dejaste pasar todos los [object Object], muy reactivo para lo fácil y muy lento para lo pesado. Senior_Tamal te ganó con Angular; nos vemos en JSConf MX para el refactor."
- Angular, 5.º lugar, `eaten.fridayDeploy: 2`:
  "Dos deploys en viernes y quinto lugar: tu módulo necesita importar el módulo de la paciencia. En JSConf MX te explicamos la inyección de dependencias con calma."
- React, 1.er lugar, `eaten.worksOnMyMachine: 1`, `bestStreak: 7`:
  "Primer lugar y una racha de 7, y encima atrapaste el funciona en mi máquina; seguro tu useEffect trae el arreglo vacío y la conciencia tranquila. Ven a presumirlo a JSConf MX."
- Svelte, 3.er lugar, `idleSeconds: 6`:
  "Seis segundos quieto: compilaste tan bien que ni runtime necesitaste para moverte. Tercer lugar, nada mal; en JSConf MX te enseñamos a desaparecer bugs en vez de mirarlos."

### 7.5 Reseñas de respaldo

`src/data/fallback-reviews.json`: 8 plantillas por stack con placeholders `{score}`, `{place}`, `{total}`, `{bestStreak}` y `{beatenBy}`. Así el respaldo también suena específico.

Se elige al azar entre las del stack. Las que usan `{beatenBy}` solo aplican si no es `null`.

Ejemplo (React): "Quedaste en el lugar {place} de {total} con {score} puntos; demasiados renders para tan poco estado. Nos vemos en JSConf MX."

### 7.6 Mensajes de carga

Rotan cada 1.2 s mientras llega el review:

- "Revisando tu PR…"
- "Buscando a quién echarle la culpa…"
- "Corriendo los tests (ninguno)…"
- "Dejando comentarios pasivo-agresivos…"

---

## 8. Resultados y tarjeta para compartir

### 8.1 Liga de boletos y QR

- Liga: `NEXT_PUBLIC_TICKETS_URL` + `?ref=ajolotes`.
- El QR se genera con `qrcode` como data URL en el cliente y solo se muestra en pantallas de 900 px o más.

### 8.2 Token firmado (P1, `src/lib/share.ts`)

- Payload: `{ v: 1, s: stack, a: accessory, p: score, l: place, n: totalPlayers, r: review }`.
- Token: `base64url(JSON) + "." + firma`. La firma es `base64url(HMAC-SHA256(SHARE_SECRET, base64url(JSON)))` cortada a 22 caracteres.
- Usa Web Crypto (`crypto.subtle`) para que funcione en cualquier runtime.
- `verifyToken` devuelve el payload o `null`. Nada se guarda en servidor.

### 8.3 Imagen OG (`/api/card?t=<token>`)

- `ImageResponse` de `next/og`, 1200×630.
- Izquierda: el ajolote horneado con su accesorio, a unos 480 px de ancho, sobre `agua`.
- Derecha, sobre `lirio`: la reseña en Fredoka 36 px, luego puntos y lugar, y al pie "JSConf MX 2026, Guadalajara".
- Token inválido: tarjeta genérica con el ajolote de React y el título.
- Fuente: Fredoka SemiBold en TTF estático (no variable, no woff2) en `src/assets/fonts/`. Se carga con `fs` o `fetch` según el runtime.

### 8.4 Página `/r/[token]`

- `generateMetadata` con `openGraph.images` y `twitter.card = "summary_large_image"` apuntando a `/api/card?t=...` con URL absoluta basada en `NEXT_PUBLIC_SITE_URL`.
- Contenido según §3.4.

### 8.5 Botón Compartir

- Usa `navigator.share({ url, text })` cuando existe.
- Si no, copia la liga y muestra "Liga copiada".
- El texto compartido: "Saqué {score} puntos en Ajolotes en Producción. ¿Tu stack aguanta?"

---

## 9. Arquitectura

### 9.1 Stack

- Next.js con App Router, TypeScript estricto y Tailwind, desplegado en Vercel.
- Dependencias además de las de `create-next-app`: `ai`, `@ai-sdk/anthropic`, `zod`, `qrcode` (+ `@types/qrcode`).
- Sin base de datos.

### 9.2 Estructura

```
.
├── CLAUDE.md
├── docs/DESIGN.md
├── .env.example
├── public/sprites/
│   ├── ajolote-base.svg          (ya existe)
│   └── accessories/<id>.svg
└── src/
    ├── app/
    │   ├── layout.tsx            fuentes y tokens
    │   ├── page.tsx              máquina de estados customize → playing → results
    │   ├── r/[token]/page.tsx    (P1)
    │   └── api/
    │       ├── review/route.ts
    │       └── card/route.tsx    (P1)
    ├── components/
    │   ├── CustomizeScreen.tsx
    │   ├── GameScreen.tsx        monta el canvas, arranca el engine y recibe RoundStats
    │   ├── ResultsScreen.tsx
    │   └── TrajineraTitle.tsx
    ├── game/
    │   ├── config.ts
    │   ├── types.ts
    │   ├── engine.ts             loop, update, draw, HUD
    │   ├── entities.ts           jugador, bots, bugs
    │   ├── bots.ts               personalidades por stack
    │   ├── sprites.ts            bakeAxolotlSvg, rasterizado, caché
    │   ├── accessories.ts        ids, anclas, nombres
    │   └── stats.ts
    ├── lib/
    │   ├── review-prompt.ts
    │   ├── fallback.ts
    │   └── share.ts              (P1)
    ├── data/
    │   ├── palettes.json         (ya existe)
    │   ├── bot-names.json
    │   └── fallback-reviews.json
    └── assets/fonts/             Fredoka SemiBold TTF para la OG (P1)
```

### 9.3 Reglas del loop

- Un solo `requestAnimationFrame` en `engine.ts`, con `dt` limitado a 50 ms.
- Todo el estado de la ronda vive en objetos mutables que el engine controla. React monta el canvas, llama `startRound(config, onEnd)` y recibe `RoundStats` una vez, al final.
- El HUD se dibuja en el canvas, así que React no se re-renderiza durante la ronda.
- El canvas se escala al contenedor manteniendo 360×640, con `devicePixelRatio` limitado a 2.
- Los sprites se preparan en el camerino, para que la ronda arranque sin cargas.

---

## 10. Variables de entorno

| Variable | Dónde se usa | Ejemplo | Nota |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | Servidor | `sk-ant-...` | Créditos del evento. Nunca con `NEXT_PUBLIC_`. |
| `CLAUDE_MODEL` | Servidor | `claude-haiku-4-5-20251001` | Se cambia sin tocar código. |
| `REVIEW_TIMEOUT_MS` | Servidor | `4000` | Opcional. |
| `SHARE_SECRET` | Servidor | 64 caracteres hex | `openssl rand -hex 32`. Solo P1. |
| `NEXT_PUBLIC_SITE_URL` | Cliente y servidor | `https://ajolotes.vercel.app` | Sin `/` final. |
| `NEXT_PUBLIC_TICKETS_URL` | Cliente | Liga oficial de boletos | Se le agrega `?ref=ajolotes`. |

Configuración:

- Local: `cp .env.example .env.local` y llenar los valores.
- Vercel: Project Settings → Environment Variables, en Production y Preview. Con la CLI, después de `npx vercel link`, se pueden bajar con `npx vercel env pull .env.local`.
- El `.gitignore` de `create-next-app` ignora `.env*`. Agrega `!.env.example` para versionar la plantilla.

---

## 11. Hitos

Cada hito termina con `npm run build`, lint y typecheck limpios, y desplegado en Vercel.

**M0. Esqueleto en producción (15–20 min).** Agregar dependencias y `!.env.example` al `.gitignore`. Fuentes y tokens de §4. Página con el título provisional y el botón "Jugar" deshabilitado. Deploy con variables configuradas.
Listo cuando: la URL de Vercel abre en el celular.

**M1. Camerino y sprites.** `sprites.ts` completo (§5.3). Accesorios P0 dibujados (charro y lentes). `CustomizeScreen` con vista previa en vivo y `TrajineraTitle`.
Listo cuando: cambiar stack o accesorio actualiza la vista previa sin parpadeo.

**M2. Estanque jugable.** `engine.ts` con loop, escalado, input, jugador con nado (§5.4), los 3 bugs normales, colisión, puntos, HUD y ronda de 20 s que termina y entrega `RoundStats`.
Listo cuando: una ronda completa corre fluida en Chrome con CPU 4× más lenta en DevTools, y el Profiler de React no muestra renders durante la ronda.

**M3. Bots y estadísticas.** 11 bots con personalidades (§6.3), `bot-names.json`, etiquetas "bot", ranking y todas las estadísticas de §6.4.
Listo cuando: jugando normal se queda en el top 3 la mayoría de las veces y las estadísticas cuadran con lo que se vio.

**M4. Code review con Claude.** `/api/review` completo (§7), `fallback-reviews.json` y posproceso.
Listo cuando: con key válida responde en menos de 4 s, y sin key o sin red responde una reseña de respaldo sin error visible.

**M5. Resultados (cierra P0).** `ResultsScreen` completo (§3.3), con mensajes de carga, top 5, "Jugar otra vez", liga y QR a boletos.
Listo cuando: el flujo de 60 s funciona de punta a punta en celular y en laptop. En este punto se graba el video de respaldo.

**M6. Tarjeta y compartir (P1).** `share.ts`, `/api/card`, `/r/[token]` y el botón Compartir.
Listo cuando: pegar la liga en WhatsApp o X muestra la tarjeta, y alterar un carácter del token muestra la genérica.

**M7. Más sabor (P1).** Bugs especiales, los 4 accesorios restantes, burbujas al comer y "+3" flotante en el punto donde se comió el bug.

**M8. Después del hackathon (P2).** Límite de uso (reglas de Vercel Firewall o un Redis pequeño), medición de `?ref`, sonido y teclado.

---

## 12. Demo de 60 segundos

| Segundos | Qué pasa |
| --- | --- |
| 0–10 | Camerino: eliges stack y accesorio. |
| 10–35 | Ronda de 20 s. |
| 35–50 | Aparece el code review de Claude. |
| 50–60 | Tarjeta o QR a boletos. |

Línea de pitch: "El Tech Lead es Claude: lee tus estadísticas y te hace code review."

Antes del demo:

- 10 minutos antes, jugar una ronda en producción para calentar la función.
- Brillo al máximo y modo no molestar; o laptop al proyector con la ventana en 9:16.
- Tener el video de respaldo abierto en otra pestaña.

| Si pasa esto | Respaldo |
| --- | --- |
| El modelo tarda o falla | Reseña de plantilla con estadísticas reales. El demo sigue. |
| Se cae el wifi | Video de 60 s grabado en M5. |
| El celular va lento | Bajar `BOT_COUNT` a 8 y `MAX_BUGS` a 10 en config. |
| Abusan de la API después del evento | P2: límite por IP; sin créditos, solo plantillas. |

---

## 13. Preguntas abiertas

- Liga oficial de boletos y si habrá un código de descuento para quien juegue.
- Visto bueno del equipo de JSConf MX para usar la marca, y si hay logo para la tarjeta OG.
- Horas disponibles en el hackathon, para decidir dónde cortar.
- Dominio: `*.vercel.app` o un subdominio de JSConf MX.

---

## 14. Decisiones posteriores a la versión 1

- **17 de septiembre de 2026.** Sin promoción: el code review no invita a JSConf MX, las reseñas de respaldo tampoco, y la pantalla de resultados no lleva botón de boletos ni QR a boletos. Sustituye lo que dicen §3.3, §7.3, §7.4, §7.5 y §8.1 sobre boletos e invitaciones. `NEXT_PUBLIC_TICKETS_URL` deja de usarse. El nombre del juego y la temática se conservan.
