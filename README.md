# Split App

App web instalable (PWA) con autenticación por **enlace de correo** y datos en
**Firebase**. Funciona en **móvil y desktop** desde una sola base de código, y en
Android se puede **instalar como app**.

## Stack

- **Vite + React + TypeScript** — base de código única, responsive.
- **Firebase Authentication** — login por enlace de correo (email link / passwordless).
- **Cloud Firestore** — base de datos en la nube, con reglas de seguridad por usuario.
- **vite-plugin-pwa** — manifest + service worker → instalable en Android.
- **Tailwind CSS v4** — diseño adaptable móvil/desktop.

## Cómo funciona la autenticación

1. El usuario introduce su correo en la pantalla de login.
2. Firebase le envía un **enlace de acceso** por correo.
3. Al hacer clic, vuelve a `/auth/callback`, la app completa el login y entra.
4. La sesión se guarda en el dispositivo y se mantiene al volver a abrir la app.
5. Todo lo que cree el usuario se guarda en Firestore asociado a su `uid`,
   protegido con **reglas de seguridad** (cada usuario solo ve sus datos).

---

## Puesta en marcha

### 1. Crear el proyecto en Firebase

1. Entra en <https://console.firebase.google.com> y crea un proyecto.
2. Dentro del proyecto, crea una **app web** (icono `</>`).
3. Copia el objeto de configuración (`apiKey`, `authDomain`, `projectId`, etc.).

### 2. Activar la autenticación por enlace de correo

En Firebase Console → **Authentication → Sign-in method**:

- Activa el proveedor **Email/Password** y, dentro, marca también
  **Email link (passwordless sign-in)**.

En **Authentication → Settings → Authorized domains**, asegúrate de que están
`localhost` y tu dominio de producción.

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

El proyecto es un sitio estático (SPA). Hay configuración de _fallback_ de rutas
para **Firebase Hosting** (`firebase.json`), **Vercel** (`vercel.json`) y
**Netlify** (`public/_redirects`).

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
  contexts/AuthContext.tsx Estado de sesión + login/logout por enlace de correo
  components/
    Login.tsx              Pantalla de acceso por correo
    Layout.tsx             Navegación responsive (sidebar desktop / bottom-nav móvil)
  pages/
    AuthCallback.tsx       Completa el login desde el enlace del correo
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
