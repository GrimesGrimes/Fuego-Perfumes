import type { Product } from '../data/products';
import { useCartStore } from '../store/cartStore';
import { Link } from 'react-router-dom';

interface QuickViewModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
    const addItem = useCartStore((state) => state.addItem);

    if (!isOpen || !product) return null;

    const handleAddToCart = () => {
        addItem(product);
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="bg-surface border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all z-10"
                        aria-label="Cerrar"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="grid md:grid-cols-2 gap-6 p-6">
                        {/* Image */}
                        <div className="relative aspect-square bg-surface-lighter rounded-xl overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center p-8">
                                <img
                                    src={product.image}
                                    alt={product.inspiredByName}
                                    className="w-full h-full object-contain drop-shadow-2xl"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder.png';
                                    }}
                                />
                            </div>
                            {/* Glow */}
                            <div className="absolute inset-0 glow-gold opacity-50 pointer-events-none" />
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
                            <p className="text-gold font-mono font-bold text-2xl mb-2">{product.code}</p>

                            {/* Name */}
                            <h2 className="text-white text-xl font-semibold mb-1">
                                Inspirado en: {product.inspiredByName}
                            </h2>

                            {/* House */}
                            <p className="text-white/50 text-lg mb-6">{product.house}</p>

                            {/* Description placeholder */}
                            <p className="text-white/60 text-sm mb-6">
                                Fragancia de alta calidad inspirada en {product.inspiredByName} de {product.house}.
                                Perfumeria fina con concentracion premium y larga duracion.
                            </p>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddToCart}
                                    className="btn-primary flex-1"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Agregar al Carrito
                                </button>
                                <Link
                                    to={`/producto/${encodeURIComponent(product.code)}`}
                                    onClick={onClose}
                                    className="btn-secondary"
                                >
                                    Ver Detalles
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
        </>
    );
}
