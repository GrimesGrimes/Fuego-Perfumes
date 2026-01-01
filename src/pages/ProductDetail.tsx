import { useParams, Link } from 'react-router-dom';
import { getProductByCode, products } from '../data/products';
import { useCartStore } from '../store/cartStore';

export default function ProductDetail() {
    const { code } = useParams<{ code: string }>();
    const product = code ? getProductByCode(decodeURIComponent(code)) : undefined;
    const addItem = useCartStore((state) => state.addItem);
    const openCart = useCartStore((state) => state.openCart);

    if (!product) {
        return (
            <main className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Producto no encontrado</h1>
                    <Link to="/catalogo" className="btn-primary">
                        Volver al Catalogo
                    </Link>
                </div>
            </main>
        );
    }

    const handleAddToCart = () => {
        addItem(product);
        openCart();
    };

    // Get related products (same house or category)
    const relatedProducts = products
        .filter(
            (p) =>
                p.code !== product.code &&
                (p.house === product.house || p.category === product.category)
        )
        .slice(0, 4);

    return (
        <main className="min-h-screen bg-black">
            {/* Breadcrumb */}
            <div className="bg-surface border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <nav className="flex items-center gap-2 text-sm">
                        <Link to="/" className="text-white/50 hover:text-white transition-colors">
                            Inicio
                        </Link>
                        <span className="text-white/30">/</span>
                        <Link to="/catalogo" className="text-white/50 hover:text-white transition-colors">
                            Catalogo
                        </Link>
                        <span className="text-white/30">/</span>
                        <span className="text-gold">{product.code}</span>
                    </nav>
                </div>
            </div>

            {/* Product Detail */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Image */}
                    <div className="relative aspect-square bg-surface-light rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center p-12">
                            <img
                                src={product.image}
                                alt={product.inspiredByName}
                                className="w-full h-full object-contain drop-shadow-[0_30px_60px_rgba(214,176,110,0.25)]"
                                style={{
                                    transform: 'perspective(1000px) rotateX(3deg)',
                                }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder.png';
                                }}
                            />
                        </div>
                        {/* Glow */}
                        <div className="absolute inset-0 glow-gold opacity-30 pointer-events-none" />
                    </div>

                    {/* Info */}
                    <div className="flex flex-col justify-center">
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className={`badge ${product.gender === 'women' ? 'badge-gold' : 'badge-orange'}`}>
                                {product.line} - {product.gender === 'women' ? 'Mujer' : 'Hombre'}
                            </span>
                            {product.category && (
                                <span className="badge-subtle">{product.category}</span>
                            )}
                        </div>

                        {/* Code */}
                        <p className="text-gold font-mono font-bold text-3xl mb-2">{product.code}</p>

                        {/* Name */}
                        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                            Inspirado en: {product.inspiredByName}
                        </h1>

                        {/* House */}
                        <p className="text-xl text-white/60 mb-8">{product.house}</p>

                        {/* Description */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-white mb-3">Descripcion</h2>
                            <p className="text-white/60 leading-relaxed">
                                Fragancia de alta calidad inspirada en {product.inspiredByName} de {product.house}.
                                Perfumeria fina con concentracion premium y larga duracion. Ideal para quienes buscan
                                una fragancia sofisticada {product.gender === 'women' ? 'femenina' : 'masculina'}
                                {product.category ? ` con notas ${product.category.toLowerCase()}` : ''}.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-surface-light border border-border rounded-xl p-4">
                                <p className="text-white/50 text-sm mb-1">Linea</p>
                                <p className="text-white font-semibold">{product.line}</p>
                            </div>
                            <div className="bg-surface-light border border-border rounded-xl p-4">
                                <p className="text-white/50 text-sm mb-1">Genero</p>
                                <p className="text-white font-semibold">{product.gender === 'women' ? 'Femenino' : 'Masculino'}</p>
                            </div>
                            {product.category && (
                                <div className="bg-surface-light border border-border rounded-xl p-4 col-span-2">
                                    <p className="text-white/50 text-sm mb-1">Familia Olfativa</p>
                                    <p className="text-white font-semibold">{product.category}</p>
                                </div>
                            )}
                        </div>

                        {/* Add to Cart */}
                        <button
                            onClick={handleAddToCart}
                            className="btn-primary text-lg py-4 w-full sm:w-auto"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Agregar al Carrito
                        </button>
                    </div>
                </div>
            </section>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section className="bg-surface py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-bold text-white mb-8">Tambien te puede gustar</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((p) => (
                                <Link
                                    key={p.code}
                                    to={`/producto/${encodeURIComponent(p.code)}`}
                                    className="group card"
                                >
                                    <div className="aspect-square bg-surface-lighter rounded-lg mb-4 overflow-hidden">
                                        <div className="w-full h-full flex items-center justify-center p-4">
                                            <img
                                                src={p.image}
                                                alt={p.inspiredByName}
                                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/placeholder.png';
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-gold font-mono font-semibold text-sm mb-1">{p.code}</p>
                                    <p className="text-white font-medium line-clamp-1">{p.inspiredByName}</p>
                                    <p className="text-white/50 text-sm">{p.house}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
}
