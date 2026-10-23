// Icono SVG por estado del pedido — compartido por Panel y Pedidos.
import {
  IconoReloj, IconoMoneda, IconoProduccion, IconoCamion, IconoConteo,
} from './IconosAdmin';

export const ESTADO_ICONOS = {
  pendiente_pago: IconoReloj,
  pago_confirmado: IconoMoneda,
  en_preparacion: IconoProduccion,
  en_reparto: IconoCamion,
  entregado: IconoConteo,
};
