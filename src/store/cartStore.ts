import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../data/products';

export interface CartItem {
    product: Product;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;
    addItem: (product: Product) => void;
    removeItem: (code: string) => void;
    updateQuantity: (code: string, quantity: number) => void;
    clearCart: () => void;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            addItem: (product: Product) => {
                const { items } = get();
                const existingItem = items.find((item) => item.product.code === product.code);

                if (existingItem) {
                    set({
                        items: items.map((item) =>
                            item.product.code === product.code
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                    });
                } else {
                    set({ items: [...items, { product, quantity: 1 }] });
                }
            },

            removeItem: (code: string) => {
                set({ items: get().items.filter((item) => item.product.code !== code) });
            },

            updateQuantity: (code: string, quantity: number) => {
                if (quantity <= 0) {
                    get().removeItem(code);
                    return;
                }
                set({
                    items: get().items.map((item) =>
                        item.product.code === code ? { ...item, quantity } : item
                    ),
                });
            },

            clearCart: () => set({ items: [] }),
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),
            toggleCart: () => set({ isOpen: !get().isOpen }),
        }),
        {
            name: 'fuego-cart',
            partialize: (state) => ({ items: state.items }),
        }
    )
);

// Computed selectors
export const selectTotalItems = (state: CartState) =>
    state.items.reduce((total, item) => total + item.quantity, 0);

export const selectSubtotal = (state: CartState) =>
    state.items.reduce((total, item) => total + item.quantity * 45, 0); // Placeholder price
