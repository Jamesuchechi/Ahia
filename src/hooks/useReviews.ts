import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface Review {
  id: string;
  user_id: string;
  rating: number;
  body: string;
  created_at: string;
  // joined from profiles
  reviewer_name: string | null;
}

export const useReviews = (productId: string | undefined) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    if (!productId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("id, user_id, rating, body, created_at, profiles:user_id(first_name, last_name)")
          .eq("product_id", productId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        interface RawReviewRow {
          id: string;
          user_id: string;
          rating: number;
          body: string;
          created_at: string;
          profiles: { first_name: string | null; last_name: string | null } | { first_name: string | null; last_name: string | null }[] | null;
        }

        const getReviewerName = (profiles: RawReviewRow["profiles"]) => {
          if (!profiles) return null;
          const profile = Array.isArray(profiles) ? profiles[0] : profiles;
          if (!profile) return null;
          const parts = [profile.first_name, profile.last_name].filter(Boolean);
          return parts.length > 0 ? parts.join(" ") : "Anonymous";
        };

        const mapped: Review[] = ((data as unknown as RawReviewRow[]) || []).map((r) => ({
          id: r.id,
          user_id: r.user_id,
          rating: r.rating,
          body: r.body,
          created_at: r.created_at,
          reviewer_name: getReviewerName(r.profiles),
        }));



        setReviews(mapped);

        if (user) {
          setHasReviewed(mapped.some((r) => r.user_id === user.id));
        }
      } catch (err) {
        console.error("Failed to load reviews", err);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [productId, user]);

  const submitReview = async (rating: number, body: string): Promise<boolean> => {
    if (!user) {
      toast.error("You must be logged in to leave a review.");
      return false;
    }
    if (!productId) return false;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .insert({ product_id: productId, user_id: user.id, rating, body })
        .select("id, user_id, rating, body, created_at")
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error("You've already reviewed this product.");
        } else {
          throw error;
        }
        return false;
      }

      const newReview: Review = {
        id: data.id,
        user_id: data.user_id,
        rating: data.rating,
        body: data.body,
        created_at: data.created_at,
        reviewer_name: null,
      };

      setReviews((prev) => [newReview, ...prev]);
      setHasReviewed(true);
      toast.success("Review submitted. Thank you!");
      return true;
    } catch (err) {
      console.error("Failed to submit review", err);
      toast.error("Couldn't submit your review. Please try again.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  return { reviews, isLoading, isSubmitting, hasReviewed, submitReview, averageRating };
};
