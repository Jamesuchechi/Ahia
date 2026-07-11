import { useState, useRef, useEffect } from "react";
import ImageZoom from "./ImageZoom";
import type { CatalogProductImage } from "@/lib/catalog";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface ProductImageGalleryProps {
  images: CatalogProductImage[];
}

const ProductImageGallery = ({ images }: ProductImageGalleryProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomInitialIndex, setZoomInitialIndex] = useState(0);

  // Zoom magnifier states
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    transformOrigin: "center center",
    transform: "scale(1)"
  });
  const [isHovering, setIsHovering] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Reset active image on catalog switch
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [images]);

  const nextImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleImageClick = (index: number) => {
    setZoomInitialIndex(index);
    setIsZoomOpen(true);
  };

  // Magnifier positioning
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(2.2)"
    });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setZoomStyle({
      transformOrigin: "center center",
      transform: "scale(1)"
    });
  };

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const difference = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(difference) > minSwipeDistance) {
      if (difference > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-muted flex items-center justify-center border border-border">
        <span className="text-sm font-light text-muted-foreground">No images available</span>
      </div>
    );
  }

  const activeImage = images[currentImageIndex];

  return (
    <div className="w-full flex flex-col md:flex-row gap-4">
      {/* Thumbnails list (Vertical layout for desktop, horizontal layout for mobile) */}
      {images.length > 1 && (
        <div className="order-2 md:order-1 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible md:w-20 shrink-0 select-none pb-2 md:pb-0 scrollbar-none">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              onMouseEnter={() => setCurrentImageIndex(index)}
              className={`w-16 h-16 md:w-20 md:h-20 border shrink-0 overflow-hidden transition-all duration-200 ${
                index === currentImageIndex 
                  ? "border-primary opacity-100" 
                  : "border-border/60 opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={image.url}
                alt={image.alt_text || `Product view thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Active product display panel */}
      <div className="order-1 md:order-2 flex-1 relative bg-muted border border-border overflow-hidden select-none">
        <div
          className="w-full aspect-[4/5] overflow-hidden cursor-zoom-in relative touch-pan-y"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleImageClick(currentImageIndex)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={activeImage?.url}
            alt={activeImage?.alt_text || "Product Image"}
            style={zoomStyle}
            className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-100 ease-out"
          />

          {/* Hover indicator overlay */}
          <div className={`absolute inset-0 bg-black/5 pointer-events-none transition-opacity duration-200 ${
            isHovering ? "opacity-0" : "opacity-100"
          }`} />

          {/* Full Screen Expand Trigger Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleImageClick(currentImageIndex);
            }}
            className="absolute top-4 right-4 bg-background/90 backdrop-blur-xs border border-border p-2 hover:bg-background transition-colors z-10"
            aria-label="Zoom image"
          >
            <Maximize2 size={16} className="text-foreground" />
          </button>
        </div>

        {/* Carousel arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/95 border border-border/80 p-2 text-foreground hover:bg-background transition-all shadow-xs z-10"
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/95 border border-border/80 p-2 text-foreground hover:bg-background transition-all shadow-xs z-10"
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Numeric progress indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-xs border border-border px-3 py-1 text-[10px] tracking-wider uppercase font-medium">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Expand Fullscreen Gallery Modal */}
      <ImageZoom
        images={images.map((image) => image.url)}
        initialIndex={zoomInitialIndex}
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
      />
    </div>
  );
};

export default ProductImageGallery;