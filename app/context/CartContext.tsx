"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define the shape of a Cart Item
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  category?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from LocalStorage on start
  useEffect(() => {
    const savedCart = localStorage.getItem("rigBuildersCart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("rigBuildersCart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        // If exists, increment quantity
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // If new, add to cart
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        image: product.image || "/icons/navbar/products/PC Components.svg", // Fallback image
        quantity: 1,
        category: product.category
      }];
    });
    alert(`${product.name} added to cart!`);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}