import { Link } from 'react-router-dom';
import { useCatalog } from '../contexts/CatalogContext';

export default function Footer() {
  const { settings } = useCatalog();
  const wa = settings?.negocio?.whatsapp || '';
  const num = wa.replace(/[^0-9]/g, '');

  return (
    <footer className="vt-cuerpo mt-10 border-t-2 border-[#4a2c17]/20 px-4 py-8 text-center text-sm opacity-75">
      <p className="vt-serif text-base font-bold uppercase tracking-wide">{settings?.negocio?.nombre || 'Empanadas Abuela Rosa'}</p>
      <p className="mt-1 italic">{settings?.negocio?.ubicacion || 'Maipú, Santiago'}</p>
      <p className="mt-1 italic">Producción: viernes, sábado y domingo</p>
      {settings?.negocio?.instagram && (
        <a
          className="vt-serif mt-2 inline-block font-bold text-[#8b4513] underline-offset-2 hover:underline"
          href={`https://instagram.com/${settings.negocio.instagram.replace('@', '')}`}
          target="_blank"
          rel="noreferrer"
        >
          {settings.negocio.instagram}
        </a>
      )}
      {num && (
        <a
          className="vt-serif mt-1 block font-bold text-[#4a2c17] underline-offset-2 hover:underline"
          href={`https://wa.me/${num}`}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp: {wa}
        </a>
      )}
      <p className="vt-separador mx-auto mt-5 w-40" aria-hidden />
      <p className="mt-3 text-xs italic opacity-60">© {new Date().getFullYear()} — Hecho con amor en Maipú</p>
      <Link
        to="/admin/login"
        className="vt-serif mt-3 inline-block text-[10px] font-bold uppercase tracking-[0.3em] opacity-35 transition hover:opacity-70"
      >
        Panel
      </Link>
    </footer>
  );
}
