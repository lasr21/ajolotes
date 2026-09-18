# Arranque en 5 pasos

1. Crea el proyecto (TypeScript, ESLint, Tailwind, carpeta `src/` y App Router: sí a todo):

   ```
   npx create-next-app@latest ajolotes-en-produccion
   cd ajolotes-en-produccion
   ```

2. Copia dentro del proyecto todo lo de este kit, respetando carpetas: `CLAUDE.md`, `docs/`, `.env.example`, `public/sprites/` y `src/data/`. Hazlo después de `create-next-app`, porque ese comando no acepta una carpeta con archivos previos.

3. Variables locales:

   ```
   cp .env.example .env.local
   ```

   Llena `ANTHROPIC_API_KEY` y `NEXT_PUBLIC_TICKETS_URL`. `SHARE_SECRET` puede esperar hasta M6.

4. Sube el repo a GitHub e impórtalo en Vercel, o corre `npx vercel`. Agrega las mismas variables en Project Settings → Environment Variables.

5. Abre Claude Code en la carpeta del proyecto y pega esto:

   ```
   Lee docs/DESIGN.md completo. Antes de escribir código, dame en máximo 8 líneas tu plan para M0 a M5 y cualquier duda del documento. Después empieza con M0 y detente al terminarlo.
   ```
