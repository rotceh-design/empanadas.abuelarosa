import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import { IconoCarrito, IconoLuna, IconoSol } from './Iconos';
import logoAbuela from '../assets/abuela-rosa.png';

export default function Navbar() {
  const { resumen } = useCart();
  const { oscuro, toggle } = useTheme();
  const items = resumen.totalEmpanadas + resumen.totalBebidas;

  return (
    <header className="sticky top-12 z-40 border-b-2 border-[#4a2c17]/25 bg-[#f3e6c8]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoAbuela} alt="" aria-hidden className="h-9 w-9 rounded-full ring-2 ring-[#4a2c17]/40" />
          <span className="vt-serif hidden text-lg font-bold uppercase tracking-wide sm:inline">Abuela Rosa</span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `btn-tap vt-serif rounded-full px-3 py-2 text-sm font-bold uppercase tracking-wide ${
                isActive ? 'bg-[#4a2c17] text-[#f3e6c8]' : 'text-[#4a2c17] hover:bg-[#4a2c17]/10'
              }`
            }
          >
            Inicio
          </NavLink>
          <NavLink
            to="/configurar"
            className={({ isActive }) =>
              `btn-tap vt-serif rounded-full px-3 py-2 text-sm font-bold uppercase tracking-wide ${
                isActive ? 'bg-[#4a2c17] text-[#f3e6c8]' : 'text-[#4a2c17] hover:bg-[#4a2c17]/10'
              }`
            }
          >
            Armar
          </NavLink>
          <button
            type="button"
            onClick={toggle}
            className="btn-tap rounded-full p-2 text-[#4a2c17] opacity-70 hover:opacity-100"
            aria-label={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {oscuro ? <IconoSol /> : <IconoLuna />}
          </button>
          <Link
            to="/carrito"
            className="btn-tap relative rounded-full bg-[#4a2c17] p-2 text-[#f3e6c8]"
            aria-label={`Carrito, ${items} productos`}
          >
            <IconoCarrito />
            {items > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8b4513] px-1 text-[11px] font-extrabold text-[#f3e6c8]">
                {items}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
