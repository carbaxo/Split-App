# Split App

App web instalable (PWA) con autenticación por **enlace de correo** y datos en
**Firebase**. Funciona en **móvil y desktop** desde una sola base de código, y en
Android se puede **instalar como app**.

## Stack

- **Vite + React + TypeScript** — base de código única, responsive.
- **Firebase Authentication** — inicio de sesión con Google (un clic).
- **Cloud Firestore** — base de datos en la nube, con reglas de seguridad por usuario.
- **vite-plugin-pwa** — manifest + service worker → instalable en Android.
- **Tailwind CSS v4** — diseño adaptable móvil/desktop.

## Cómo funciona la autenticación

1. El usuario pulsa "Continuar con Google".
2. Elige su cuenta de Google y entra (popup; en móvil cae a redirección si hace falta).
3. La sesión se guarda en el dispositivo y se mantiene al volver a abrir la app.
4. Todo lo que cree el usuario se guarda en Firestore asociado a su `uid`,
   protegido con **reglas de seguridad** (cada usuario solo ve sus datos).

---

## Puesta en marcha

### 1. Crear el proyecto en Firebase

1. Entra en <https://console.firebase.google.com> y crea un proyecto.
2. Dentro del proyecto, crea una **app web** (icono `</>`).
3. Copia el objeto de configuración (`apiKey`, `authDomain`, `projectId`, etc.).

### 2. Activar el inicio de sesión con Google

En Firebase Console → **Authentication → Sign-in method**:

- Activa el proveedor **Google** (elige un correo de soporte y guarda).

En **Authentication → Settings → Authorized domains**, asegúrate de que están
`localhost` y tu dominio de producción (p. ej. `carbaxo.github.io`).

### 3. Crear la base de datos Firestore

En Firebase Console → **Firestore Database → Create database**.

- Publica las reglas de seguridad de [`firestore.rules`](firestore.rules)
  (cópialas en la pestaña **Rules**, o usa la CLI — ver más abajo).
- Crea el índice compuesto de [`firestore.indexes.json`](firestore.indexes.json).
  La primera vez que ejecutes la consulta, la consola te dará un enlace directo
  para crearlo con un clic.

### 4. Variables de entorno

```bash
cp .env.example .env
```

Rellena `.env` con los valores del paso 1:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
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

1. Despliega la app en una URL **HTTPS**.
2. Ábrela en **Chrome** en Android.
3. Menú (⋮) → **Instalar aplicación** / **Añadir a pantalla de inicio**.
4. Se instala con icono propio y se abre a pantalla completa (modo `standalone`).

> Para probar la PWA en local usa `npm run build && npm run preview` (el service
> worker está desactivado en `npm run dev` a propósito).

---

## Despliegue

El proyecto es un sitio estático (SPA). Hay configuración para **GitHub Pages**
(workflow en `.github/workflows/deploy.yml`), **Firebase Hosting**
(`firebase.json`), **Vercel** (`vercel.json`) y **Netlify** (`public/_redirects`).

### Opción recomendada — GitHub Pages (automático)

La app se publica en `https://carbaxo.github.io/Split-App/`.

1. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Cada push a la rama dispara el build y el despliegue (ver pestaña **Actions**).
3. En **Firebase → Authentication → Settings → Authorized domains**, añade
   `carbaxo.github.io`.

> La subruta `/Split-App/` ya está configurada en `vite.config.ts` (`base`).
> Si cambias el nombre del repo o el dominio, actualiza ese `base`.

### Opción A — Firebase Hosting (con la CLI)

```bash
npm install -g firebase-tools
firebase login
firebase use --add                       # selecciona tu proyecto
npm run build
firebase deploy --only hosting,firestore # despliega app + reglas + índices
```

### Opción B — Vercel / Netlify

1. Conecta el repo. Build command: `npm run build` · Output: `dist`.
2. Añade las variables `VITE_FIREBASE_*` en el panel del proveedor.
3. Añade el dominio de producción a los **Authorized domains** de Firebase Auth.

---

## Estructura

```
src/
  lib/firebase.ts          Inicialización de Firebase (auth + Firestore)
  contexts/AuthContext.tsx Estado de sesión + login con Google / logout
  components/
    Login.tsx              Pantalla de acceso (botón de Google)
    Layout.tsx             Navegación responsive (sidebar desktop / bottom-nav móvil)
  pages/
    Dashboard.tsx          Demo de guardado de datos en Firestore
    Account.tsx            Datos de la cuenta
  App.tsx                  Rutas + protección de rutas
firestore.rules            Reglas de seguridad por usuario
firestore.indexes.json     Índices compuestos
firebase.json              Config de Firebase Hosting + Firestore
scripts/generate-icons.mjs Generador de iconos PWA
```

## Próximos pasos

El framework está listo. Falta definir **qué hace la app** (modelo de datos:
grupos, gastos, repartos…) para sustituir la colección de ejemplo `items` por el
modelo real.
