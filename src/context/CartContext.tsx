'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  reference: string;
  familyName?: string;
  imageUrl?: string;
  cartons: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'cartons'> & { cartons?: number }) => void;
  updateCartons: (productId: string, cartons: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalCartons: number;
  totalItems: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'hsfashion_cart_items_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const getLatestFromStorage = (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to read cart from storage', e);
    }
    return [];
  };

  const saveAndSync = (newItems: CartItem[]) => {
    setItems(newItems);
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.warn('Failed to save cart to localStorage', e);
    }
  };

  // Initial load on mount
  useEffect(() => {
    const initial = getLatestFromStorage();
    setItems(initial);
  }, []);

  // Listen to storage events from other browser tabs in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed)) {
              setItems(parsed);
            }
          } catch {}
        } else {
          setItems([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addToCart = (newItem: Omit<CartItem, 'cartons'> & { cartons?: number }) => {
    const qty = Math.max(1, newItem.cartons || 1);
    // Read freshest items from localStorage to merge seamlessly across multiple tabs
    const freshItems = getLatestFromStorage();
    const existingIndex = freshItems.findIndex((i) => i.productId === newItem.productId);

    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...freshItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        cartons: updated[existingIndex].cartons + qty,
      };
    } else {
      updated = [
        ...freshItems,
        {
          productId: newItem.productId,
          reference: newItem.reference,
          familyName: newItem.familyName,
          imageUrl: newItem.imageUrl,
          cartons: qty,
        },
      ];
    }

    saveAndSync(updated);
    setIsCartOpen(true);
  };

  const updateCartons = (productId: string, cartons: number) => {
    const validQty = Math.max(1, cartons);
    const freshItems = getLatestFromStorage();
    const updated = freshItems.map((item) =>
      item.productId === productId ? { ...item, cartons: validQty } : item
    );
    saveAndSync(updated);
  };

  const removeFromCart = (productId: string) => {
    const freshItems = getLatestFromStorage();
    const updated = freshItems.filter((item) => item.productId !== productId);
    saveAndSync(updated);
  };

  const clearCart = () => {
    saveAndSync([]);
  };

  const totalCartons = items.reduce((sum, item) => sum + (item.cartons || 1), 0);
  const totalItems = items.length;

  const openCart = () => {
    // Sync freshest items on open
    const fresh = getLatestFromStorage();
    setItems(fresh);
    setIsCartOpen(true);
  };

  const closeCart = () => setIsCartOpen(false);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateCartons,
        removeFromCart,
        clearCart,
        totalCartons,
        totalItems,
        isCartOpen,
        setIsCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
