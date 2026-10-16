-- ============================================================
-- EMpanadas Abuela Rosa — Esquema Supabase
-- Pega esto completo en el SQL Editor de Supabase y presiona Run.
-- Idempotente: puedes correrlo más de una vez sin romper nada.
-- ============================================================

-- ---------- EXTENSIÓN ----------
create extension if not exists "pgcrypto";

-- ---------- 1. TABLAS ----------

-- Ingredientes (proteínas, quesos, acompañamientos salada y dulce)
create table if not exists public.ingredients (
  id             text primary key,
  categoria      text not null,                 -- proteina | queso | acompanamiento
  linea          text not null default 'salada',-- salada | dulce
  nombre         text not null,
  emoji          text,
  color          text,
  orden          int  not null default 0,
  disponible     boolean not null default true,
  tags           text[] not null default '{}',
  porcion_gramos int,
  costo_kg       numeric,
  precio         numeric not null default 0,
  stock_gramos   int,                           -- null = sin control de stock
  created_at     timestamptz not null default now()
);

-- Bebidas
create table if not exists public.drinks (
  id              text primary key,
  categoria       text not null default 'bebida',
  nombre          text not null,
  emoji           text,
  color           text,
  orden           int  not null default 0,
  disponible      boolean not null default true,
  precio          numeric not null default 0,
  costo           numeric,
  azucar          text,
  stock_unidades  int,                          -- null = sin control de stock
  created_at      timestamptz not null default now()
);

-- Ofertas / combos
create table if not exists public.offers (
  id          text primary key,
  nombre      text not null,
  empanadas   int  not null default 1,
  bebidas     int  not null default 0,
  precio      numeric not null default 0,
  activa      boolean not null default true,
  orden       int  not null default 0,
  emoji       text,
  destacado   text,
  created_at  timestamptz not null default now()
);

-- Reglas de recomendación
create table if not exists public.rules (
  id              text primary key,
  base_tipo       text not null,                -- proteina | queso
  base_id         text not null,
  acompanamientos text[] not null default '{}',
  mensaje         text,
  created_at      timestamptz not null default now()
);

-- Insignias / gamificación
create table if not exists public.badges (
  id          text primary key,
  nombre      text not null,
  descripcion text,
  icono       text,
  condicion   jsonb not null default '{}',      -- { tipo, valor }
  cupon       text,
  created_at  timestamptz not null default now()
);

-- Configuración global (un solo registro: id = 'main')
create table if not exists public.settings (
  id         text primary key default 'main',
  data       jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Ranking de combinaciones más pedidas
create table if not exists public.stats (
  id                   text primary key,        -- clave de combinación
  count                int not null default 0,
  nombre               text,
  emojis               text[] not null default '{}',
  proteina_id          text,
  queso_id             text,
  acompanamientos_ids  text[] not null default '{}',
  updated_at           timestamptz not null default now()
);

-- Contadores (número de pedido, combinaciones, etc.)
create table if not exists public.counters (
  id         text primary key,
  valor      int not null default 0,
  updated_at timestamptz not null default now()
);

-- Pedidos
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  numero            int,
  cliente           jsonb not null default '{}',  -- { nombre, telefono, direccion, comuna, referencia }
  items             jsonb not null default '[]',  -- array de items del pedido
  totales           jsonb not null default '{}',  -- { subtotal, ahorro, delivery, total }
  oferta            jsonb,                        -- detalle de oferta aplicada
  entrega           jsonb,                        -- { fecha, hora } retiro/entrega
  etiquetas         text[] not null default '{}',
  comprobante       text,
  fuente            text not null default 'web',
  status            text not null default 'pendiente_pago',
  stock_descontado  boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Clientes (gamificación)
create table if not exists public.customers (
  id                  text primary key,          -- teléfono normalizado
  nombre              text,
  telefono            text,
  comuna              text,
  pedidos             int not null default 0,
  puntos              int not null default 0,
  ultima_combinacion  text,
  ultima_fecha        timestamptz,
  creado              timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Historial de movimientos de inventario
create table if not exists public.inventory_log (
  id         uuid primary key default gen_random_uuid(),
  entrada    jsonb not null default '{}',
  fecha      timestamptz not null default now()
);

-- Perfiles de usuario (rol admin)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

-- Compatibilidad con esquemas ya ejecutados: agrega columnas nuevas si faltan.
alter table public.orders add column if not exists entrega jsonb;

-- ---------- 2. ÍNDICES ----------
create index if not exists idx_ingredients_categoria on public.ingredients (categoria);
create index if not exists idx_ingredients_linea     on public.ingredients (linea);
create index if not exists idx_orders_status         on public.orders (status);
create index if not exists idx_orders_created        on public.orders (created_at desc);
create index if not exists idx_inventory_log_fecha   on public.inventory_log (fecha desc);

-- ---------- 3. UPDATED_AT automático ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_settings_touch on public.settings;
create trigger trg_settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_orders_touch on public.orders;
create trigger trg_orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_customers_touch on public.customers;
create trigger trg_customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_stats_touch on public.stats;
create trigger trg_stats_touch before update on public.stats
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_counters_touch on public.counters;
create trigger trg_counters_touch before update on public.counters
  for each row execute function public.touch_updated_at();

-- ---------- 4. RLS ----------
alter table public.ingredients   enable row level security;
alter table public.drinks        enable row level security;
alter table public.offers        enable row level security;
alter table public.rules         enable row level security;
alter table public.badges        enable row level security;
alter table public.settings      enable row level security;
alter table public.stats         enable row level security;
alter table public.counters      enable row level security;
alter table public.orders        enable row level security;
alter table public.customers     enable row level security;
alter table public.inventory_log enable row level security;
alter table public.profiles      enable row level security;

-- ¿Es admin? (perfil marcado o correo de la dueña, igual que firestore.rules)
create or replace function public.es_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    exists (select 1 from public.profiles where id = auth.uid() and is_admin),
    coalesce(auth.email(), '') = 'admin@abuelarosa.cl'
  );
$$;

-- Catálogo: lectura pública, escritura solo admin
drop policy if exists "catalogo lectura"   on public.ingredients;
drop policy if exists "catalogo escritura" on public.ingredients;
create policy "catalogo lectura"   on public.ingredients for select using (true);
create policy "catalogo escritura" on public.ingredients for all
  using (public.es_admin()) with check (public.es_admin());

drop policy if exists "bebidas lectura"   on public.drinks;
drop policy if exists "bebidas escritura" on public.drinks;
create policy "bebidas lectura"   on public.drinks for select using (true);
create policy "bebidas escritura" on public.drinks for all
  using (public.es_admin()) with check (public.es_admin());

drop policy if exists "ofertas lectura"   on public.offers;
drop policy if exists "ofertas escritura" on public.offers;
create policy "ofertas lectura"   on public.offers for select using (true);
create policy "ofertas escritura" on public.offers for all
  using (public.es_admin()) with check (public.es_admin());

drop policy if exists "reglas lectura"   on public.rules;
drop policy if exists "reglas escritura" on public.rules;
create policy "reglas lectura"   on public.rules for select using (true);
create policy "reglas escritura" on public.rules for all
  using (public.es_admin()) with check (public.es_admin());

drop policy if exists "insignias lectura"   on public.badges;
drop policy if exists "insignias escritura" on public.badges;
create policy "insignias lectura"   on public.badges for select using (true);
create policy "insignias escritura" on public.badges for all
  using (public.es_admin()) with check (public.es_admin());

-- Settings: lectura pública, escritura solo admin
drop policy if exists "settings lectura"   on public.settings;
drop policy if exists "settings escritura" on public.settings;
create policy "settings lectura"   on public.settings for select using (true);
create policy "settings escritura" on public.settings for all
  using (public.es_admin()) with check (public.es_admin());

-- Stats: lectura pública, escritura acotada (como firestore.rules)
drop policy if exists "stats lectura"   on public.stats;
drop policy if exists "stats escritura" on public.stats;
create policy "stats lectura"   on public.stats for select using (true);
create policy "stats escritura" on public.stats for all
  using (public.es_admin()
         or (select count <= 25 and nombre is not null))
  with check (public.es_admin()
              or (select count <= 25 and nombre is not null));

-- Contadores: lectura pública, escritura solo admin (las RPCs son SECURITY DEFINER)
drop policy if exists "counters lectura"   on public.counters;
drop policy if exists "counters escritura" on public.counters;
create policy "counters lectura"   on public.counters for select using (true);
create policy "counters escritura" on public.counters for all
  using (public.es_admin()) with check (public.es_admin());

-- Pedidos: cualquiera crea uno válido; solo admin lee/edita
drop policy if exists "orders crear"   on public.orders;
drop policy if exists "orders leer"    on public.orders;
drop policy if exists "orders editar"  on public.orders;
create policy "orders crear" on public.orders for insert with check (
  cliente ? 'nombre'
  and cliente ? 'telefono'
  and jsonb_typeof(items) = 'array'
  and (totales ->> 'total') is not null
  and (totales ->> 'total')::numeric > 0
  and status = 'pendiente_pago'
);
create policy "orders leer"   on public.orders for select using (public.es_admin());
create policy "orders editar" on public.orders for update
  using (public.es_admin()) with check (public.es_admin());
drop policy if exists "orders borrar" on public.orders;
create policy "orders borrar" on public.orders for delete using (public.es_admin());

-- Clientes: solo admin (el registro lo hace la RPC SECURITY DEFINER)
drop policy if exists "customers lectura"   on public.customers;
drop policy if exists "customers escritura" on public.customers;
create policy "customers lectura"   on public.customers for select using (public.es_admin());
create policy "customers escritura" on public.customers for all
  using (public.es_admin()) with check (public.es_admin());

-- Log de inventario: solo admin
drop policy if exists "log lectura"   on public.inventory_log;
drop policy if exists "log escritura" on public.inventory_log;
create policy "log lectura"   on public.inventory_log for select using (public.es_admin());
create policy "log escritura" on public.inventory_log for insert with check (public.es_admin());

-- Perfiles: cada uno ve el suyo; admin ve todos
drop policy if exists "profiles propios" on public.profiles;
create policy "profiles propios" on public.profiles for select
  using (id = auth.uid() or public.es_admin());

-- ---------- 5. RPCs ----------

-- Número de pedido atómico (reemplaza runTransaction de Firestore)
create or replace function public.next_order_number()
returns int
language plpgsql security definer set search_path = public as $$
declare
  siguiente int;
begin
  insert into public.counters (id, valor) values ('orders', 101)
    on conflict (id) do nothing;

  update public.counters
     set valor = valor + 1
   where id = 'orders'
  returning valor into siguiente;

  return siguiente;
end $$;

-- Sube el ranking de combinaciones + contador total
create or replace function public.register_order_stats(
  p_clave  text,
  p_nombre text,
  p_emojis text[],
  p_proteina_id text,
  p_queso_id text,
  p_acomp_ids text[],
  p_cantidad int default 1
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.stats (id, count, nombre, emojis, proteina_id, queso_id, acompanamientos_ids)
  values (p_clave, p_cantidad, p_nombre, p_emojis, p_proteina_id, p_queso_id, p_acomp_ids)
  on conflict (id) do update
    set count = public.stats.count + excluded.count;

  insert into public.counters (id, valor) values ('combinaciones', 1)
    on conflict (id) do update set valor = public.counters.valor + 1;
end $$;

-- Actualiza/crea un cliente (puntos y contador de pedidos)
create or replace function public.upsert_customer(
  p_telefono text,
  p_nombre   text,
  p_comuna   text,
  p_clave    text default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id text := regexp_replace(coalesce(p_telefono, ''), '\s', '', 'g');
begin
  if v_id = '' then return; end if;

  insert into public.customers (id, nombre, telefono, comuna, pedidos, puntos, ultima_combinacion, ultima_fecha, creado)
  values (v_id, p_nombre, p_telefono, p_comuna, 1, 50, p_clave, now(), now())
  on conflict (id) do update
    set nombre             = excluded.nombre,
        comuna             = excluded.comuna,
        pedidos            = public.customers.pedidos + 1,
        puntos             = public.customers.puntos + 50,
        ultima_combinacion = excluded.ultima_combinacion,
        ultima_fecha       = now();
end $$;

-- Descuento/devolución de stock en lote (reemplaza writeBatch)
-- p_payload: { ings: {id: gramos}, bebs: {id: unidades}, masa_gramos: int|null }
create or replace function public.apply_stock(p_payload jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  rec record;
  v_delta int;
begin
  -- Ingredientes
  for rec in
    select key as id, value::int as gramos
      from jsonb_each_text(coalesce(p_payload -> 'ings', '{}'::jsonb))
  loop
    update public.ingredients
       set stock_gramos = greatest(0, coalesce(stock_gramos, 0) - rec.gramos)
     where id = rec.id
       and stock_gramos is not null;
  end loop;

  -- Bebidas
  for rec in
    select key as id, value::int as unidades
      from jsonb_each_text(coalesce(p_payload -> 'bebs', '{}'::jsonb))
  loop
    update public.drinks
       set stock_unidades = greatest(0, coalesce(stock_unidades, 0) - rec.unidades)
     where id = rec.id
       and stock_unidades is not null;
  end loop;

  -- Masa (guardada en settings.main.inventario.masaGramos)
  v_delta := (p_payload ->> 'masa_gramos')::int;
  if v_delta is not null and v_delta <> 0 then
    update public.settings
       set data = jsonb_set(
             data,
             '{inventario,masaGramos}',
             to_jsonb(greatest(0, coalesce((data #>> '{inventario,masaGramos}')::int, 0) - v_delta))
           )
     where id = 'main';
  end if;
end $$;

-- ---------- 6. REALTIME ----------
-- Habilita las tablas que el frontend escucha en vivo
do $$
declare t text;
begin
  foreach t in array array['orders','ingredients','drinks','offers','rules','badges','stats','settings']
  loop
    begin
      execute format(
        'alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ---------- 7. SEED (catálogo actual) ----------

-- Settings base
insert into public.settings (id, data) values ('main', '{
  "negocio": { "nombre": "Abuela Rosa", "ubicacion": "Maipú, Santiago", "whatsapp": "+56935438480", "instagram": "@abuelarosa.empanadas" },
  "lineas": { "salada": { "activa": true }, "dulce": { "activa": true, "cantidadAcompanamientos": 1, "extrasOpcional": true, "precioMinEmpanada": 2790, "precioMaxEmpanada": 3390 } },
  "precios": { "empanadaBase": 2990, "precioMinEmpanada": 3490, "precioMaxEmpanada": 3990, "proteinaExtra": 900, "quesoExtra": 700, "acompanamientoExtra": 400, "maxExtrasPorEmpanada": 2 },
  "delivery": { "gratisDesdeEmpanadas": 2, "costo": 1000, "comunasGratis": ["Maipú","Cerrillos","Estación Central"] },
  "produccion": { "diasHabilitados": ["viernes","sábado","domingo"], "horas": ["12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"] },
  "pago": { "onlineActivo": false, "mensaje": "Envía tu comprobante por WhatsApp y confirmamos tu pedido." },
  "gamificacion": { "activa": true, "puntosPorPedido": 50, "cuponPorInsignia": true, "cuponCodigo": "GRACIAS10", "cuponDescuento": 10 },
  "combinacionDia": { "activo": true, "precio": 2990, "forzada": null },
  "ia": { "activa": true },
  "masa": { "nombre": "Masa de empanada", "porcionGramos": 90, "costoKg": 1500 },
  "inventario": { "umbralEmpanadas": 10 }
}'::jsonb)
on conflict (id) do nothing;

-- Ingredientes (salada + dulce)
insert into public.ingredients (id, categoria, linea, nombre, emoji, color, orden, disponible, tags, porcion_gramos, costo_kg, precio) values
  ('p_carne','proteina','salada','Carne picada','🥩','#B5402F',1,true,'{}',70,9990,1200),
  ('p_pollo','proteina','salada','Pollo','🍗','#E0A040',2,true,'{}',70,4300,1100),
  ('p_camaron','proteina','salada','Camarón','🦐','#E86A4F',3,true,'{marisco}',70,6500,1350),
  ('p_reineta','proteina','salada','Reineta','🐟','#5B8CB8',4,true,'{pescado}',70,7200,1300),
  ('p_salmon','proteina','salada','Salmón','🐠','#F2836B',5,true,'{pescado}',70,12900,1400),
  ('p_seitan','proteina','salada','Seitan','🌾','#B98B5E',6,true,'{vegana,vegetal}',70,5000,1150),
  ('q_gouda','queso','salada','Gouda','🧀','#F0B429',1,true,'{}',25,6250,990),
  ('q_llanero','queso','salada','Llanero','🧀','#E58A22',2,true,'{}',25,12000,930),
  ('q_vegano','queso','salada','Vegano','🌱','#6FBF73',3,true,'{vegano}',25,12500,890),
  ('q_mozzarella','queso','salada','Mozzarella','🧀','#F6E27A',4,true,'{}',25,7800,960),
  ('a_tomate','acompanamiento','salada','Tomate','🍅','#DC4B3E',1,true,'{vegetal}',20,2000,375),
  ('a_choclo','acompanamiento','salada','Choclo','🌽','#F5C518',2,true,'{vegetal}',20,2500,375),
  ('a_champinon','acompanamiento','salada','Champiñón','🍄','#A78B6F',3,true,'{vegetal}',20,1670,375),
  ('a_palmitos','acompanamiento','salada','Palmitos','🌿','#DCCBA4',4,true,'{vegetal}',20,5630,400),
  ('a_pimenton','acompanamiento','salada','Pimentón','🫑','#C96A20',5,true,'{vegetal,picante}',20,3330,385),
  ('a_aceituna','acompanamiento','salada','Aceituna','🫒','#5B6B4A',6,true,'{vegetal}',15,3890,400),
  ('a_albahaca','acompanamiento','salada','Albahaca','🌱','#3B7A3E',7,true,'{vegetal}',10,6000,400),
  ('a_acelga','acompanamiento','salada','Acelga','🥬','#2F6B33',8,true,'{vegetal}',20,2500,375),
  ('a_espinaca','acompanamiento','salada','Espinaca','🍃','#4E8B3A',9,true,'{vegetal}',15,4000,375),
  ('a_cebolla','acompanamiento','salada','Cebolla caramelizada','🧅','#B0742A',10,true,'{vegetal}',20,7000,375),
  ('a_zapallo','acompanamiento','salada','Zapallo italiano','🥒','#7FA650',11,true,'{vegetal}',20,1800,375),
  ('d_nutella','proteina','dulce','Nutella','🥜','#6B3E26',1,true,'{}',50,9500,2200),
  ('d_chocolate','proteina','dulce','Chocolate','🍫','#5C3A21',2,true,'{}',45,12500,2100),
  ('d_manjar','proteina','dulce','Manjar','🍯','#E8B563',3,true,'{}',50,4800,2000),
  ('d_membrillo','proteina','dulce','Membrillo','🍎','#C4453B',4,true,'{vegetal}',45,3500,1900),
  ('d_choclo','acompanamiento','dulce','Choclo con queso','🌽','#F5C518',1,true,'{vegetal}',30,3000,130),
  ('d_pina','acompanamiento','dulce','Piña','🍍','#E8C220',2,true,'{vegetal}',30,2800,140),
  ('d_mango','acompanamiento','dulce','Mango','🥭','#F09030',3,true,'{vegetal}',30,3500,150),
  ('d_frutos','acompanamiento','dulce','Frutos rojos','🍓','#C23B4E',4,true,'{vegetal}',30,9500,160),
  ('d_frutossecos','acompanamiento','dulce','Mix de frutos secos','🥜','#A67C52',5,true,'{}',20,16000,180),
  ('d_coco','acompanamiento','dulce','Coco rallado','🥥','#F3EAD8',6,true,'{vegetal}',12,6500,120),
  ('d_almendra','acompanamiento','dulce','Almendras','🥜','#C89B6A',7,true,'{}',12,11000,170),
  ('d_nuez','acompanamiento','dulce','Nueces','🌰','#8B5E34',8,true,'{}',12,14000,180),
  ('d_mani','acompanamiento','dulce','Maní','🥜','#C49A6C',9,true,'{}',15,8000,130),
  ('d_mermelada','acompanamiento','dulce','Mermelada de mora','🫐','#5B4B8A',10,true,'{vegetal}',25,6000,190),
  ('d_chancaca','acompanamiento','dulce','Chancaca','🟤','#8A5A2B',11,true,'{}',20,3000,200)
on conflict (id) do nothing;

-- Bebidas
insert into public.drinks (id, categoria, nombre, emoji, color, orden, disponible, precio, costo, azucar) values
  ('b_coca','bebida','Coca-Cola lata','🥤','#DC4B3E',1,true,1700,1000,'azucarada'),
  ('b_fanta','bebida','Fanta lata','🍊','#F07613',2,true,1700,1000,'azucarada'),
  ('b_sprite','bebida','Sprite lata','🍋','#6FBF73',3,true,1700,1000,'azucarada'),
  ('b_agua','bebida','Agua mineral lata','💧','#5B8CB8',4,true,1500,800,'normal'),
  ('b_jugo','bebida','Jugo natural lata','🧃','#E8A020',5,true,1700,1100,'azucarada')
on conflict (id) do nothing;

-- Ofertas
insert into public.offers (id, nombre, empanadas, bebidas, precio, activa, orden, emoji, destacado) values
  ('o_1','1 empanada',1,0,2990,true,1,'🥟',null),
  ('o_2','2 empanadas',2,0,5590,true,2,'🥟🥟',null),
  ('o_3','Combo Individual',1,1,4390,true,3,'🥟🥤','individual'),
  ('o_4','2 empanadas + 2 latas',2,2,8190,true,4,'🥟🥤🥟🥤',null),
  ('o_5','Combo Familiar',6,4,20990,true,5,'👨‍👩‍👧‍👦','familiar')
on conflict (id) do nothing;

-- Reglas de recomendación
insert into public.rules (id, base_tipo, base_id, acompanamientos, mensaje) values
  ('r_reineta','proteina','p_reineta','{a_albahaca,a_tomate,a_zapallo}','A la reineta le queda bien: albahaca, tomate y zapallo italiano'),
  ('r_camaron','proteina','p_camaron','{a_pimenton,a_tomate,a_cebolla}','El camarón brilla con pimentón, tomate y cebolla caramelizada'),
  ('r_carne','proteina','p_carne','{a_cebolla,a_aceituna}','La carne pide cebolla caramelizada y aceituna'),
  ('r_pollo','proteina','p_pollo','{a_choclo,a_champinon,a_espinaca}','Al pollo le cae de maravilla choclo, champiñón y espinaca'),
  ('r_seitan','proteina','p_seitan','{a_espinaca,a_tomate,a_acelga}','El seitan con espinaca, tomate y acelga queda espectacular'),
  ('r_salmon','proteina','p_salmon','{a_albahaca,a_tomate,a_cebolla}','El salmón pide albahaca, tomate y cebolla caramelizada'),
  ('r_gouda','queso','q_gouda','{a_cebolla,a_choclo}','Gouda + cebolla caramelizada = clásico infaltable'),
  ('r_vegano','queso','q_vegano','{a_espinaca,a_acelga,a_tomate}','El queso vegano ama la verdura verde'),
  ('r_d_nutella','proteina','d_nutella','{d_mermelada}','Nutella con mermelada de mora queda brutal'),
  ('r_d_chocolate','proteina','d_chocolate','{d_mani}','Chocolate con maní: el clásico de la casa'),
  ('r_d_manjar','proteina','d_manjar','{d_nuez}','El manjar pide nueces, siempre'),
  ('r_d_membrillo','proteina','d_membrillo','{d_chancaca}','Membrillo con chancaca: sabor a campo'),
  ('r_d_q_vegano','queso','q_vegano','{d_coco}','El queso vegano ama el coco rallado'),
  ('r_d_q_gouda','queso','q_gouda','{d_mermelada}','En dulce, el gouda pide mermelada de mora')
on conflict (id) do nothing;

-- Insignias
insert into public.badges (id, nombre, descripcion, icono, condicion, cupon) values
  ('i_explorador','Explorador de Sabores','Probaste las 6 proteínas','🧭','{"tipo":"proteinasDistintas","valor":6}','EXPLORADOR10'),
  ('i_maquero','Maestro del Queso','Probaste los 4 quesos','🧀','{"tipo":"quesosDistintos","valor":4}','QUESOMAX'),
  ('i_verde','El Verde Poderoso','Pediste 3 empanadas vegetarianas o veganas','🌿','{"tipo":"veggieCount","valor":3}','VERDE15'),
  ('i_marea','Hijo del Mar','Pediste con pescado o marisco','🌊','{"tipo":"marCount","valor":1}','MARISKO'),
  ('i_frecuente','Habitual','Realizaste 5 pedidos','⭐','{"tipo":"pedidos","valor":5}','FIEL10')
on conflict (id) do nothing;

-- Contadores base
insert into public.counters (id, valor) values ('orders', 100), ('combinaciones', 0)
on conflict (id) do nothing;

-- ============================================================
-- ¡LISTO! Las tablas, permisos, RPCs, realtime y catálogo
-- quedaron creados. Ahora conecta el frontend con la anon key.
-- ============================================================
