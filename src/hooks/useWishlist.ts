import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const GUEST_WISHLIST_KEY = "ahia_guest_wishlist";

const getGuestWishlist = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || "[]");
  } catch {
    return [];
  }
};

const setGuestWishlist = (ids: string[]) => {
  localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(ids));
};

export const useWishlist = () => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load wishlist on mount / user change
  useEffect(() => {
    const load = async () => {
      if (!user) {
        setWishlistIds(getGuestWishlist());
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("wishlists")
          .select("product_id")
          .eq("user_id", user.id);

        if (error) throw error;
        setWishlistIds((data || []).map((row) => row.product_id));
      } catch (err) {
        console.error("Failed to load wishlist", err);
        // Fall back to local state — non-fatal
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [user]);

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const toggle = useCallback(
    async (productId: string, productName: string) => {
      const alreadyWishlisted = wishlistIds.includes(productId);

      if (!user) {
        // Guest: manage via localStorage
        const next = alreadyWishlisted
          ? wishlistIds.filter((id) => id !== productId)
          : [...wishlistIds, productId];
        setGuestWishlist(next);
        setWishlistIds(next);
        toast[alreadyWishlisted ? "message" : "success"](
          alreadyWishlisted
            ? `${productName} removed from wishlist.`
            : `${productName} saved to wishlist.`
        );
        return;
      }

      // Optimistic update
      setWishlistIds((prev) =>
        alreadyWishlisted
          ? prev.filter((id) => id !== productId)
          : [...prev, productId]
      );

      try {
        if (alreadyWishlisted) {
          const { error } = await supabase
            .from("wishlists")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", productId);
          if (error) throw error;
          toast.message(`${productName} removed from wishlist.`);
        } else {
          const { error } = await supabase
            .from("wishlists")
            .insert({ user_id: user.id, product_id: productId });
          if (error) throw error;
          toast.success(`${productName} saved to wishlist.`);
        }
      } catch (err) {
        console.error("Wishlist toggle failed", err);
        // Revert optimistic update
        setWishlistIds((prev) =>
          alreadyWishlisted
            ? [...prev, productId]
            : prev.filter((id) => id !== productId)
        );
        toast.error("Couldn't update wishlist. Please try again.");
      }
    },
    [user, wishlistIds]
  );

  return { wishlistIds, isWishlisted, toggle, isLoading };
};
