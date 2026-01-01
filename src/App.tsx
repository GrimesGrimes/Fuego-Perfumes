import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-black text-white">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/producto/:code" element={<ProductDetail />} />
        </Routes>

        {/* Footer */}
        <footer className="bg-surface border-t border-border py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <img src="/logo.png" alt="Fuego" className="h-10 w-auto" />
                </div>
                <p className="text-white/50 text-sm">
                  Perfumeria fina inspirada en las marcas mas exclusivas del mundo.
                </p>
              </div>

              {/* Links */}
              <div>
                <h3 className="text-white font-semibold mb-4">Enlaces</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="/" className="text-white/50 hover:text-white text-sm transition-colors">
                      Inicio
                    </a>
                  </li>
                  <li>
                    <a href="/catalogo" className="text-white/50 hover:text-white text-sm transition-colors">
                      Catalogo
                    </a>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-white font-semibold mb-4">Contacto</h3>
                <p className="text-white/50 text-sm">
                  Siguenos en nuestras redes sociales para conocer las ultimas novedades.
                </p>
              </div>
            </div>

            <div className="border-t border-border mt-8 pt-8 text-center">
              <p className="text-white/40 text-sm">
                © {new Date().getFullYear()} Fuego. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
