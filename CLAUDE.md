# Ajolotes en Producción

Minijuego web para promover JSConf MX 2026. Eliges stack y accesorio, tu ajolote se come bugs de JavaScript durante 20 s contra ajolotes bot, y Claude te hace un code review sarcástico que puedes compartir. Next.js en Vercel, sin base de datos.

La especificación completa está en `docs/DESIGN.md`. Antes de empezar un hito, lee su sección en §11 y las secciones de los módulos que toca. Si este archivo y DESIGN.md se contradicen, manda DESIGN.md; avísame de la contradicción.

## Comandos

- `npm run dev` — desarrollo en http://localhost:3000
- `npm run build` — build de producción
- `npm run lint` — ESLint
- `npx tsc --noEmit` — typecheck
- `npx vercel` / `npx vercel --prod` — deploy de preview / producción
- `npx vercel env pull .env.local` — bajar variables de Vercel

## Stack

Next.js (App Router), TypeScript estricto, Tailwind. Dependencias extra permitidas: `ai`, `@ai-sdk/anthropic`, `zod`, `qrcode`, `@types/qrcode`. Pregunta antes de agregar cualquier otra.

## Reglas que no se rompen

1. El juego corre en un canvas con un solo loop de `requestAnimationFrame` en `src/game/engine.ts`. El estado de la ronda vive en objetos mutables del engine, nunca en estado de React. El HUD se dibuja en el canvas. React no se re-renderiza durante la ronda y recibe `RoundStats` una sola vez, al final.
2. Todos los números de juego (velocidades, spawn, puntos, tiempos) viven en `src/game/config.ts`.
3. Sin base de datos, sin cuentas y sin tiempo real. Los bancos de datos son JSON en `src/data/`.
4. `ANTHROPIC_API_KEY` y `SHARE_SECRET` solo se usan en route handlers. Ningún secreto lleva `NEXT_PUBLIC_`.
5. `/api/review` nunca devuelve error al cliente: ante entrada inválida, timeout o fallo del modelo responde 200 con una reseña de respaldo y `source: "fallback"`.
6. Ningún texto libre del usuario entra al prompt; solo enums y números.
7. Los bots siempre se muestran como bots, con su etiqueta "bot". La dificultad se ajusta con config, nunca alterando el marcador.
8. Accesibilidad mínima: `<button>` y `<a>` reales, targets de 44 px o más, foco visible y respeto a `prefers-reduced-motion`.

## Convenciones

- Código, identificadores y nombres de archivo en inglés. Textos de UI en español de México, en sentence case, sin emojis y sin flechas en botones.
- Excepción: los colores del ajolote se llaman `piel`, `panza` y `branquias`, porque así vienen del SVG y de `palettes.json`.
- Componentes en `src/components/`, juego en `src/game/`, utilidades de servidor en `src/lib/`, datos en `src/data/`.
- Un commit por hito o sub-paso, con mensajes como `M2: loop del juego y bugs`.

## Assets que ya existen

- `public/sprites/ajolote-base.svg`: no cambies su geometría. Capas, variables y anclas en DESIGN.md §5.1.
- `src/data/palettes.json`: paletas por stack.

## Cómo trabajar

- Avanza hito por hito (DESIGN.md §11) y detente al terminar cada uno para que lo revise.
- Al cerrar un hito: build, lint y typecheck limpios; prueba en un viewport de 390×844; resume en pocas líneas qué quedó, qué falta y qué números de config conviene ajustar.
- Si algo se complica, prioriza que P0 funcione de punta a punta antes de pulir.

## Notas de Next.js

Las reglas que genera `next dev` para esta versión están en `AGENTS.md`: @AGENTS.md
