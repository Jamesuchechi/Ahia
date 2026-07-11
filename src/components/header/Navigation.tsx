import { ArrowRight, X, User, LogOut, Shield, Bell, Trash2, CheckCheck, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ShoppingBag from "./ShoppingBag";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getCatalogCategories, type CatalogProduct, formatPrice } from "@/lib/catalog";
import { useCart } from "@/hooks/useCart";
import { useNotifications } from "@/hooks/useNotifications";
import { useWishlist } from "@/hooks/useWishlist";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { items, updateQuantity } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { wishlistIds, toggle: toggleWishlist } = useWishlist();
  const [wishlistProducts, setWishlistProducts] = useState<CatalogProduct[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [offCanvasType, setOffCanvasType] = useState<'favorites' | 'notifications' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShoppingBagOpen, setIsShoppingBagOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [categories, setCategories] = useState<Array<{id:string; name:string; slug:string}>>([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  
  // Preload dropdown images for faster display
  useEffect(() => {
    const loadCategories = async () => {
      const nextCategories = await getCatalogCategories();
      setCategories(nextCategories);
    };

    loadCategories();
    const imagesToPreload = [
      "/rings-collection.png",
      "/earrings-collection.png", 
      "/arcus-bracelet.png",
      "/span-bracelet.png",
      "/founders.png"
    ];
    
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Load products in the wishlist when the wishlistIds list changes
  useEffect(() => {
    if (wishlistIds.length === 0) {
      setWishlistProducts([]);
      return;
    }

    const loadWishlistProducts = async () => {
      setLoadingWishlist(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, slug, description, base_price, status, category_id, created_at, categories:category_id(name, slug)")
          .in("id", wishlistIds);

        if (error) throw error;
        
        interface RawWishlistProduct {
          id: string;
          slug: string;
          name: string;
          description?: string | null;
          base_price: string | number;
          status: string;
          category_id: string;
          categories: { name: string; slug: string } | null;
          created_at: string;
        }

        // Map the results to CatalogProduct
        const mapped: CatalogProduct[] = ((data as unknown as RawWishlistProduct[]) || []).map((product) => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description || "",
          base_price: Number(product.base_price || 0),
          status: product.status,
          category_id: product.category_id,
          category_name: product.categories?.name || null,
          category_slug: product.categories?.slug || null,
          created_at: product.created_at,
          images: [],
          variants: [],
        }));

        interface RawProductImage {
          id: string;
          url: string;
          alt_text: string | null;
          sort_order: number;
        }

        interface RawProductVariant {
          id: string;
          sku: string;
          stock_qty: number;
          price_override: number | null;
        }

        // Fetch image & variants details for each product
        const fullyLoaded = await Promise.all(
          mapped.map(async (product) => {
            const { data: imageData } = await supabase
              .from("product_images")
              .select("id, url, alt_text, sort_order")
              .eq("product_id", product.id)
              .order("sort_order", { ascending: true });

            const { data: variantData } = await supabase
              .from("product_variants")
              .select("id, sku, stock_qty, price_override")
              .eq("product_id", product.id);

            return {
              ...product,
              images: ((imageData as unknown as RawProductImage[]) || []).map((img) => ({ 
                id: img.id, 
                url: img.url, 
                alt_text: img.alt_text || "", 
                sort_order: img.sort_order 
              })),
              variants: ((variantData as unknown as RawProductVariant[]) || []).map((v) => ({ 
                id: v.id, 
                sku: v.sku, 
                stock_qty: v.stock_qty, 
                price_override: v.price_override ? Number(v.price_override) : null 
              })),
            };
          })
        );

        setWishlistProducts(fullyLoaded);
      } catch (err) {
        console.error("Failed to load wishlist products:", err);
      } finally {
        setLoadingWishlist(false);
      }
    };

    void loadWishlistProducts();
  }, [wishlistIds]);

  const popularSearches = [
    "Sculptural Objects",
    "Minimalist Designs", 
    "Signature Collection",
    "Handcrafted Essentials",
    "New Arrivals",
    "Sustainable Art"
  ];
  
  const navItems = [
    { 
      name: "Shop", 
      href: "/category/all",
      submenuItems: categories.map((category) => category.name),
      images: [
        { src: "/rings-collection.png", alt: "Rings Collection", label: "Rings" },
        { src: "/earrings-collection.png", alt: "Earrings Collection", label: "Earrings" }
      ]
    },
    { 
      name: "New in", 
      href: "/category/new-in",
      submenuItems: [
        "This Week's Arrivals",
        "Spring Collection",
        "Featured Designers",
        "Limited Edition",
        "Pre-Orders"
      ],
      images: [
        { src: "/arcus-bracelet.png", alt: "Arcus Bracelet", label: "Arcus Bracelet" },
        { src: "/span-bracelet.png", alt: "Span Bracelet", label: "Span Bracelet" }
      ]
    },
    { 
      name: "Lookbook", 
      href: "/lookbook",
    },
    { 
      name: "About", 
      href: "/about/our-story",
      submenuItems: [
        "Our Story",
        "Sustainability",
        "Size Guide",
        "Customer Care",
        "Store Locator"
      ],
      images: [
        { src: "/founders.png", alt: "Company Founders", label: "Read our story" }
      ]
    }
  ];

  return (
    <nav 
      className="relative" 
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <div className="flex items-center justify-between h-16 px-6">
        {/* Mobile hamburger button */}
        <button
          className="lg:hidden p-2 mt-0.5 text-nav-foreground hover:text-nav-hover transition-colors duration-200"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-5 h-5 relative">
            <span className={`absolute block w-5 h-px bg-current transform transition-all duration-300 ${
              isMobileMenuOpen ? 'rotate-45 top-2.5' : 'top-1.5'
            }`}></span>
            <span className={`absolute block w-5 h-px bg-current transform transition-all duration-300 top-2.5 ${
              isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
            }`}></span>
            <span className={`absolute block w-5 h-px bg-current transform transition-all duration-300 ${
              isMobileMenuOpen ? '-rotate-45 top-2.5' : 'top-3.5'
            }`}></span>
          </div>
        </button>

        {/* Left navigation - Hidden on tablets and mobile */}
        <div className="hidden lg:flex space-x-8">
          {navItems.map((item) => (
            <div
              key={item.name}
              className="relative"
              onMouseEnter={() => setActiveDropdown(item.name)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to={item.href}
                className="text-nav-foreground hover:text-nav-hover transition-colors duration-200 text-sm font-light py-6 block"
              >
                {item.name}
              </Link>
            </div>
          ))}
        </div>

        {/* Center logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link to="/" className="block">
            <img 
              src="/ahia-1.svg" 
              alt="Ahia" 
              className="h-6 w-auto"
            />
          </Link>
        </div>

        {/* Right icons */}
        <div className="flex items-center space-x-2">
          <button 
            className="p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200"
            aria-label="Search"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200"
                  aria-label="Account"
                >
                  <User className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 font-light bg-white border border-border shadow-sm">
                <DropdownMenuLabel className="font-normal text-xs text-muted-foreground uppercase tracking-wider">
                  Account Details
                </DropdownMenuLabel>
                <div className="px-2 py-1.5 text-sm text-foreground truncate font-normal">
                  {profile ? `${profile.first_name} ${profile.last_name}` : user.email}
                </div>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/admin" className="flex items-center gap-2 w-full">
                      <Shield className="w-4 h-4 text-primary" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => { signOut(); toast.success("Signed out successfully"); }} className="cursor-pointer text-destructive focus:text-destructive">
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link 
              to="/auth" 
              className="p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200"
              aria-label="Sign In"
            >
              <User className="w-5 h-5" />
            </Link>
          )}

          {user && (
            <button
              className="p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200 relative"
              aria-label="Notifications"
              onClick={() => setOffCanvasType('notifications')}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          )}

          <button 
            className="hidden lg:block p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200"
            aria-label="Favorites"
            onClick={() => setOffCanvasType('favorites')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>
          <button 
            className="p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200 relative"
            aria-label="Shopping bag"
            onClick={() => setIsShoppingBagOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[30%] text-[0.5rem] font-semibold text-black pointer-events-none">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Full width dropdown */}
      {activeDropdown && navItems.find(item => item.name === activeDropdown)?.submenuItems && (
        <div 
          className="absolute top-full left-0 right-0 bg-nav border-b border-border z-50"
          onMouseEnter={() => setActiveDropdown(activeDropdown)}
          onMouseLeave={() => setActiveDropdown(null)}
        >
          <div className="px-6 py-8">
            <div className="flex justify-between w-full">
              {/* Left side - Menu items */}
              <div className="flex-1">
                <ul className="space-y-2">
                   {navItems
                     .find(item => item.name === activeDropdown)
                     ?.submenuItems.map((subItem, index) => (
                      <li key={index}>
                        <Link 
                          to={activeDropdown === "About" ? `/about/${subItem.toLowerCase().replace(/\s+/g, '-')}` : `/category/${categories.find((category) => category.name === subItem)?.slug || subItem.toLowerCase()}`}
                          className="text-nav-foreground hover:text-nav-hover transition-colors duration-200 text-sm font-light block py-2"
                        >
                          {subItem}
                        </Link>
                      </li>
                   ))}
                </ul>
              </div>

              {/* Right side - Images */}
              <div className="flex space-x-6">
                {navItems
                  .find(item => item.name === activeDropdown)
                  ?.images.map((image, index) => {
                    // Determine the link destination based on dropdown and image
                    let linkTo = "/";
                    if (activeDropdown === "Shop") {
                      if (image.label === "Rings") linkTo = "/category/rings";
                      else if (image.label === "Earrings") linkTo = "/category/earrings";
                    } else if (activeDropdown === "New in") {
                      if (image.label === "Arcus Bracelet") linkTo = "/product/arcus-bracelet";
                      else if (image.label === "Span Bracelet") linkTo = "/product/span-bracelet";
                    } else if (activeDropdown === "About") {
                      linkTo = "/about/our-story";
                    }
                    
                    return (
                      <Link key={index} to={linkTo} className="w-[400px] h-[280px] cursor-pointer group relative overflow-hidden block">
                        <img 
                          src={image.src}
                          alt={image.alt}
                          className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-90"
                        />
                        {(activeDropdown === "Shop" || activeDropdown === "New in" || activeDropdown === "About") && (
                          <div className="absolute bottom-2 left-2 text-white text-xs font-light flex items-center gap-1">
                            <span>{image.label}</span>
                            <ArrowRight size={12} />
                          </div>
                        )}
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search overlay */}
      {isSearchOpen && (
        <div 
          className="absolute top-full left-0 right-0 bg-nav border-b border-border z-50"
        >
          <div className="px-6 py-8">
            <div className="max-w-2xl mx-auto">
              {/* Search input */}
              <div className="relative mb-8">
                <div className="flex items-center border-b border-border pb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-nav-foreground mr-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search for products..."
                    className="flex-1 bg-transparent text-nav-foreground placeholder:text-nav-foreground/60 outline-none text-lg"
                    autoFocus
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        const params = new URLSearchParams();
                        params.set("q", searchValue.trim());
                        navigate(`/category/all?${params.toString()}`);
                        setIsSearchOpen(false);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Popular searches */}
              <div>
                <h3 className="text-nav-foreground text-sm font-light mb-4">Popular Searches</h3>
                <div className="flex flex-wrap gap-3">
                  {popularSearches.map((search, index) => (
                    <button
                      key={index}
                      className="text-nav-foreground hover:text-nav-hover text-sm font-light py-2 px-4 border border-border rounded-full transition-colors duration-200 hover:border-nav-hover"
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set("q", search);
                        navigate(`/category/all?${params.toString()}`);
                        setIsSearchOpen(false);
                      }}
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile navigation menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-nav border-b border-border z-50">
          <div className="px-6 py-8">
            <div className="space-y-6">
              {navItems.map((item, index) => (
                <div key={item.name}>
                  <Link
                    to={item.href}
                    className="text-nav-foreground hover:text-nav-hover transition-colors duration-200 text-lg font-light block py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                   <div className="mt-3 pl-4 space-y-2">
                     {item.submenuItems.map((subItem, subIndex) => (
                       <Link
                         key={subIndex}
                         to={item.name === "About" ? `/about/${subItem.toLowerCase().replace(/\s+/g, '-')}` : `/category/${categories.find((category) => category.name === subItem)?.slug || subItem.toLowerCase()}`}
                         className="text-nav-foreground/70 hover:text-nav-hover text-sm font-light block py-1"
                         onClick={() => setIsMobileMenuOpen(false)}
                       >
                         {subItem}
                       </Link>
                     ))}
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Shopping Bag Component */}
      <ShoppingBag 
        isOpen={isShoppingBagOpen}
        onClose={() => setIsShoppingBagOpen(false)}
        cartItems={items}
        updateQuantity={updateQuantity}
        onViewFavorites={() => {
          setIsShoppingBagOpen(false);
          setOffCanvasType('favorites');
        }}
      />
      
      {/* Favorites Off-canvas overlay */}
      {offCanvasType === 'favorites' && (
        <div className="fixed inset-0 z-50 h-screen">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 h-screen"
            onClick={() => setOffCanvasType(null)}
          />
          
          {/* Off-canvas panel */}
          <div className="absolute right-0 top-0 h-screen w-96 bg-background border-l border-border animate-slide-in-right flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-light text-foreground flex items-center gap-2">
                <Heart className="w-4 h-4 fill-foreground" />
                <span>Your Favorites</span>
              </h2>
              <button
                onClick={() => setOffCanvasType(null)}
                className="p-2 text-foreground hover:text-muted-foreground transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingWishlist ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-6 h-6 border-t-2 border-foreground rounded-full animate-spin" />
                </div>
              ) : wishlistProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm mb-6">
                    You haven't added any favorites yet. Browse our collection and click the heart icon to save items you love.
                  </p>
                  <Link 
                    to="/category/all" 
                    onClick={() => setOffCanvasType(null)}
                    className="inline-block text-xs font-light tracking-wider uppercase border border-foreground px-6 py-3 hover:bg-foreground hover:text-background transition-colors duration-300"
                  >
                    Shop Collection
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {wishlistProducts.map((product) => (
                    <div key={product.id} className="flex gap-4 pb-4 border-b border-border/50 last:border-b-0">
                      <Link 
                        to={`/product/${product.slug}`}
                        onClick={() => setOffCanvasType(null)}
                        className="w-20 h-20 bg-muted overflow-hidden flex-shrink-0"
                      >
                        {product.images?.[0] ? (
                          <img 
                            src={product.images[0].url} 
                            alt={product.images[0].alt_text} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No img</div>
                        )}
                      </Link>
                      
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/product/${product.slug}`}
                          onClick={() => setOffCanvasType(null)}
                          className="block text-sm font-light text-foreground hover:underline truncate"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs text-muted-foreground font-light mt-1">
                          {product.category_name}
                        </p>
                        <p className="text-sm font-light text-foreground mt-2">
                          {formatPrice(product.base_price)}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleWishlist(product.id, product.name)}
                        className="p-1.5 self-start text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Remove from favorites"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Off-canvas overlay */}
      {offCanvasType === 'notifications' && (
        <div className="fixed inset-0 z-50 h-screen">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 h-screen"
            onClick={() => setOffCanvasType(null)}
          />
          
          {/* Off-canvas panel */}
          <div className="absolute right-0 top-0 h-screen w-[420px] max-w-full bg-background border-l border-border animate-slide-in-right flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-light text-foreground">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-semibold bg-red-500 text-white px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck size={18} />
                  </button>
                )}
                <button
                  onClick={() => setOffCanvasType(null)}
                  className="p-2 text-foreground hover:text-muted-foreground transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-20 px-6">
                  <p className="text-muted-foreground text-sm font-light">
                    All caught up! No notifications yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-6 transition-colors duration-200 relative group flex gap-3 ${
                        !notif.read ? "bg-muted/10" : ""
                      }`}
                    >
                      {/* Unread dot indicator */}
                      {!notif.read && (
                        <div className="absolute left-2.5 top-[26px] w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                      
                      <div className="flex-1 space-y-1.5 pr-8">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`text-sm font-medium text-foreground ${!notif.read ? "font-normal" : "font-light"}`}>
                            {notif.title}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground font-light leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 font-light">
                          {new Date(notif.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="absolute right-4 top-5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded"
                            title="Mark as read"
                          >
                            <CheckCheck size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;