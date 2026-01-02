import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CircularGallery from '../components/CircularGallery';
import DomeGallery from '../components/DomeGallery';
import QuickViewModal from '../components/QuickViewModal';

// ✅ Ajusta esta ruta si tu data está en otro lado
import { products, getProductByCode, type Product } from '../data/products';

export default function Home() {
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

    const domeImages = useMemo(
        () =>
            products.map((p) => ({
                src: p.image,
                alt: `${p.inspiredByName} — ${p.code}`,
                code: p.code
            })),
        []
    );

    const handleSelectCode = useCallback((code: string) => {
        const p = getProductByCode(code);
        if (p) setQuickViewProduct(p);
    }, []);

    return (
        <main>
            {/* Hero Section */}
            <section className="relative isolate overflow-hidden min-h-[90svh] py-10 lg:py-0 lg:flex lg:items-center lg:min-h-[calc(100svh-72px)]">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black via-surface to-black" />

                {/* Decorative Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange/5 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* 1) Eyebrow SOLO móvil */}
                    <p className="lg:hidden text-center text-gold text-sm sm:text-base font-semibold tracking-[0.3em] uppercase mb-6">
                        Perfumeria Fina Inspirada
                    </p>

                    <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                        {/* 2) Gallery */}
                        <div className="order-1 lg:order-1">
                            <div className="relative mx-auto lg:mx-0 max-w-[560px]">
                                <div className="absolute -inset-14 bg-gradient-to-br from-gold/10 via-transparent to-orange/10 blur-3xl rounded-[3rem]" />

                                <div className="relative h-[380px] sm:h-[520px] lg:h-[560px]">
                                    <CircularGallery
                                        bend={7}
                                        borderRadius={0.21}
                                        scrollSpeed={3.5}
                                        scrollEase={0.03}
                                        autoplay
                                        autoplayInterval={3000}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3) Texto + Botones */}
                        <div className="order-2 lg:order-2 text-center lg:text-left">
                            <p className="hidden lg:block text-gold text-sm sm:text-base font-semibold tracking-[0.3em] uppercase mb-6">
                                Perfumeria Fina Inspirada
                            </p>

                            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-[1.05] mb-6 break-words">
                                Haz <span className="text-gradient">de tu aroma tu firma</span>
                            </h1>

                            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto lg:mx-0 mb-10">
                                Calidad premium, alta concentración y opciones accesibles. Encuentra tu match por nombre o diseñador
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 sm:justify-center lg:justify-start">
                                <Link
                                    to="/catalogo"
                                    className="btn-primary text-lg px-8 py-4 inline-flex justify-center w-full sm:w-auto"
                                >
                                    Explorar Catalogo
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>

                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dome Gallery Section */}
            <section className="py-16 lg:py-24 bg-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">
                            DESCUBRE
                        </p>
                        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                            Tu próxima firma empieza aquí
                        </h2>
                        <p className="text-white/60 max-w-2xl mx-auto">
                            Explora cada fragancia, revisa sus notas y elige la que va contigo. Agrégala al carrito al instante.
                        </p>
                    </div>

                    <div className="relative h-[560px] sm:h-[640px] lg:h-[760px] rounded-[2rem] overflow-hidden">
                        <DomeGallery
                            images={domeImages}
                            segments={30}                 // ✅ tiles más grandes
                            fit={0.56}
                            minRadius={460}
                            padFactor={0.18}
                            imageBorderRadius="22px"
                            openedImageBorderRadius="26px"
                            overlayBlurColor="#060010"
                            grayscale={false}
                            autoplay
                            autoplaySpeedDegPerSec={7}
                            onSelectCode={handleSelectCode}  // ✅ abre QuickViewModal
                        />
                        {/* Edge soften (blur + vignette) */}
                        <div className="pointer-events-none absolute inset-0">
                            {/* blur SOLO en bordes (centro nítido) */}
                            <div
                            className="
                                absolute inset-0 bg-black/0 backdrop-blur-[10px]
                                [mask-image:radial-gradient(circle,transparent_62%,black_84%)]
                                [-webkit-mask-image:radial-gradient(circle,transparent_62%,black_84%)]
                            "
                            />

                            {/* viñeta para “fundir” con el fondo */}
                            <div className="absolute inset-0 [background:radial-gradient(circle,rgba(0,0,0,0)_55%,rgba(0,0,0,0.72)_100%)]" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Find Your Scent Section */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-12">
                        <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-3">Encuentra tu aroma</p>
                        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Para cada ocasion</h2>
                        <p className="text-white/60 max-w-2xl mx-auto">
                            Selecciona la ocasion y descubre las fragancias perfectas para ti
                        </p>
                    </div>

                    {/* Occasion Cards */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Daily/Office */}
                        <Link
                            to="/catalogo?category=Floral"
                            className="group relative overflow-hidden rounded-2xl bg-surface-light border border-border p-8 transition-all duration-500 hover:border-gold/40 hover:bg-surface-lighter"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative">
                                <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Diario / Oficina</h3>
                                <p className="text-white/50 text-sm mb-4">Aromas frescos y sutiles perfectos para el dia a dia</p>
                                <span className="text-gold text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Explorar
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </div>
                        </Link>

                        {/* Dates */}
                        <Link
                            to="/catalogo?category=Oriental-floral"
                            className="group relative overflow-hidden rounded-2xl bg-surface-light border border-border p-8 transition-all duration-500 hover:border-gold/40 hover:bg-surface-lighter"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative">
                                <div className="w-16 h-16 bg-orange/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Citas</h3>
                                <p className="text-white/50 text-sm mb-4">Fragancias seductoras que dejan huella</p>
                                <span className="text-orange text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Explorar
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </div>
                        </Link>

                        {/* Night */}
                        <Link
                            to="/catalogo?category=Oriental"
                            className="group relative overflow-hidden rounded-2xl bg-surface-light border border-border p-8 transition-all duration-500 hover:border-gold/40 hover:bg-surface-lighter"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative">
                                <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Noche</h3>
                                <p className="text-white/50 text-sm mb-4">Aromas intensos y sofisticados para eventos especiales</p>
                                <span className="text-gold text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Explorar
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Alta Concentracion</h3>
                            <p className="text-white/50 text-sm">Formulas premium con mayor duracion</p>
                        </div>

                        <div>
                            <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Envio Nacional</h3>
                            <p className="text-white/50 text-sm">Entrega rapida a todo el pais</p>
                        </div>

                        <div>
                            <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Mejor Precio</h3>
                            <p className="text-white/50 text-sm">Calidad premium a precios justos</p>
                        </div>
                    </div>
                </div>
            </section>

            <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
            <QuickViewModal
                product={quickViewProduct}
                isOpen={!!quickViewProduct}
                onClose={() => setQuickViewProduct(null)}
            />
        </main>
    );
}
