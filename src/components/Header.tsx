import { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import CartDrawer from './CartDrawer';
import { useCartStore, selectTotalItems } from '../store/cartStore';

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const totalItems = useCartStore(selectTotalItems);
    const openCart = useCartStore((state) => state.openCart);

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <img
                                src="/logo.png"
                                alt="Fuego"
                                className="h-20 lg:h-24 w-auto transition-transform duration-300 group-hover:scale-105"
                            />
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            <Link
                                to="/"
                                className="text-white/70 hover:text-white font-medium transition-colors duration-200"
                            >
                                Inicio
                            </Link>
                            <Link
                                to="/catalogo"
                                className="text-white/70 hover:text-white font-medium transition-colors duration-200"
                            >
                                Catalogo
                            </Link>
                        </nav>

                        {/* Search & Cart */}
                        <div className="flex items-center gap-4">
                            {/* Desktop Search */}
                            <div className="hidden lg:block w-72">
                                <SearchBar variant="header" />
                            </div>

                            {/* Cart Button */}
                            <button
                                onClick={openCart}
                                className="relative p-2 text-white/70 hover:text-white transition-colors duration-200"
                                aria-label="Abrir carrito"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                    />
                                </svg>
                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-black text-xs font-bold rounded-full flex items-center justify-center">
                                        {totalItems > 99 ? '99+' : totalItems}
                                    </span>
                                )}
                            </button>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
                                aria-label="Menu"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isMobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden py-4 border-t border-border">
                            <div className="mb-4">
                                <SearchBar variant="header" />
                            </div>
                            <nav className="flex flex-col gap-2">
                                <Link
                                    to="/"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    Inicio
                                </Link>
                                <Link
                                    to="/catalogo"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    Catalogo
                                </Link>
                            </nav>
                        </div>
                    )}
                </div>
            </header>

            {/* Spacer for fixed header */}
            <div className="h-16 lg:h-20" />

            {/* Cart Drawer */}
            <CartDrawer />
        </>
    );
}
