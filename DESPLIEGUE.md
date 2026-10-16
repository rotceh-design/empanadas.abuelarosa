# 🚀 Despliegue

Guía paso a paso para publicar la app y el panel admin.

---

## 1. Requisitos

- Node.js 20+
- Cuenta de [Supabase](https://supabase.com)

## 2. Crear el proyecto

1. Crea un proyecto en Supabase.
2. Abre **SQL Editor**, pega todo el contenido de [`supabase/schema.sql`](./supabase/schema.sql) y presiona **Run**.
   - Es idempotente: puedes correrlo más de una vez sin romper nada.
   - Crea las tablas, permisos (RLS), las RPCs y el catálogo inicial (seed).

## 3. Variables de entorno (frontend)

Crea un archivo `.env` en la raíz (no se sube a git):

```bash
cp .env.example .env
```

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto (Project Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Clave `anon` / publishable (Project Settings → API) |

La clave `anon` es **pública** por diseño; la seguridad real la da el Row Level Security definido en `supabase/schema.sql`.

## 4. Build y deploy

La app es un SPA estática (Vite). Publícala en el hosting que prefieras (Netlify, Vercel, Cloudflare Pages, etc.):

```bash
npm run build      # genera dist/
```

Configura el host para servir `dist/` y redirigir todas las rutas a `index.html` (SPA fallback).

## 5. Panel admin

1. En **Supabase → Authentication → Users**, crea el usuario de la dueña.
2. Ve a **SQL Editor** y mărcalo como admin (reemplaza el correo si usas otro):

```sql
insert into public.profiles (id, email, is_admin)
select id, email, true
from auth.users
where email = 'admin@abuelarosa.cl'
on conflict (id) do update set is_admin = true;
```

3. Abre `https://TU-DOMINIO/admin/login` e inicia sesión.

> El RLS también acepta como admin al correo `admin@abuelarosa.cl` sin necesidad de fila en `profiles`, pero crearla es lo recomendado.

## 6. (Opcional) Pago online desactivado

El punto de integración de pago directo está listo pero **deshabilitado**. Actívalo desde el admin → Configuración → `pago.onlineActivo` cuando quieras conectar una pasarela (Flow, Webpay, Mercado Pago).

## 7. Recomendador (IA)

Hoy el recomendador es **100 % local** (determinista, sin dependencias). El endpoint de IA se puede conectar más adelante con una Edge Function de Supabase; hasta entonces no hay nada que configurar.

---

## Modo demo (sin backend)

Si no existen las variables `.env`, o se fuerza con `VITE_SUPABASE_OFF=1`, la app corre en **modo demo**: usa el catálogo de `src/data/catalogoSeed.js` y guarda pedidos y ediciones del admin en `localStorage`. Ideal para probar todo el flujo sin tocar la base real.

---

## Comandos útiles

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run lint       # linter (oxlint)
npm run test       # tests de lógica (corren en modo demo)
npm run test:e2e   # tests end-to-end del panel (modo demo)
npm run preview    # previsualizar el build
```
