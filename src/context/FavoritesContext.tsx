'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface FavoriteProduct {
  id: string;
  reference: string;
  familyName: string;
  imageUrl?: string;
  addedAt: number;
}

interface FavoritesContextType {
  favorites: FavoriteProduct[];
  toggleFavorite: (product: { id: string; reference: string; familyName: string; imageUrl?: string }) => boolean;
  isFavorite: (productId: string) => boolean;
  removeFavorite: (productId: string) => void;
  clearFavorites: () => void;
  totalFavoritesCount: number;
  isFavoritesOpen: boolean;
  setIsFavoritesOpen: (open: boolean) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const STORAGE_KEY = 'hs_favorites_v1';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load favorites from localStorage', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Multi-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setFavorites(JSON.parse(e.newValue));
        } catch {}
      } else if (e.key === STORAGE_KEY && !e.newValue) {
        setFavorites([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save to localStorage
  const saveFavorites = useCallback((newFavorites: FavoriteProduct[]) => {
    setFavorites(newFavorites);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (e) {
      console.warn('Failed to save favorites to localStorage', e);
    }
  }, []);

  const isFavorite = useCallback(
    (productId: string) => {
      return favorites.some((item) => item.id === productId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    (product: { id: string; reference: string; familyName: string; imageUrl?: string }) => {
      const exists = favorites.some((item) => item.id === product.id);
      let updated: FavoriteProduct[];

      if (exists) {
        updated = favorites.filter((item) => item.id !== product.id);
      } else {
        updated = [
          {
            id: product.id,
            reference: product.reference,
            familyName: product.familyName,
            imageUrl: product.imageUrl,
            addedAt: Date.now(),
          },
          ...favorites,
        ];
      }

      saveFavorites(updated);
      return !exists; // returns true if added, false if removed
    },
    [favorites, saveFavorites]
  );

  const removeFavorite = useCallback(
    (productId: string) => {
      const updated = favorites.filter((item) => item.id !== productId);
      saveFavorites(updated);
    },
    [favorites, saveFavorites]
  );

  const clearFavorites = useCallback(() => {
    saveFavorites([]);
  }, [saveFavorites]);

  const totalFavoritesCount = useMemo(() => favorites.length, [favorites]);

  const value = useMemo(
    () => ({
      favorites,
      toggleFavorite,
      isFavorite,
      removeFavorite,
      clearFavorites,
      totalFavoritesCount,
      isFavoritesOpen,
      setIsFavoritesOpen,
    }),
    [
      favorites,
      toggleFavorite,
      isFavorite,
      removeFavorite,
      clearFavorites,
      totalFavoritesCount,
      isFavoritesOpen,
    ]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
