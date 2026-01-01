import { useCartStore, selectTotalItems } from '../store/cartStore';

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem } = useCartStore();
  const totalItems = useCartStore(selectTotalItems);

  if (!isOpen) return null;

  const handleCheckout = () => {
    const phoneWa = '51982541520'; // +51 982 541 520 (wa.me sin "+")

    const lines: string[] = [];
    lines.push('Hola, quiero realizar el siguiente pedido:');
    lines.push('');

    items.forEach((item, idx) => {
      const p = item.product;
      lines.push(`${idx + 1}) ${p.code} — ${p.inspiredByName} (${p.house})`);
      lines.push(`   • Línea / Género: ${p.line} - ${p.gender === 'women' ? 'Mujer' : 'Hombre'}`);
      if (p.category) lines.push(`   • Categoría: ${p.category}`);
      lines.push(`   • Cantidad: ${item.quantity}`);
      lines.push('');
    });

    lines.push(`Total de productos: ${totalItems}`);
    lines.push('');
    lines.push('Por favor confirmar disponibilidad y enviarme la cotización final. Gracias.');

    const message = lines.join('\n');
    const url = `https://wa.me/${phoneWa}?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-surface border-l border-border z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-white">
            Tu Carrito
            {totalItems > 0 && <span className="ml-2 text-gold">({totalItems})</span>}
          </h2>
          <button
            onClick={closeCart}
            className="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            aria-label="Cerrar carrito"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg className="w-16 h-16 text-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <p className="text-white/60 text-lg mb-2">Tu carrito esta vacio</p>
              <p className="text-white/40 text-sm">Explora nuestro catalogo para encontrar tu fragancia ideal</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.product.code} className="flex gap-4 p-4 bg-surface-light rounded-xl border border-border">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-surface-lighter rounded-lg flex items-center justify-center flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.inspiredByName}
                      className="w-16 h-16 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.png';
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-gold font-mono font-semibold text-sm">{item.product.code}</p>
                    <p className="text-white font-medium truncate">{item.product.inspiredByName}</p>
                    <p className="text-white/50 text-sm truncate">{item.product.house}</p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-border rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.code, item.quantity - 1)}
                          className="px-3 py-1 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                          aria-label="Reducir cantidad"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-white font-medium min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.code, item.quantity + 1)}
                          className="px-3 py-1 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                          aria-label="Aumentar cantidad"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.product.code)}
                        className="text-white/40 hover:text-red-400 transition-colors"
                        aria-label="Eliminar producto"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-border bg-surface-light">
            <div className="flex items-start justify-between mb-4 gap-4">
              <div>
                <p className="text-white/60">Precio</p>
                <p className="text-white/40 text-sm">
                  A cotizar por ventas (S/.). Se confirmará por WhatsApp.
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-sm">Ítems</p>
                <p className="text-2xl font-bold text-white">{totalItems}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="btn-primary w-full text-lg"
            >
              Finalizar Compra
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
