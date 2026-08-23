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
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load cart from localStorage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save cart to localStorage', e);
    }
  }, [items, isLoaded]);

  const addToCart = (newItem: Omit<CartItem, 'cartons'> & { cartons?: number }) => {
    const qty = Math.max(1, newItem.cartons || 1);
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === newItem.productId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          cartons: updated[existingIndex].cartons + qty,
        };
        return updated;
      }
      return [
        ...prev,
        {
          productId: newItem.productId,
          reference: newItem.reference,
          familyName: newItem.familyName,
          imageUrl: newItem.imageUrl,
          cartons: qty,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const updateCartons = (productId: string, cartons: number) => {
    const validQty = Math.max(1, cartons);
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, cartons: validQty } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCartons = items.reduce((sum, item) => sum + (item.cartons || 1), 0);
  const totalItems = items.length;

  const openCart = () => setIsCartOpen(true);
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
