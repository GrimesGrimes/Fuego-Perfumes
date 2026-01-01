import { Link } from 'react-router-dom';
import { type Product } from '../data/products';
import { useCartStore } from '../store/cartStore';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div className="relative bg-surface-light border border-border rounded-2xl p-6 transition-all duration-500 hover:border-gold/40 group h-full flex flex-col">
      {/* Glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none glow-gold" />

      {/* Image Area */}
      <div className="relative aspect-square mb-6 perspective-1000">
        <div
          onClick={() => onQuickView(product)}
          className="absolute inset-0 flex items-center justify-center p-4 transform transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-2 preserve-3d cursor-pointer"
          role="button"
          tabIndex={0}
        >
          <img
            src={product.image}
            alt={product.inspiredByName}
            className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(214,176,110,0.3)]"
            style={{ transform: 'perspective(1000px) rotateX(5deg)' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>

        {/* Quick View Button (Optional overlay) */}
        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="absolute bottom-2 right-2 p-2 bg-surface/80 backdrop-blur border border-border rounded-full text-gold opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gold hover:text-black"
          title="Vista Rápida"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`badge ${product.gender === 'women' ? 'badge-gold' : 'badge-orange'}`}>
          {product.line} - {product.gender === 'women' ? 'Mujer' : 'Hombre'}
        </span>
        {product.category && <span className="badge-subtle">{product.category}</span>}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        <p className="text-gold font-mono font-bold text-xl mb-1">{product.code}</p>

        <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">
          {product.inspiredByName}
        </h3>

        <p className="text-white/50 text-sm mb-5 line-clamp-1">{product.house}</p>

        {/* Actions: siempre abajo, centradas, Ver arriba / Agregar abajo */}
        <div className="mt-auto pt-2 flex flex-col items-center gap-2">
          <Link
            to={`/producto/${encodeURIComponent(product.code)}`}
            className="btn-secondary w-full py-2.5 text-sm justify-center flex items-center"
          >
            Ver
          </Link>

          <button
            type="button"
            onClick={() => addItem(product)}
            className="btn-primary w-full py-2.5 text-sm justify-center flex items-center"
          >
            Agregar al Carrito
          </button>
        </div>
      </div>
    </div>
  );
}
