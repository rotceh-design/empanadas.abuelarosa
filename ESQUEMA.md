# 🗄️ Esquema de Supabase y permisos (RLS)

Todo el catálogo, precios, ofertas y reglas viven en Supabase para que se editen desde el panel admin sin tocar código.

El esquema completo está en [`supabase/schema.sql`](./supabase/schema.sql). Pégalo en el **SQL Editor** de Supabase y presiona **Run** (es idempotente).

---

## Tablas

Las columnas se guardan en `snake_case`; el frontend las mapea a `camelCase` en `src/lib/supabase.js`.

### `ingredients`
Un registro por ingrediente (proteína, queso o acompañamiento).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `categoria` | text | `proteina` \| `queso` \| `acompanamiento` |
| `linea` | text | `salada` \| `dulce` |
| `nombre` | text | Nombre visible |
| `emoji` | text | Representación visual |
| `color` | text | Hex para el acento |
| `orden` | int | Posición en la UI |
| `disponible` | boolean | `false` = agotado (se oculta del armador) |
| `tags` | text[] | `vegana`, `vegano`, `vegetal`, `pescado`, `marisco`, `picante` |
| `porcion_gramos` | int | Gramos por porción (costos y producción) |
| `costo_kg` | numeric | Precio por kilo (margen) |
| `precio` | numeric | Aporte del ingrediente al precio de la empanada (CLP) |
| `stock_gramos` | int | Opcional. Stock actual en gramos. Sin cargar = no rastreado. Se descuenta al confirmar el pago. |

**Precio de la empanada:** suma de los aportes de sus ingredientes, recortada al rango de su línea — salada `precios.precioMinEmpanada` (3490) – `precioMaxEmpanada` (3990); dulce `lineas.dulce.precioMinEmpanada` (2790) – `precioMaxEmpanada` (3390). Nunca sale de ese rango.

**Línea dulce:** 1 relleno (`categoria: proteina`, `linea: dulce`) + 1 queso (los mismos de la salada) + hasta 1 extra opcional. Los quesos no tienen `linea: dulce` — `CatalogContext` inyecta los de salada en la línea dulce.

**IDs fijos del seed:** salada — `p_carne`, `p_pollo`, `p_camaron`, `p_reineta`, `p_salmon`, `p_seitan` · `q_gouda`, `q_llanero`, `q_vegano`, `q_mozzarella` · `a_tomate`, `a_choclo`, `a_champinon`, `a_palmitos`, `a_pimenton`, `a_aceituna`, `a_albahaca`, `a_acelga`, `a_espinaca`, `a_cebolla`, `a_zapallo`. dulce — rellenos `d_nutella`, `d_chocolate`, `d_manjar`, `d_membrillo`; extras `d_choclo`, `d_pina`, `d_mango`, `d_frutos`, `d_frutossecos`, `d_coco`, `d_almendra`, `d_nuez`, `d_mani`, `d_mermelada`, `d_chancaca`.

### `drinks`
Bebidas en lata. Campos: `nombre`, `emoji`, `color`, `orden`, `disponible`, `precio`, `costo`, `azucar` (`normal` \| `azucarada` \| `sin_azucar`), `stock_unidades` (opcional).

### `offers`
Ofertas que el carrito combina automáticamente: `nombre`, `empanadas`, `bebidas`, `precio`, `activa`, `orden`, `emoji`, `destacado` (`individual` \| `familiar`).

### `rules`
Sugerencias de compatibilidad editables: `base_tipo` (`proteina` \| `queso`), `base_id`, `acompanamientos` (text[]), `mensaje`.

### `badges`
Insignias de gamificación: `nombre`, `descripcion`, `icono`, `condicion` (jsonb `{tipo, valor}`), `cupon`.

### `settings`
Un solo registro (`id = 'main'`). La configuración vive en la columna `data` (jsonb) con esta forma:

- `negocio` → nombre, ubicación, WhatsApp, Instagram
- `lineas` → `{ salada: {activa}, dulce: {activa, cantidadAcompanamientos, extrasOpcional, precioMinEmpanada, precioMaxEmpanada} }`
- `precios` → `precioMinEmpanada`, `precioMaxEmpanada`, `empanadaBase` (referencia de ofertas), extras, `maxExtrasPorEmpanada`
- `delivery` → `gratisDesdeEmpanadas`, `costo`, `comunasGratis`
- `produccion` → `diasHabilitados`, `horas`
- `pago` → `onlineActivo`, mensaje
- `gamificacion` → activa, puntos, cupón
- `combinacionDia` → `{ activo, precio, forzada: {proteinaId, quesoId, acompanamientosIds} | null }`. Genera **3 empanadas del día** deterministas por fecha a precio fijo.
- `ia` → activa
- `masa` → `{ nombre, porcionGramos, costoKg }`
- `inventario` → `{ umbralEmpanadas, masaGramos }`

### `stats`
Ranking en vivo de combinaciones pedidas. La columna `id` es la clave de combinación (`proteina+queso+acomp…`, IDs ordenados y unidos por `+`). Campos: `count`, `nombre`, `emojis`, `proteina_id`, `queso_id`, `acompanamientos_ids`.

### `orders`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `numero` | int | Número de ticket (vía la RPC `next_order_number`) |
| `status` | text | `pendiente_pago` → `pago_confirmado` → `en_preparacion` → `en_reparto` → `entregado` |
| `items` | jsonb | Empanadas y bebidas con detalle |
| `cliente` | jsonb | nombre, teléfono, dirección, comuna, referencias |
| `entrega` | jsonb | `{fecha, hora}` |
| `totales` | jsonb | subtotal, ahorro, delivery, total |
| `oferta` | jsonb | ahorro y detalle de ofertas aplicadas |
| `etiquetas` | text[] | vegana, marisco, etc. |
| `comprobante` | text | Opcional. DataURL del comprobante de pago. |
| `stock_descontado` | boolean | `true` si el stock ya se descontó al confirmar el pago. |
| `created_at` / `updated_at` | timestamptz | Automáticos |

### `inventory_log`
Historial de movimientos de inventario (solo admin). Cada fila tiene `entrada` (jsonb con `tipo`, `naturaleza`, `id`, `nombre`, gramos/unidades, `costo`, `nota`, y en conteos `esperado`/`real`/`merma`/`mermaCLP`/`costoKg`) y `fecha`.

### `customers`
Perfil de gamificación por teléfono (`id` = teléfono normalizado): `nombre`, `telefono`, `comuna`, `pedidos`, `puntos`, `ultima_combinacion`, `ultima_fecha`.

### `counters`
`orders.valor` (número de ticket) y `combinaciones.valor` (total de combinaciones únicas pedidas).

### `profiles`
Rol de admin por usuario de Auth: `id` (referencia a `auth.users`), `email`, `is_admin`.

---

## 🔐 Permisos (Row Level Security)

Definidos en `supabase/schema.sql` con la función `es_admin()` (perfil marcado **o** correo `admin@abuelarosa.cl`):

- **Catálogo** (`ingredients`, `drinks`, `offers`, `rules`, `badges`, `settings`): lectura pública, escritura solo admin.
- **counters**: lectura pública, escritura solo admin (las RPCs son `SECURITY DEFINER`).
- **stats**: lectura pública; escritura acotada (evita abuso del ranking).
- **orders**: cualquiera puede crear un pedido válido (`cliente` con nombre y teléfono, `items` como array, `total > 0` y `status = pendiente_pago`); lectura y edición solo admin.
- **customers**, **inventory_log**: solo admin.
- **profiles**: cada uno ve el suyo; admin ve todos.

Para marcar a un usuario como admin:

```sql
update public.profiles set is_admin = true where email = 'admin@abuelarosa.cl';
```

---

## ⚙️ RPCs

Funciones `SECURITY DEFINER` que garantizan operaciones atómicas desde el cliente:

- `next_order_number()` → devuelve el siguiente número de pedido de forma atómica.
- `register_order_stats(...)` → sube el ranking de una combinación y el contador total.
- `upsert_customer(...)` → crea/actualiza un cliente (puntos y contador de pedidos).
- `apply_stock(payload jsonb)` → descuento/devolución de stock en lote (`{ings, bebs, masa_gramos}`).
