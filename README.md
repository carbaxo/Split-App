# Split App

App web instalable (PWA) con autenticación por **magic link** y datos en **Supabase**.
Funciona en **móvil y desktop** desde una sola base de código, y en Android se puede
**instalar como app**.

## Stack

- **Vite + React + TypeScript** — base de código única, responsive.
- **Supabase** — base de datos Postgres + autenticación (enlace mágico por correo).
- **vite-plugin-pwa** — manifest + service worker → instalable en Android.
- **Tailwind CSS v4** — diseño adaptable móvil/desktop.

## Cómo funciona la autenticación

1. El usuario introduce su correo en la pantalla de login.
2. Supabase le envía un **enlace mágico**.
3. Al hacer clic, vuelve a `/auth/callback`, la app crea la sesión y entra.
4. La sesión se guarda en el dispositivo (`localStorage`) y se refresca sola.
5. Todo lo que cree el usuario se guarda en Supabase asociado a su `user_id`,
   protegido con **Row Level Security** (cada usuario solo ve sus datos).

---

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Entra en <https://supabase.com> y crea un proyecto.
2. Ve a **Project Settings → API** y copia:
   - **Project URL**
   - **anon public key**

### 2. Configurar la base de datos

En el **SQL Editor** de Supabase, pega y ejecuta el contenido de
[`supabase/schema.sql`](supabase/schema.sql). Crea la tabla de ejemplo `items`
con sus políticas de seguridad.

### 3. Configurar el correo de autenticación

En Supabase → **Authentication → URL Configuration**:

- **Site URL**: la URL de tu app (en local: `http://localhost:5173`).
- **Redirect URLs**: añade `http://localhost:5173/auth/callback` y la URL de
  producción cuando despliegues (`https://tu-dominio/auth/callback`).

> El correo de magic link usa por defecto el servidor de pruebas de Supabase
> (suficiente para empezar). Para producción conviene configurar un SMTP propio
> en **Authentication → Emails**.

### 4. Variables de entorno

```bash
cp .env.example .env
```

Rellena `.env` con los valores del paso 1:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-public-key
```

### 5. Arrancar en local

```bash
npm install
npm run dev
```

Abre <http://localhost:5173>, introduce tu correo y entra con el enlace que recibas.

---

## Scripts

| Comando             | Descripción                                            |
| ------------------- | ------------------------------------------------------ |
| `npm run dev`       | Servidor de desarrollo.                                |
| `npm run build`     | Build de producción (a `dist/`).                       |
| `npm run preview`   | Sirve el build localmente (útil para probar la PWA).   |
| `npm run icons`     | Regenera los iconos PNG de la PWA.                     |
| `npm run lint`      | Linter.                                                |
| `npm run typecheck` | Comprobación de tipos.                                 |

---

## Instalar como app en Android

1. Despliega la app en una URL **HTTPS** (Vercel, Netlify, etc.).
2. Ábrela en **Chrome** en Android.
3. Menú (⋮) → **Instalar aplicación** / **Añadir a pantalla de inicio**.
4. Se instala con icono propio y se abre a pantalla completa (modo `standalone`).

> Para probar la PWA en local usa `npm run build && npm run preview` (el service
> worker está desactivado en `npm run dev` a propósito).

---

## Despliegue

El proyecto es un sitio estático (SPA). Incluye configuración de _fallback_ de
rutas para **Vercel** (`vercel.json`) y **Netlify** (`public/_redirects`).

1. Conecta el repo a Vercel/Netlify.
2. Build command: `npm run build` · Output: `dist`.
3. Añade las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Añade la URL de producción a las **Redirect URLs** de Supabase (paso 3).

---

## Estructura

```
src/
  lib/supabase.ts          Cliente de Supabase
  contexts/AuthContext.tsx Estado de sesión + login/logout
  components/
    Login.tsx              Pantalla de magic link
    Layout.tsx             Navegación responsive (sidebar desktop / bottom-nav móvil)
  pages/
    AuthCallback.tsx       Vuelta del enlace del correo
    Dashboard.tsx          Demo de guardado de datos en Supabase
    Account.tsx            Datos de la cuenta
  App.tsx                  Rutas + protección de rutas
supabase/schema.sql        Tablas + Row Level Security
scripts/generate-icons.mjs Generador de iconos PWA
```

## Próximos pasos

El framework está listo. Falta definir **qué hace la app** (modelo de datos:
grupos, gastos, repartos…) para sustituir la tabla de ejemplo `items` por el
modelo real.
