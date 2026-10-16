// ============================================
// CATÁLOGO SEMILLA — Empanadas Abuela Rosa
// Precios en CLP. Es la copia local de respaldo;
// en producción se lee TODO desde Firestore.
// ============================================

export const CATALOGO_SEED = [
  // ---------- LÍNEA SALADA ----------
  { id: 'p_carne', categoria: 'proteina', linea: 'salada', nombre: 'Carne picada', emoji: '🥩', color: '#B5402F', orden: 1, disponible: true, tags: [], porcionGramos: 70, costoKg: 9990, precio: 1200 },
  { id: 'p_pollo', categoria: 'proteina', linea: 'salada', nombre: 'Pollo', emoji: '🍗', color: '#E0A040', orden: 2, disponible: true, tags: [], porcionGramos: 70, costoKg: 4300, precio: 1100 },
  { id: 'p_camaron', categoria: 'proteina', linea: 'salada', nombre: 'Camarón', emoji: '🦐', color: '#E86A4F', orden: 3, disponible: true, tags: ['marisco'], porcionGramos: 70, costoKg: 6500, precio: 1350 },
  { id: 'p_reineta', categoria: 'proteina', linea: 'salada', nombre: 'Reineta', emoji: '🐟', color: '#5B8CB8', orden: 4, disponible: true, tags: ['pescado'], porcionGramos: 70, costoKg: 7200, precio: 1300 },
  { id: 'p_salmon', categoria: 'proteina', linea: 'salada', nombre: 'Salmón', emoji: '🐠', color: '#F2836B', orden: 5, disponible: true, tags: ['pescado'], porcionGramos: 70, costoKg: 12900, precio: 1400 },
  { id: 'p_seitan', categoria: 'proteina', linea: 'salada', nombre: 'Seitan', emoji: '🌾', color: '#B98B5E', orden: 6, disponible: true, tags: ['vegana', 'vegetal'], porcionGramos: 70, costoKg: 5000, precio: 1150 },

  { id: 'q_gouda', categoria: 'queso', linea: 'salada', nombre: 'Gouda', emoji: '🧀', color: '#F0B429', orden: 1, disponible: true, tags: [], porcionGramos: 25, costoKg: 6250, precio: 990 },
  { id: 'q_llanero', categoria: 'queso', linea: 'salada', nombre: 'Llanero', emoji: '🧀', color: '#E58A22', orden: 2, disponible: true, tags: [], porcionGramos: 25, costoKg: 12000, precio: 930 },
  { id: 'q_vegano', categoria: 'queso', linea: 'salada', nombre: 'Vegano', emoji: '🌱', color: '#6FBF73', orden: 3, disponible: true, tags: ['vegano'], porcionGramos: 25, costoKg: 12500, precio: 890 },
  { id: 'q_mozzarella', categoria: 'queso', linea: 'salada', nombre: 'Mozzarella', emoji: '🧀', color: '#F6E27A', orden: 4, disponible: true, tags: [], porcionGramos: 25, costoKg: 7800, precio: 960 },

  { id: 'a_tomate', categoria: 'acompanamiento', linea: 'salada', nombre: 'Tomate', emoji: '🍅', color: '#DC4B3E', orden: 1, disponible: true, tags: ['vegetal'], porcionGramos: 20, costoKg: 2000, precio: 375 },
  { id: 'a_choclo', categoria: 'acompanamiento', linea: 'salada', nombre: 'Choclo', emoji: '🌽', color: '#F5C518', orden: 2, disponible: true, tags: ['vegetal'], porcionGramos: 20, costoKg: 2500, precio: 375 },
  { id: 'a_champinon', categoria: 'acompanamiento', linea: 'salada', nombre: 'Champiñón', emoji: '🍄', color: '#A78B6F', orden: 3, disponible: true, tags: ['vegetal'], porcionGramos: 20, costoKg: 1670, precio: 375 },
  { id: 'a_palmitos', categoria: 'acompanamiento', linea: 'salada', nombre: 'Palmitos', emoji: '🌿', color: '#DCCBA4', orden: 4, disponible: true, tags: ['vegetal'], porcionGramos: 20, costoKg: 5630, precio: 400 },
  { id: 'a_pimenton', categoria: 'acompanamiento', linea: 'salada', nombre: 'Pimentón', emoji: '🫑', color: '#C96A20', orden: 5, disponible: true, tags: ['vegetal', 'picante'], porcionGramos: 20, costoKg: 3330, precio: 385 },
  { id: 'a_aceituna', categoria: 'acompanamiento', linea: 'salada', nombre: 'Aceituna', emoji: '🫒', color: '#5B6B4A', orden: 6, disponible: true, tags: ['vegetal'], porcionGramos: 15, costoKg: 3890, precio: 400 },
  { id: 'a_albahaca', categoria: 'acompanamiento', linea: 'salada', nombre: 'Albahaca', emoji: '🌱', color: '#3B7A3E', orden: 7, disponible: true, tags: ['vegetal'], porcionGramos: 10, costoKg: 6000, precio: 400 },
  { id: 'a_acelga', categoria: 'acompanamiento', linea: 'salada', nombre: 'Acelga', emoji: '🥬', color: '#2F6B33', orden: 8, disponible: true, tags: ['vegetal'], porcionGramos: 20, costoKg: 2500, precio: 375 },
  { id: 'a_espinaca', categoria: 'acompanamiento', linea: 'salada', nombre: 'Espinaca', emoji: '🍃', color: '#4E8B3A', orden: 9, disponible: true, tags: ['vegetal'], porcionGramos: 15, costoKg: 4000, precio: 375 },
  { id: 'a_cebolla', categoria: 'acompanamiento', linea: 'salada', nombre: 'Cebolla caramelizada', emoji: '🧅', color: '#B0742A', orden: 10, disponible: true, tags: ['vegetal'], porcionGramos: 20, costoKg: 7000, precio: 375 },
  { id: 'a_zapallo', categoria: 'acompanamiento', linea: 'salada', nombre: 'Zapallo italiano', emoji: '🥒', color: '#7FA650', orden: 11, disponible: true, tags: ['vegetal'], porcionGramos: 20, costoKg: 1800, precio: 375 },

  // ---------- LÍNEA DULCE · Rellenos (1 por empanada) ----------
  { id: 'd_nutella', categoria: 'proteina', linea: 'dulce', nombre: 'Nutella', emoji: '🥜', color: '#6B3E26', orden: 1, disponible: true, tags: [], porcionGramos: 50, costoKg: 9500, precio: 2200 },
  { id: 'd_chocolate', categoria: 'proteina', linea: 'dulce', nombre: 'Chocolate', emoji: '🍫', color: '#5C3A21', orden: 2, disponible: true, tags: [], porcionGramos: 45, costoKg: 12500, precio: 2100 },
  { id: 'd_manjar', categoria: 'proteina', linea: 'dulce', nombre: 'Manjar', emoji: '🍯', color: '#E8B563', orden: 3, disponible: true, tags: [], porcionGramos: 50, costoKg: 4800, precio: 2000 },
  { id: 'd_membrillo', categoria: 'proteina', linea: 'dulce', nombre: 'Membrillo', emoji: '🍎', color: '#C4453B', orden: 4, disponible: true, tags: ['vegetal'], porcionGramos: 45, costoKg: 3500, precio: 1900 },

  // ---------- LÍNEA DULCE · Quesos: se usan los mismos de la línea salada ----------

  // ---------- LÍNEA DULCE · Acompañamientos (hasta 1, opcional) ----------
  { id: 'd_choclo', categoria: 'acompanamiento', linea: 'dulce', nombre: 'Choclo con queso', emoji: '🌽', color: '#F5C518', orden: 1, disponible: true, tags: ['vegetal'], porcionGramos: 30, costoKg: 3000, precio: 130 },
  { id: 'd_pina', categoria: 'acompanamiento', linea: 'dulce', nombre: 'Piña', emoji: '🍍', color: '#E8C220', orden: 2, disponible: true, tags: ['vegetal'], porcionGramos: 30, costoKg: 2800, precio: 140 },
  { id: 'd_mango', categoria: 'acompanamiento', linea: 'dulce', nombre: 'Mango', emoji: '🥭', color: '#F09030', orden: 3, disponible: true, tags: ['vegetal'], porcionGramos: 30, costoKg: 3500, precio: 150 },
  { id: 'd_frutos', categoria: 'acompanamiento', linea: 'dulce', nombre: 'Frutos rojos', emoji: '🍓', color: '#C23B4E', orden: 4, disponible: true, tags: ['vegetal'], porcionGramos: 30, costoKg: 9500, precio: 160 },
  { id: 'd_frutossecos', categoria: 'acompanamiento', linea: 'dulce', nombre: 'Mix de frutos secos', emoji: '🥜', color: '#A67C52', orden: 5, disponible: true, tags: [], porcionGramos: 20, costoKg: 16000, precio: 180 },
  { id: 'd_coco', categoria: 'acompanamiento', linea: 'dulce', nombre: 'Coco rallado', emoji: '🥥', color: '#F3EAD8', orden: 6, disponible: true, tags: ['vegetal'], porcionGramos: 12, costoKg: 6500, precio: 120 },
  { id: 'd_almendra', categoria: 'acompanamiento', linea: 'dulce', nombre: 'Almendras', emoji: '🥜', color: '#C89B6A', orden: 7, disponible: true, tags: [], porcionGramos: 12, costoKg: 11000, precio: 170 },
  { id: 'd_nuez', categoria: 'acompanamiento', linea: 'dulce', nombre: 'Nueces', emoji: '🌰', color: '#8B5E34', orden: 8, disponible: true, tags: [], porcionGramos: 12, costoKg: 14000, precio: 180 },
  { id: 'd_mani', categoria: 'acompanamiento', linea: 'dulce', nombre: 'Maní', emoji: '🥜', color: '#C49A6C', orden: 9, disponible: true, tags: [], porcionGramos: 15, costoKg: 8000, precio: 130 },
  { id: 'd_mermelada', categoria: 'acompanamiento', linea: 'dulce', nombre: 'Mermelada de mora', emoji: '🫐', color: '#5B4B8A', orden: 10, disponible: true, tags: ['vegetal'], porcionGramos: 25, costoKg: 6000, precio: 190 },
  { id: 'd_chancaca', categoria: 'acompanamiento', linea: 'dulce', nombre: 'Chancaca', emoji: '🟤', color: '#8A5A2B', orden: 11, disponible: true, tags: [], porcionGramos: 20, costoKg: 3000, precio: 200 },
];

export const BEBIDAS_SEED = [
  { id: 'b_coca', categoria: 'bebida', nombre: 'Coca-Cola lata', emoji: '🥤', color: '#DC4B3E', orden: 1, disponible: true, precio: 1700, costo: 1000, azucar: 'azucarada' },
  { id: 'b_fanta', categoria: 'bebida', nombre: 'Fanta lata', emoji: '🍊', color: '#F07613', orden: 2, disponible: true, precio: 1700, costo: 1000, azucar: 'azucarada' },
  { id: 'b_sprite', categoria: 'bebida', nombre: 'Sprite lata', emoji: '🍋', color: '#6FBF73', orden: 3, disponible: true, precio: 1700, costo: 1000, azucar: 'azucarada' },
  { id: 'b_agua', categoria: 'bebida', nombre: 'Agua mineral lata', emoji: '💧', color: '#5B8CB8', orden: 4, disponible: true, precio: 1500, costo: 800, azucar: 'normal' },
  { id: 'b_jugo', categoria: 'bebida', nombre: 'Jugo natural lata', emoji: '🧃', color: '#E8A020', orden: 5, disponible: true, precio: 1700, costo: 1100, azucar: 'azucarada' },
];

export const AZUCAR_OPCIONES = [
  ['normal', 'Normal'],
  ['azucarada', 'Azucarada'],
  ['sin_azucar', 'Sin azúcar'],
];

export const OFERTAS_SEED = [
  { id: 'o_1', nombre: '1 empanada', empanadas: 1, bebidas: 0, precio: 2990, activa: true, orden: 1, emoji: '🥟' },
  { id: 'o_2', nombre: '2 empanadas', empanadas: 2, bebidas: 0, precio: 5590, activa: true, orden: 2, emoji: '🥟🥟' },
  { id: 'o_3', nombre: 'Combo Individual', empanadas: 1, bebidas: 1, precio: 4390, activa: true, orden: 3, emoji: '🥟🥤', destacado: 'individual' },
  { id: 'o_4', nombre: '2 empanadas + 2 latas', empanadas: 2, bebidas: 2, precio: 8190, activa: true, orden: 4, emoji: '🥟🥤🥟🥤' },
  { id: 'o_5', nombre: 'Combo Familiar', empanadas: 6, bebidas: 4, precio: 20990, activa: true, orden: 5, emoji: '👨‍👩‍👧‍👦', destacado: 'familiar' },
];

export const SETTINGS_SEED = {
  negocio: {
    nombre: 'Abuela Rosa',
    ubicacion: 'Maipú, Santiago',
    whatsapp: '+56935438480',
    instagram: '@abuelarosa.empanadas',
  },
  lineas: {
    salada: { activa: true },
    dulce: { activa: true, cantidadAcompanamientos: 1, extrasOpcional: true, precioMinEmpanada: 2790, precioMaxEmpanada: 3390 },
  },
  precios: {
    empanadaBase: 2990,
    precioMinEmpanada: 3490,
    precioMaxEmpanada: 3990,
    proteinaExtra: 900,
    quesoExtra: 700,
    acompanamientoExtra: 400,
    maxExtrasPorEmpanada: 2,
  },
  delivery: {
    gratisDesdeEmpanadas: 2,
    costo: 1000,
    comunasGratis: ['Maipú', 'Cerrillos', 'Estación Central'],
  },
  produccion: {
    diasHabilitados: ['viernes', 'sábado', 'domingo'],
    horas: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'],
  },
  pago: {
    onlineActivo: false,
    mensaje: 'Envía tu comprobante por WhatsApp y confirmamos tu pedido.',
  },
  gamificacion: {
    activa: true,
    puntosPorPedido: 50,
    cuponPorInsignia: true,
    cuponCodigo: 'GRACIAS10',
    cuponDescuento: 10,
  },
  combinacionDia: {
    activo: true,
    precio: 2990,
    forzada: null,
  },
  ia: { activa: true },
  masa: { nombre: 'Masa de empanada', porcionGramos: 90, costoKg: 1500 },
  inventario: { umbralEmpanadas: 10 },
};

export const REGLAS_SEED = [
  { id: 'r_reineta', baseTipo: 'proteina', baseId: 'p_reineta', acompanamientos: ['a_albahaca', 'a_tomate', 'a_zapallo'], mensaje: 'A la reineta le queda bien: albahaca, tomate y zapallo italiano' },
  { id: 'r_camaron', baseTipo: 'proteina', baseId: 'p_camaron', acompanamientos: ['a_pimenton', 'a_tomate', 'a_cebolla'], mensaje: 'El camarón brilla con pimentón, tomate y cebolla caramelizada' },
  { id: 'r_carne', baseTipo: 'proteina', baseId: 'p_carne', acompanamientos: ['a_cebolla', 'a_aceituna', 'a_huevo'], mensaje: 'La carne pide cebolla caramelizada y aceituna' },
  { id: 'r_pollo', baseTipo: 'proteina', baseId: 'p_pollo', acompanamientos: ['a_choclo', 'a_champinon', 'a_espinaca'], mensaje: 'Al pollo le cae de maravilla choclo, champiñón y espinaca' },
  { id: 'r_seitan', baseTipo: 'proteina', baseId: 'p_seitan', acompanamientos: ['a_espinaca', 'a_tomate', 'a_acelga'], mensaje: 'El seitan con espinaca, tomate y acelga queda espectacular' },
  { id: 'r_salmon', baseTipo: 'proteina', baseId: 'p_salmon', acompanamientos: ['a_albahaca', 'a_tomate', 'a_cebolla'], mensaje: 'El salmón pide albahaca, tomate y cebolla caramelizada' },
  { id: 'r_gouda', baseTipo: 'queso', baseId: 'q_gouda', acompanamientos: ['a_cebolla', 'a_choclo'], mensaje: 'Gouda + cebolla caramelizada = clásico infaltable' },
  { id: 'r_vegano', baseTipo: 'queso', baseId: 'q_vegano', acompanamientos: ['a_espinaca', 'a_acelga', 'a_tomate'], mensaje: 'El queso vegano ama la verdura verde' },
  // Línea dulce (quesos: reglas sobre los quesos salada que solo aplican en dulce)
  { id: 'r_d_nutella', baseTipo: 'proteina', baseId: 'd_nutella', acompanamientos: ['d_mermelada'], mensaje: 'Nutella con mermelada de mora queda brutal' },
  { id: 'r_d_chocolate', baseTipo: 'proteina', baseId: 'd_chocolate', acompanamientos: ['d_mani'], mensaje: 'Chocolate con maní: el clásico de la casa' },
  { id: 'r_d_manjar', baseTipo: 'proteina', baseId: 'd_manjar', acompanamientos: ['d_nuez'], mensaje: 'El manjar pide nueces, siempre' },
  { id: 'r_d_membrillo', baseTipo: 'proteina', baseId: 'd_membrillo', acompanamientos: ['d_chancaca'], mensaje: 'Membrillo con chancaca: sabor a campo' },
  { id: 'r_d_q_vegano', baseTipo: 'queso', baseId: 'q_vegano', acompanamientos: ['d_coco'], mensaje: 'El queso vegano ama el coco rallado' },
  { id: 'r_d_q_gouda', baseTipo: 'queso', baseId: 'q_gouda', acompanamientos: ['d_mermelada'], mensaje: 'En dulce, el gouda pide mermelada de mora' },
];

export const INSIGNIAS_SEED = [
  { id: 'i_explorador', nombre: 'Explorador de Sabores', descripcion: 'Probaste las 6 proteínas', icono: '🧭', condicion: { tipo: 'proteinasDistintas', valor: 6 }, cupon: 'EXPLORADOR10' },
  { id: 'i_maquero', nombre: 'Maestro del Queso', descripcion: 'Probaste los 4 quesos', icono: '🧀', condicion: { tipo: 'quesosDistintos', valor: 4 }, cupon: 'QUESOMAX' },
  { id: 'i_verde', nombre: 'El Verde Poderoso', descripcion: 'Pediste 3 empanadas vegetarianas o veganas', icono: '🌿', condicion: { tipo: 'veggieCount', valor: 3 }, cupon: 'VERDE15' },
  { id: 'i_marea', nombre: 'Hijo del Mar', descripcion: 'Pediste con pescado o marisco', icono: '🌊', condicion: { tipo: 'marCount', valor: 1 }, cupon: 'MARISKO' },
  { id: 'i_frecuente', nombre: 'Habitual', descripcion: 'Realizaste 5 pedidos', icono: '⭐', condicion: { tipo: 'pedidos', valor: 5 }, cupon: 'FIEL10' },
];

export const COMUNAS_SANTIAGO = [
  'Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central',
  'Huechuraba', 'Independencia', 'La Cisterna', 'La Florida', 'La Granja',
  'La Pintana', 'La Reina', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado',
  'Macul', 'Maipú', 'Ñuñoa', 'Pedro Aguirre Cerda', 'Peñalolén',
  'Providencia', 'Pudahuel', 'Quilicura', 'Quinta Normal', 'Recoleta',
  'Renca', 'Santiago', 'San Joaquín', 'San Miguel', 'San Ramón',
  'Vitacura', 'Flinta', 'San Bernardo', 'Puente Alto',
];

export const DIAS_CODIGO = { viernes: 5, sábado: 6, domingo: 0 };
