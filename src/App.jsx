import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CatalogProvider } from './contexts/CatalogContext';
import { CartProvider } from './contexts/CartContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import Banner from './components/Banner';
import ScrollToTop from './components/ScrollToTop';
import Bienvenida from './pages/Bienvenida';
import Envio from './pages/Envio';
import Home from './pages/Home';
import Armar from './pages/Armar';
import Carrito from './pages/Carrito';
import Checkout from './pages/Checkout';
import Ticket from './pages/Ticket';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';

const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));
const AdminPedidos = lazy(() => import('./pages/admin/AdminPedidos'));
const AdminCatalogo = lazy(() => import('./pages/admin/AdminCatalogo'));
const AdminInventario = lazy(() => import('./pages/admin/AdminInventario'));
const AdminOfertas = lazy(() => import('./pages/admin/AdminOfertas'));
const AdminProduccion = lazy(() => import('./pages/admin/AdminProduccion'));
const AdminMetricas = lazy(() => import('./pages/admin/AdminMetricas'));
const AdminReportes = lazy(() => import('./pages/admin/AdminReportes'));
const AdminConfig = lazy(() => import('./pages/admin/AdminConfig'));

export default function App() {
  return (
    <ThemeProvider>
      <CatalogProvider>
        <AuthProvider>
          <PlayerProvider>
            <CartProvider>
              <BrowserRouter>
                <ScrollToTop />
                <Suspense fallback={<div className="p-8 text-center">Cargando…</div>}>
                  <Routes>
                    {/* Flujo principal vintage: bienvenida → envío (1ª vez) → armar → pagar */}
                    <Route path="/" element={<Bienvenida />} />
                    <Route path="/envio" element={<Envio />} />
                    <Route path="/configurar" element={<Tienda><Armar /></Tienda>} />
                    <Route path="/ticket" element={<Tienda><Ticket /></Tienda>} />

                    {/* Home viejo (gamificación, ranking) */}
                    <Route path="/inicio" element={<Tienda><Home /></Tienda>} />
                    <Route path="/carrito" element={<Tienda><Carrito /></Tienda>} />
                    <Route path="/checkout" element={<Tienda><Checkout /></Tienda>} />

                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminPanel />} />
                      <Route path="pedidos" element={<AdminPedidos />} />
                      <Route path="catalogo" element={<AdminCatalogo />} />
                      <Route path="inventario" element={<AdminInventario />} />
                      <Route path="ofertas" element={<AdminOfertas />} />
                      <Route path="produccion" element={<AdminProduccion />} />
                      <Route path="metricas" element={<AdminMetricas />} />
                      <Route path="reportes" element={<AdminReportes />} />
                      <Route path="config" element={<AdminConfig />} />
                    </Route>
                  </Routes>
                </Suspense>
                <Toast />
              </BrowserRouter>
            </CartProvider>
          </PlayerProvider>
        </AuthProvider>
      </CatalogProvider>
    </ThemeProvider>
  );
}

function Tienda({ children }) {
  return (
    <div className="vt-papel vt-tinta flex min-h-screen flex-col">
      <Banner posicion="top" />
      <Navbar />
      <main className="flex-1 pb-16">{children}</main>
      <Footer />
      <Banner posicion="bottom" />
    </div>
  );
}
