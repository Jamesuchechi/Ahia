import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const CustomStar = ({ filled, onClick, className }: { filled: boolean; onClick?: () => void; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`w-5 h-5 ${onClick ? "cursor-pointer" : ""} ${filled ? "text-foreground" : "text-muted-foreground/30"} ${className ?? ""}`}
    onClick={onClick}
  >
    <path
      fillRule="evenodd"
      d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
      clipRule="evenodd"
    />
  </svg>
);

interface ReviewProductProps {
  productId: string;
  hasReviewed: boolean;
  isSubmitting: boolean;
  onSubmit: (rating: number, body: string) => Promise<boolean>;
}

const ReviewProduct = ({ productId: _productId, hasReviewed, isSubmitting, onSubmit }: ReviewProductProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async () => {
    const success = await onSubmit(rating, review);
    if (success) {
      setIsOpen(false);
      setRating(0);
      setHoverRating(0);
      setReview("");
    }
  };

  if (!user) {
    return (
      <div className="text-sm font-light text-muted-foreground py-2">
        <Link to="/auth" className="underline hover:no-underline">
          Sign in
        </Link>{" "}
        to leave a review.
      </div>
    );
  }

  if (hasReviewed) {
    return (
      <div className="text-sm font-light text-muted-foreground py-2">
        You've already reviewed this product. Thank you!
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-12 font-light rounded-none border-foreground text-foreground hover:bg-foreground hover:text-background"
        >
          Write a Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md !rounded-none">
        <DialogHeader>
          <DialogTitle className="font-light text-xl">Review product</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-light text-foreground">Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <CustomStar
                  key={star}
                  filled={star <= (hoverRating || rating)}
                  onClick={() => setRating(star)}
                  className="transition-colors"
                />
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-muted-foreground">
                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-light text-foreground">Your review</label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts about this product..."
              className="min-h-24 resize-none rounded-none font-light"
            />
            <p className="text-xs text-muted-foreground text-right">{review.length}/1000</p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || review.trim() === "" || isSubmitting || review.length > 1000}
            className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-light rounded-none"
          >
            {isSubmitting ? "Submitting…" : "Submit review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewProduct;