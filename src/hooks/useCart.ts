import { createContext, useContext } from "react";
import type { CatalogProduct } from "@/lib/catalog";

export interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string | null;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
  slug: string;
  size?: string | null;
}

export interface CartContextType {
  items: CartItem[];
  loading: boolean;
  subtotal: number;
  addItem: (product: CatalogProduct, quantity?: number, selectedVariantId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
