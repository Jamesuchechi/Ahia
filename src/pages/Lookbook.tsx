import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { getCatalogProductByIdentifier, formatPrice, type CatalogProduct } from "@/lib/catalog";
import { ShoppingBag, ChevronRight, Plus, MapPin, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LookSpot {
  id: string;
  x: number; // percentage from left
  y: number; // percentage from top
  productId: string;
}

interface CampaignLook {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  spots: LookSpot[];
}

interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  coverImage: string;
  looks: CampaignLook[];
}

const CAMPAIGNS: Campaign[] = [
  {
    id: "sartorial-nomad",
    title: "Sartorial Nomad",
    subtitle: "Autumn / Winter Campaign",
    description: "A study in minimal tailoring, fluid outerwear, and modern silhouettes crafted for city wanderers.",
    coverImage: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop",
    looks: [
      {
        id: "nomad-look-1",
        title: "Look 01: The Structured Trench",
        description: "An iconic camel trench layered over tailored knitwear, completed with modern sculptural accessories.",
        imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop",
        spots: [
          { id: "spot-1", x: 50, y: 22, productId: "pantheon-earrings" },
          { id: "spot-2", x: 45, y: 70, productId: "eclipse-bracelet" }
        ]
      },
      {
        id: "nomad-look-2",
        title: "Look 02: Monochromatic Drapes",
        description: "Soft off-white textures paired with sharp angles for a timeless, sophisticated uniform.",
        imageUrl: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=1200&auto=format&fit=crop",
        spots: [
          { id: "spot-3", x: 52, y: 15, productId: "halo-earrings" }
        ]
      }
    ]
  },
  {
    id: "summer-oasis",
    title: "Summer Oasis",
    subtitle: "High Summer Campaign",
    description: "Breezy linens, sun-kissed textures, and relaxed silhouettes inspired by slow living and warm coastal light.",
    coverImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop",
    looks: [
      {
        id: "oasis-look-1",
        title: "Look 01: The Linen Sundress",
        description: "A lightweight, breathable canary-yellow dress styled with contemporary statement earrings.",
        imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop",
        spots: [
          { id: "spot-4", x: 52, y: 18, productId: "oblique-earrings" }
        ]
      },
      {
        id: "oasis-look-2",
        title: "Look 02: Coastal Elegance",
        description: "Relaxed silhouettes in neutral tones reflecting the serene colors of dry sand and ocean foam.",
        imageUrl: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1200&auto=format&fit=crop",
        spots: [
          { id: "spot-5", x: 51, y: 22, productId: "lintel-earrings" }
        ]
      }
    ]
  },
  {
    id: "urban-monolith",
    title: "Urban Monolith",
    subtitle: "Pre-Fall Campaign",
    description: "Structured wools, sharp angles, and architectural details in a palette of deep charcoal and matte black.",
    coverImage: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop",
    looks: [
      {
        id: "monolith-look-1",
        title: "Look 01: Structured Geometry",
        description: "A double-breasted wool blazer layered over structural pieces, finished with clean geometric lines.",
        imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop",
        spots: [
          { id: "spot-6", x: 52, y: 16, productId: "oblique-earrings" }
        ]
      },
      {
        id: "monolith-look-2",
        title: "Look 02: Dark Modernity",
        description: "Tailored outerwear in high-texture fabrics paired with delicate metalwork highlights.",
        imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
        spots: [
          { id: "spot-7", x: 53, y: 28, productId: "pantheon-earrings" }
        ]
      }
    ]
  }
];

interface DBLookbookSpot {
  id: string;
  x: number;
  y: number;
  product_id: string;
}

interface DBLook {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  sort_order: number;
  look_spots?: DBLookbookSpot | DBLookbookSpot[];
}

interface DBLookbook {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_image: string | null;
  looks?: DBLook | DBLook[];
}

const Lookbook = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(CAMPAIGNS);
  const [activeCampaign, setActiveCampaign] = useState<Campaign>(CAMPAIGNS[0]);
  const [activeLookIndex, setActiveLookIndex] = useState<number>(0);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [lookProducts, setLookProducts] = useState<Record<string, CatalogProduct>>({});
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  
  const { addItem } = useCart();

  // Fetch campaign lookbooks dynamically from Supabase database
  useEffect(() => {
    const fetchLookbooks = async () => {
      try {
        const { data: lookbooksData, error } = await supabase
          .from("lookbooks")
          .select(`
            id,
            title,
            subtitle,
            description,
            cover_image,
            looks (
              id,
              title,
              description,
              image_url,
              sort_order,
              look_spots (
                id,
                x,
                y,
                product_id
              )
            )
          `)
          .eq("status", "published")
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Could not load lookbooks from database, falling back to local campaign assets:", error.message);
          return;
        }

        if (lookbooksData && lookbooksData.length > 0) {
          const typedData = lookbooksData as unknown as DBLookbook[];
          const mappedCampaigns: Campaign[] = typedData.map((lb) => {
            const rawLooks = Array.isArray(lb.looks) ? lb.looks : lb.looks ? [lb.looks] : [];
            const sortedLooks = [...rawLooks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            
            return {
              id: lb.id,
              title: lb.title,
              subtitle: lb.subtitle || "",
              description: lb.description || "",
              coverImage: lb.cover_image || "",
              looks: sortedLooks.map((lk) => {
                const rawSpots = Array.isArray(lk.look_spots) ? lk.look_spots : lk.look_spots ? [lk.look_spots] : [];
                return {
                  id: lk.id,
                  title: lk.title,
                  description: lk.description || "",
                  imageUrl: lk.image_url,
                  spots: rawSpots.map((sp) => ({
                    id: sp.id,
                    x: sp.x,
                    y: sp.y,
                    productId: sp.product_id
                  }))
                };
              })
            };
          });

          setCampaigns(mappedCampaigns);
          setActiveCampaign(mappedCampaigns[0]);
        }
      } catch (e) {
        console.warn("Exception while loading lookbooks from database, falling back to local assets:", e);
      }
    };

    fetchLookbooks();
  }, []);

  const currentLook = useMemo(() => {
    return activeCampaign?.looks?.[activeLookIndex] || { id: "", title: "", description: "", imageUrl: "", spots: [] };
  }, [activeCampaign, activeLookIndex]);

  // Fetch products for current look spots
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      const fetched: Record<string, CatalogProduct> = {};
      
      const promises = currentLook.spots.map(async (spot) => {
        try {
          const product = await getCatalogProductByIdentifier(spot.productId);
          if (product) {
            fetched[spot.productId] = product;
          }
        } catch (e) {
          console.error("Failed to load product details for lookbook spot", e);
        }
      });

      await Promise.all(promises);
      setLookProducts((prev) => ({ ...prev, ...fetched }));
      setLoadingProducts(false);
      setSelectedSpotId(null); // Reset highlighted spot on look change
    };

    fetchProducts();
  }, [currentLook]);

  const handleAddProductToBag = async (product: CatalogProduct) => {
    const defaultVariant = product.variants?.[0]?.id || undefined;
    await addItem(product, 1, defaultVariant);
    toast.success(`${product.name} added to your bag.`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[45vh] w-full overflow-hidden bg-black flex items-center justify-center">
        <img
          src={activeCampaign.coverImage}
          alt={activeCampaign.title}
          className="absolute inset-0 w-full h-full object-cover opacity-60 filter grayscale-[20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />
        
        <div className="relative text-center z-10 max-w-xl px-6 space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-white/80 font-light">{activeCampaign.subtitle}</p>
          <h1 className="text-4xl md:text-5xl font-light text-white tracking-wide">{activeCampaign.title}</h1>
          <p className="text-sm md:text-base font-light text-white/70 leading-relaxed">
            {activeCampaign.description}
          </p>
        </div>
      </section>

      {/* Campaign Selectors */}
      <div className="border-b border-border bg-background sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 flex justify-center space-x-12 h-16 items-center">
          {campaigns.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => {
                setActiveCampaign(campaign);
                setActiveLookIndex(0);
              }}
              className={`text-sm tracking-widest uppercase transition-all duration-300 relative py-5 ${
                activeCampaign.id === campaign.id
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground font-light"
              }`}
            >
              {campaign.title}
              {activeCampaign.id === campaign.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground animate-fade-in" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Workspace */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Interactive Look Image Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="relative aspect-[3/4] md:aspect-[4/5] bg-muted overflow-hidden group">
              <img
                src={currentLook.imageUrl}
                alt={currentLook.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              />
              
              {/* Interactive Spots Overlay */}
              {!loadingProducts && currentLook.spots.map((spot) => {
                const product = lookProducts[spot.productId];
                const isSelected = selectedSpotId === spot.id;
                if (!product) return null;

                return (
                  <div
                    key={spot.id}
                    className="absolute"
                    style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  >
                    {/* Pulsing Pin */}
                    <button
                      type="button"
                      onClick={() => setSelectedSpotId(isSelected ? null : spot.id)}
                      aria-label={`Shop ${product.name}`}
                      className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                        isSelected 
                          ? "bg-foreground text-background scale-110 shadow-lg" 
                          : "bg-background/80 hover:bg-background text-foreground backdrop-blur-sm shadow-md"
                      }`}
                    >
                      <Plus className={`h-4 w-4 transition-transform duration-300 ${isSelected ? "rotate-45" : ""}`} />
                      <span className="absolute -inset-1 rounded-full border border-white/60 animate-ping opacity-70 pointer-events-none" />
                    </button>

                    {/* Popover Glassmorphic Info Card */}
                    {isSelected && (
                      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-56 p-4 bg-background/90 backdrop-blur-md border border-border shadow-xl rounded-none z-40 animate-slide-in-bottom">
                        <div className="space-y-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Featured Item</p>
                            <h4 className="text-xs font-medium text-foreground line-clamp-1">{product.name}</h4>
                            <p className="text-xs font-light text-muted-foreground mt-0.5">{formatPrice(product.base_price)}</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1 h-7 text-[10px] font-light rounded-none bg-foreground text-background"
                              onClick={() => handleAddProductToBag(product)}
                            >
                              Add to Bag
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 px-2 rounded-none"
                              asChild
                            >
                              <Link to={`/product/${product.slug}`}>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Look Selector Pagination dots */}
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-xs tracking-widest uppercase text-muted-foreground">
                Look {activeLookIndex + 1} of {activeCampaign.looks.length}
              </span>
              <div className="flex space-x-3">
                {activeCampaign.looks.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveLookIndex(idx)}
                    className={`h-2 transition-all duration-300 ${
                      idx === activeLookIndex ? "w-8 bg-foreground" : "w-2 bg-muted hover:bg-muted-foreground/50"
                    } rounded-full`}
                    aria-label={`Go to look ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Editorial / Shop Details Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-36">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-light">The Narrative</p>
              <h2 className="text-2xl font-light text-foreground tracking-wide leading-tight">{currentLook.title}</h2>
              <p className="text-sm font-light text-muted-foreground leading-relaxed">
                {currentLook.description}
              </p>
            </div>

            {/* Shop The Look product grid list */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] text-foreground font-medium">Shop the Look</h3>
              
              {loadingProducts ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 bg-muted/30 animate-pulse rounded-none" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {currentLook.spots.map((spot) => {
                    const product = lookProducts[spot.productId];
                    if (!product) return null;

                    return (
                      <div 
                        key={product.id} 
                        className="flex gap-4 p-3 border border-border bg-muted/5 transition-all hover:bg-muted/10 group relative"
                      >
                        <div className="w-16 h-20 bg-muted/10 overflow-hidden flex-shrink-0">
                          <img 
                            src={product.images?.[0]?.url || ""} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-0.5">
                          <div>
                            <h4 className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors">
                              {product.name}
                            </h4>
                            <p className="text-xs font-light text-muted-foreground mt-0.5">
                              {formatPrice(product.base_price)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-3 text-xs">
                            <button
                              onClick={() => handleAddProductToBag(product)}
                              className="text-foreground hover:text-muted-foreground font-light flex items-center gap-1.5"
                            >
                              <ShoppingBag className="h-3 w-3" />
                              <span>Add to Bag</span>
                            </button>
                            <span className="text-muted-foreground/30">|</span>
                            <Link 
                              to={`/product/${product.slug}`}
                              className="text-muted-foreground hover:text-foreground font-light flex items-center gap-1"
                            >
                              <span>View details</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Campaign Navigation Footer */}
            <div className="bg-muted/10 p-5 space-y-4">
              <h4 className="text-xs uppercase tracking-wider text-foreground font-medium">Explore Campaigns</h4>
              <div className="space-y-2.5">
                {campaigns.filter(c => c.id !== activeCampaign.id).map(campaign => (
                  <button
                    key={campaign.id}
                    onClick={() => {
                      setActiveCampaign(campaign);
                      setActiveLookIndex(0);
                    }}
                    className="w-full flex items-center justify-between text-left text-xs font-light text-muted-foreground hover:text-foreground py-1 transition-colors"
                  >
                    <span>{campaign.title}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Lookbook;
