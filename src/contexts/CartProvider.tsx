import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { CatalogProduct } from "@/lib/catalog";
import { CartContext, type CartItem } from "@/hooks/useCart";

const STORAGE_KEY = "ahia-cart";

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("your-project-id") && !key.includes("your-supabase-anon-key"));
};

const buildItemId = (productId: string, variantId?: string | null) => `${productId}:${variantId || "default"}`;

const readStoredCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStoredCart = (items: CartItem[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const loadCart = async () => {
      setLoading(true);

      const localItems = readStoredCart();
      if (!user) {
        setItems(localItems);
        setLoading(false);
        return;
      }

      if (!isSupabaseConfigured()) {
        setItems(localItems);
        setLoading(false);
        return;
      }

      try {
        const { data: cartData, error: cartError } = await supabase
          .from("carts")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cartError && cartError.code !== "PGRST116") throw cartError;

        let cartId = cartData?.id;
        if (!cartId) {
          const { data: createdCart, error: insertError } = await supabase
            .from("carts")
            .insert({ user_id: user.id })
            .select("id")
            .single();
          if (insertError) throw insertError;
          cartId = createdCart?.id;
        }

        if (localItems.length > 0) {
          const syncableItems = localItems.filter((item) => item.variant_id);
          await supabase.from("cart_items").delete().eq("cart_id", cartId);
          if (syncableItems.length > 0) {
            await supabase.from("cart_items").insert(
              syncableItems.map((item) => ({
                cart_id: cartId,
                variant_id: item.variant_id,
                quantity: item.quantity,
              }))
            );
          }
        }

        const { data: cartItemsData, error: itemsError } = await supabase
          .from("cart_items")
          .select("quantity, variant_id, product_variants!inner(product_id)")
          .eq("cart_id", cartId);

        if (!itemsError && cartItemsData) {
          interface RawCartItem {
            quantity: number;
            variant_id: string;
            product_variants: { product_id: string } | null;
          }
          const syncedItems = ((cartItemsData as unknown as RawCartItem[]) || []).map((entry) => ({
            id: buildItemId(entry.product_variants?.product_id || entry.variant_id, entry.variant_id),
            product_id: entry.product_variants?.product_id || entry.variant_id,
            variant_id: entry.variant_id,
            name: "Saved item",
            price: 0,
            image: "",
            quantity: entry.quantity,
            category: "Collection",
            slug: "",
          }));
          setItems(syncedItems.length > 0 ? syncedItems : localItems);
        } else {
          setItems(localItems);
        }
      } catch {
        setItems(localItems);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [user, authLoading]);

  useEffect(() => {
    if (!loading) {
      writeStoredCart(items);
    }
  }, [items, loading]);

  const persistToSupabase = async (nextItems: CartItem[]) => {
    if (!user || !isSupabaseConfigured()) return;

    try {
      const { data: cartData, error: cartError } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cartError && cartError.code !== "PGRST116") throw cartError;

      let cartId = cartData?.id;
      if (!cartId) {
        const { data: createdCart, error: insertError } = await supabase
          .from("carts")
          .insert({ user_id: user.id })
          .select("id")
          .single();
        if (insertError) throw insertError;
        cartId = createdCart?.id;
      }

      const syncableItems = nextItems.filter((item) => item.variant_id);
      await supabase.from("cart_items").delete().eq("cart_id", cartId);
      if (syncableItems.length > 0) {
        await supabase.from("cart_items").insert(
          syncableItems.map((item) => ({
            cart_id: cartId,
            variant_id: item.variant_id,
            quantity: item.quantity,
          }))
        );
      }
    } catch (error) {
      console.error("Unable to sync cart to Supabase", error);
    }
  };

  const addItem = async (product: CatalogProduct, quantity = 1, selectedVariantId?: string) => {
    const selectedVariant = selectedVariantId
      ? product.variants?.find((v) => v.id === selectedVariantId)
      : product.variants?.[0];

    const variantId = selectedVariant?.id || null;
    const price = selectedVariant && selectedVariant.price_override !== null && selectedVariant.price_override !== undefined
      ? selectedVariant.price_override
      : product.base_price;

    const attributes = (selectedVariant as { attributes?: Array<{ name: string; value: string }> })?.attributes;
    const attributesDesc = attributes && attributes.length > 0
      ? attributes.map(attr => `${attr.name}: ${attr.value}`).join(", ")
      : selectedVariant?.sku ? `SKU: ${selectedVariant.sku}` : null;

    const nextItem: CartItem = {
      id: buildItemId(product.id, variantId),
      product_id: product.id,
      variant_id: variantId,
      name: product.name,
      price,
      image: product.images?.[0]?.url || "",
      quantity,
      category: product.category_name || "Collection",
      slug: product.slug,
      size: attributesDesc,
    };

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === nextItem.id);
      const updatedItems = existingItem
        ? currentItems.map((item) => (item.id === nextItem.id ? { ...item, quantity: item.quantity + quantity } : item))
        : [...currentItems, nextItem];
      void persistToSupabase(updatedItems);
      return updatedItems;
    });
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    setItems((currentItems) => {
      const updatedItems = quantity <= 0
        ? currentItems.filter((item) => item.id !== itemId)
        : currentItems.map((item) => (item.id === itemId ? { ...item, quantity } : item));
      void persistToSupabase(updatedItems);
      return updatedItems;
    });
  };

  const removeItem = async (itemId: string) => {
    setItems((currentItems) => {
      const updatedItems = currentItems.filter((item) => item.id !== itemId);
      void persistToSupabase(updatedItems);
      return updatedItems;
    });
  };

  const clearCart = async () => {
    setItems([]);
    void persistToSupabase([]);
  };

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, loading, subtotal, addItem, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};


