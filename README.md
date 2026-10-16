# 🥟 Abuela Rosa — Empanadas a tu gusto (Maipú)

Plataforma mobile-first para pedir empanadas **personalizables** en Chile. Arma tu empanada como un juego: eliges 1 proteína + 1 queso + 4 acompañamientos entre **6.600 combinaciones**, con carrito que aplica solo la mejor oferta y ticket por WhatsApp.

**Stack:** React 19 + Vite + Tailwind v4 + Framer Motion + Supabase (Postgres, Auth, Realtime).

---

## ✨ Qué incluye

- **Armador tipo juego**: empanada animada que se va armando, barra de progreso con mensajes, nombre gracioso editable, botón "Sorpréndeme" (ruleta) con filtros vegano/vegetariano y bloqueos.
- **Catálogo 100 % en Supabase** (nada hardcodeado): 6 proteínas, 4 quesos, 11 acompañamientos, bebidas, extras, ofertas y reglas de compatibilidad. Estructura lista para la **línea Dulce** (activable con un interruptor en el admin).
- **Motor de ofertas automático** (el mejor bundle siempre): 1 emp $2.990 · 2 emp $5.590 · 1 emp + 1 lata $4.390 · 2 emp + 2 latas $8.190. Muestra el ahorro al cliente.
- **Delivery gratis desde 2 empanadas** en Maipú, Cerrillos y Estación Central; avisa cuánto falta si pides menos.
- **Ticket + WhatsApp**: número de pedido, detalle y botón que abre WhatsApp con el ticket prellenado. Pedido queda `pendiente de pago`.
- **Gamificación**: puntos, insignias, contador de combinaciones probadas y cupón configurable.
- **Compartir**: tarjeta "Mi empanada" para WhatsApp/Instagram.
- **Recomendador** con fallback a reglas locales (determinista, sin backend).
- **Panel admin** protegido: pedidos en tiempo real con alerta sonora, catálogo, ofertas, lista de producción/compras, métricas y costos.

---

## 🚀 Puesta en marcha

```bash
npm install
cp .env.example .env      # completa tus claves de Supabase
npm run dev               # http://localhost:5173
npm run build             # build de producción en dist/
```

> Sin variables `.env`, la app corre en **modo demo**: usa el catálogo de `src/data/catalogoSeed.js` y guarda pedidos en `localStorage`. Ideal para probar todo el flujo antes de conectar Supabase.

---

## 📚 Documentación

- **[DESPLIEGUE.md](./DESPLIEGUE.md)** — Supabase, variables de entorno, seed de datos y panel admin.
- **[ESQUEMA.md](./ESQUEMA.md)** — tablas de Supabase, RPCs y permisos (RLS).

---

## 🗂️ Estructura

```
src/
  components/      EmpanadaVisual, TarjetaCompartir, builder/ (Ruleta, Recomendador), ui
  contexts/        Catalog, Cart, Player, Auth, Theme
  lib/             ofertas, etiquetas, nombres, pedidos, ticket, ia, sonidos, supabase
  pages/           Home, Armar, Carrito, Checkout, Ticket
  pages/admin/     Pedidos, Catalogo, Ofertas, Produccion, Metricas, Config
  data/            catalogoSeed.js  (respaldo local del catálogo)
supabase/schema.sql  esquema, permisos (RLS), RPCs y catálogo inicial
```

---

Hecho con amor en Maipú 🇨🇱
