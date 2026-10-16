# 🚀 Despliegue en Firebase Hosting

Guía paso a paso para publicar la app y el panel admin.

---

## 1. Requisitos

- Node.js 20+
- Cuenta de Google con Firebase habilitado
- CLI de Firebase: `npm i -g firebase-tools`

## 2. Crear el proyecto

```bash
firebase login
firebase init          # marca: Firestore, Functions, Hosting, Emulators (opcional)
# Project: crea o selecciona uno nuevo
# Public directory: dist
# Single-page app: Yes
# Firestore rules: firestore.rules
# Functions: functions/
```

## 3. Variables de entorno (frontend)

Crea un archivo `.env` en la raíz (no se sube a git):

```bash
cp .env.example .env
```

| Variable | Descripción |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Clave API del proyecto |
| `VITE_FIREBASE_AUTH_DOMAIN` | `tu-proyecto.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto |
| `VITE_FIREBASE_STORAGE_BUCKET` | `tu-proyecto.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID del remitente |
| `VITE_FIREBASE_APP_ID` | ID de la app web |
| `VITE_USE_FIREBASE_EMULATOR` | `1` para desarrollo local con emuladores |
| `VITE_AI_RECOMMEND_URL` | URL pública de la Cloud Function (opcional) |

Las claves de Firebase web son públicas por diseño; la seguridad real está en las reglas de Firestore y en las Cloud Functions.

## 4. Cargar el catálogo inicial (seed)

```bash
# Opción A: con archivo de cuenta de servicio
export FIREBASE_SERVICE_ACCOUNT=./mi-cuenta.json
node scripts/seed.mjs

# Opción B: con las credenciales por defecto (tras `gcloud auth application-default login`)
node scripts/seed.mjs
```

Esto sube: `ingredients`, `drinks`, `offers`, `rules`, `badges`, `settings/main` y `counters`.

## 5. Build y deploy

```bash
npm run build
firebase deploy --only hosting
# Firestore (reglas + índices):
firebase deploy --only firestore
# Cloud Functions (recomendador IA):
cd functions && npm install && cd ..
firebase deploy --only functions
```

## 6. Configurar la API key de Claude (solo servidor)

La clave **nunca** va en el frontend. Se guarda como secreto de Functions:

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
# pega tu clave cuando lo solicite
```

La función `recomendar` la lee desde `process.env.ANTHROPIC_API_KEY`. Si no está configurada o falla, el cliente cae automáticamente a reglas locales.

## 7. Panel admin

1. Crea el usuario en **Firebase Console → Authentication → Users → Add user**.
2. Asigna el custom claim `admin: true` (ver `ESQUEMA.md`).
3. Ve a `https://TU-DOMINIO/admin/login` e inicia sesión.

## 8. (Opcional) Pago online desactivado

El punto de integración de pago directo está listo pero **deshabilitado**. Actívalo desde el admin → Configuración → `pago.onlineActivo` cuando quieras conectar una pasarela (Flow, Webpay, Mercado Pago).

---

## Desarrollo local con emuladores

```bash
firebase emulators:start --only firestore,auth,functions
# en .env: VITE_USE_FIREBASE_EMULATOR=1
npm run dev
```

---

## Comandos útiles

```bash
npm run dev      # desarrollo
npm run build    # build de producción
npm run lint     # linter (oxlint)
npm run preview  # previsualizar el build
```
