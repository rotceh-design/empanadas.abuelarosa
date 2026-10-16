# 🗄️ Esquema de Firestore y reglas de seguridad

Todo el catálogo, precios, ofertas y reglas viven en Firestore para que se editen desde el panel admin sin tocar código.

---

## Colecciones

### `ingredients`
Un documento por ingrediente (proteína, queso o acompañamiento).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `categoria` | string | `proteina` \| `queso` \| `acompanamiento` |
| `linea` | string | `salada` \| `dulce` |
| `nombre` | string | Nombre visible |
| `emoji` | string | Representación visual |
| `color` | string | Hex para el acento |
| `orden` | number | Posición en la UI |
| `disponible` | boolean | `false` = agotado (se oculta del armador) |
| `tags` | array | `vegana`, `vegano`, `vegetal`, `pescado`, `marisco`, `picante` |
| `porcionGramos` | number | Gramos por porción (costos y producción) |
| `costoKg` | number | Precio por kilo (margen) |
| `precio` | number | Aporte del ingrediente al precio de la empanada (CLP) |
| `stockGramos` | number | Opcional. Stock actual en gramos (Inventario). Sin cargar = no rastreado. Se descuenta al confirmar el pago del pedido. |

**Precio de la empanada:** suma de los aportes de sus ingredientes, recortada al rango de su línea — salada `precios.precioMinEmpanada` (3490) – `precioMaxEmpanada` (3990); dulce `lineas.dulce.precioMinEmpanada` (2790) – `precioMaxEmpanada` (3390). Nunca sale de ese rango.

**Línea dulce:** 1 relleno (`categoria: proteina`, `linea: dulce`) + 1 queso (los mismos de la salada: `q_gouda`, `q_llanero`, `q_vegano`, `q_mozzarella`) + hasta 1 extra opcional (`categoria: acompañamiento`, `linea: dulce`). El armador usa pasos dinámicos (`?linea=dulce` llega desde el Home). Quesos no tienen `linea: dulce` — `CatalogContext` inyecta los de salada en la línea dulce.

**IDs fijos del seed:** salada — `p_carne`, `p_pollo`, `p_camaron`, `p_reineta`, `p_salmon`, `p_seitan` · `q_gouda`, `q_llanero`, `q_vegano`, `q_mozzarella` · `a_tomate`, `a_choclo`, `a_champinon`, `a_palmitos`, `a_pimenton`, `a_aceituna`, `a_albahaca`, `a_acelga`, `a_espinaca`, `a_cebolla`, `a_zapallo`. dulce — rellenos `d_nutella`, `d_chocolate`, `d_manjar`, `d_membrillo`; extras `d_choclo`, `d_pina`, `d_mango`, `d_frutos`, `d_frutossecos`, `d_coco`, `d_almendra`, `d_nuez`, `d_mani`, `d_mermelada`, `d_chancaca`. Combinaciones: 4×4×(1+11) = 192 (con extra: 4×4×11 = 176).

### `drinks`
Bebidas en lata. Campos: `nombre`, `emoji`, `color`, `orden`, `disponible`, `precio`, `costo`, `azucar` (`normal` \| `azucarada` \| `sin_azucar`), `stockUnidades` (opcional, unidades en stock).

### `offers`
Ofertas que el carrito combina automáticamente.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre` | string | Nombre de la oferta |
| `empanadas` | number | Cuántas empanadas incluye |
| `bebidas` | number | Cuántas bebidas incluye |
| `precio` | number | Precio del bundle (CLP) |
| `activa` | boolean | Se puede desactivar sin borrar |
| `orden` | number | Prioridad |
| `destacado` | string | Opcional: `individual` o `familiar` — el banner promociona estos combos (CTA al armador) |

### `rules`
Sugerencias de compatibilidad editables.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `baseTipo` | string | `proteina` \| `queso` |
| `baseId` | string | ID del ingrediente base |
| `acompanamientos` | array | IDs sugeridos |
| `mensaje` | string | Texto que ve el cliente |

### `badges`
Insignias de gamificación. Campos: `nombre`, `descripcion`, `icono`, `condicion` (`{tipo, valor}`), `cupon`.

### `settings/main`
Documento único de configuración:

- `negocio` → nombre, ubicación, WhatsApp, Instagram
- `lineas` → `{ salada: {activa}, dulce: {activa, cantidadAcompanamientos: 1, extrasOpcional, precioMinEmpanada: 2790, precioMaxEmpanada: 3390} }`
- `precios` → `precioMinEmpanada` (3490), `precioMaxEmpanada` (3990), `empanadaBase` (2990, referencia de ofertas), extras (`proteinaExtra`, `quesoExtra`, `acompanamientoExtra`), `maxExtrasPorEmpanada`
- `delivery` → `gratisDesdeEmpanadas`, `costo`, `comunasGratis`
- `produccion` → `diasHabilitados` (viernes/sábado/domingo), `horas`
- `pago` → `onlineActivo` (próximamente), mensaje
- `gamificacion` → activa, puntos, cupón
- `combinacionDia` → `{ activo, precio (default 2990), forzada: {proteinaId, quesoId, acompanamientosIds} | null }`. Genera **3 empanadas del día** deterministas por fecha (una terrestre, una del mar y una vegana; misma para todos, cambian a las 00:00) a precio fijo. El banner las promociona y el Home muestra las 3 tarjetas; `forzada` fija la primera.
- `ia` → activa
- `masa` → `{ nombre, porcionGramos, costoKg }`
- `inventario` → `{ umbralEmpanadas (default 10, alerta "por renovar"), masaGramos (stock de masa en gramos, opcional) }`

### `stats/{clave}`
Ranking en vivo de combinaciones pedidas. `clave` = `proteina+queso+acomp1+acomp2+acomp3+acomp4` (IDs ordenados y unidos por `+`). Campos: `count`, `nombre`, `emojis`, `proteinaId`, `quesoId`, `acompanamientosIds`.

### `orders`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `numero` | number | Número de ticket (desde `counters/orders`) |
| `status` | string | `pendiente_pago` → `pago_confirmado` → `en_preparacion` → `en_reparto` → `entregado` |
| `items` | array | Empanadas y bebidas con detalle |
| `cliente` | map | nombre, teléfono, dirección, comuna, referencias |
| `entrega` | map | `{fecha, hora}` |
| `totales` | map | subtotal, ahorro, delivery, total |
| `oferta` | map | ahorro y detalle de ofertas aplicadas |
| `etiquetas` | array | vegana, marisco, etc. |
| `comprobante` | string | Opcional. DataURL (webp/jpg comprimido) del comprobante de pago subido en Checkout. El admin lo ve en Pedidos. |
| `stockDescontado` | boolean | Opcional. `true` si el stock del pedido ya se descontó al confirmar el pago (permite reversa si vuelve a `pendiente_pago`). |
| `createdAt` | string | ISO 8601 |

### `inventory_log`
Historial de movimientos de inventario (solo admin). Campos: `tipo` (`compra` \| `conteo`), `naturaleza` (`ingrediente` \| `bebida` \| `masa`), `id`, `nombre`, `gramos`/unidades, `costo` (compra, CLP), `nota`, y en conteos: `esperado`, `real`, `merma`, `mermaCLP`, `costoKg`, `fecha` (ISO).

### `customers/{telefono}`
Perfil de gamificación: `puntos`, `pedidos`, `favoritas`, `combinaciones` probadas.

### `counters`
`orders.valor` (número de ticket) y `combinaciones.valor` (total de combinaciones únicas pedidas).

---

## 🔐 Reglas de seguridad (`firestore.rules`)

- **Catálogo** (`ingredients`, `drinks`, `offers`, `rules`, `badges`, `settings`): lectura pública, escritura solo admin.
- **counters**: lectura pública, escritura solo admin.
- **stats**: lectura pública; creación/incremento limitado a +25 por escritura (evita abuso del ranking).
- **orders**: cualquiera puede crear un pedido válido (`status` debe ser `pendiente_pago` y `total > 0`); lectura y edición solo admin.
- **customers**: solo admin.
- **inventory_log** (compras/conteos de inventario): solo admin.

El rol de admin se resuelve con el custom claim `admin == true` (recomendado) o el email `admin@abuelarosa.cl`.

```bash
# Asignar el claim de admin (ejecutar una sola vez desde el servidor)
firebase functions:shell
> const {getAuth} = require('firebase-admin/auth');
> getAuth().setCustomUserClaims('UID_DEL_ADMIN', {admin: true}).then(()=>console.log('ok'))
```

El archivo completo está en [`firestore.rules`](./firestore.rules). Los índices compuestos en [`firestore.indexes.json`](./firestore.indexes.json).
