import { supabase } from "@/lib/supabase";
import pantheonImage from "@/assets/pantheon.jpg";
import eclipseImage from "@/assets/eclipse.jpg";
import haloImage from "@/assets/halo.jpg";
import obliqueImage from "@/assets/oblique.jpg";
import lintelImage from "@/assets/lintel.jpg";
import shadowlineImage from "@/assets/shadowline.jpg";
import organicEarring from "@/assets/organic-earring.png";
import linkBracelet from "@/assets/link-bracelet.png";

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface CatalogProductImage {
  id: string;
  url: string;
  alt_text: string;
  sort_order: number;
}

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  base_price: number;
  status: string;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  created_at?: string;
  images: CatalogProductImage[];
  variants: Array<{
    id: string;
    sku: string | null;
    stock_qty: number;
    price_override: number | null;
    attributes?: Array<{
      name: string;
      value: string;
    }>;
  }>;
}

export interface CatalogProductQuery {
  categorySlug?: string | null;
  search?: string | null;
  sortBy?: string;
  page?: number;
  pageSize?: number;
  selectedCategories?: string[];
  selectedPrices?: string[];
  selectedMaterials?: string[];
}

const fallbackCategories: CatalogCategory[] = [
  { id: "earrings", name: "Earrings", slug: "earrings" },
  { id: "bracelets", name: "Bracelets", slug: "bracelets" },
  { id: "rings", name: "Rings", slug: "rings" },
  { id: "necklaces", name: "Necklaces", slug: "necklaces" },
];

const fallbackProducts: CatalogProduct[] = [
  {
    id: "pantheon-earrings",
    slug: "pantheon-earrings",
    name: "Pantheon Earrings",
    description: "Architectural earrings with a refined gold finish and modern silhouette.",
    base_price: 2850,
    status: "published",
    category_id: "earrings",
    category_name: "Earrings",
    category_slug: "earrings",
    created_at: "2026-06-01T00:00:00.000Z",
    images: [{ id: "pantheon-1", url: pantheonImage, alt_text: "Pantheon Earrings", sort_order: 0 }],
    variants: [
      { id: "pantheon-variant-1", sku: "JWL-PTH-GLD-S", stock_qty: 15, price_override: null, attributes: [{ name: "Color", value: "Gold" }, { name: "Size", value: "S" }] },
      { id: "pantheon-variant-2", sku: "JWL-PTH-GLD-M", stock_qty: 5, price_override: 2950, attributes: [{ name: "Color", value: "Gold" }, { name: "Size", value: "M" }] },
      { id: "pantheon-variant-3", sku: "JWL-PTH-SLV-S", stock_qty: 0, price_override: 2650, attributes: [{ name: "Color", value: "Silver" }, { name: "Size", value: "S" }] },
      { id: "pantheon-variant-4", sku: "JWL-PTH-SLV-M", stock_qty: 8, price_override: 2750, attributes: [{ name: "Color", value: "Silver" }, { name: "Size", value: "M" }] },
    ],
  },
  {
    id: "eclipse-bracelet",
    slug: "eclipse-bracelet",
    name: "Eclipse Bracelet",
    description: "A fluid bracelet inspired by the geometry of light and shadow.",
    base_price: 3200,
    status: "published",
    category_id: "bracelets",
    category_name: "Bracelets",
    category_slug: "bracelets",
    created_at: "2026-05-15T00:00:00.000Z",
    images: [{ id: "eclipse-1", url: eclipseImage, alt_text: "Eclipse Bracelet", sort_order: 0 }],
    variants: [
      { id: "eclipse-variant-1", sku: "JWL-ECL-SLV-S", stock_qty: 8, price_override: null, attributes: [{ name: "Color", value: "Silver" }, { name: "Size", value: "S" }] },
      { id: "eclipse-variant-2", sku: "JWL-ECL-SLV-M", stock_qty: 0, price_override: null, attributes: [{ name: "Color", value: "Silver" }, { name: "Size", value: "M" }] },
      { id: "eclipse-variant-3", sku: "JWL-ECL-GLD-S", stock_qty: 10, price_override: 3400, attributes: [{ name: "Color", value: "Gold" }, { name: "Size", value: "S" }] },
      { id: "eclipse-variant-4", sku: "JWL-ECL-GLD-M", stock_qty: 12, price_override: 3400, attributes: [{ name: "Color", value: "Gold" }, { name: "Size", value: "M" }] },
    ],
  },
  {
    id: "halo-earrings",
    slug: "halo-earrings",
    name: "Halo Earrings",
    description: "Delicate hoops with a luminous, sculptural finish.",
    base_price: 1950,
    status: "published",
    category_id: "earrings",
    category_name: "Earrings",
    category_slug: "earrings",
    created_at: "2026-06-20T00:00:00.000Z",
    images: [{ id: "halo-1", url: haloImage, alt_text: "Halo Earrings", sort_order: 0 }],
    variants: [
      { id: "halo-variant-1", sku: "JWL-HAL-GLD", stock_qty: 12, price_override: null, attributes: [{ name: "Color", value: "Gold" }] },
      { id: "halo-variant-2", sku: "JWL-HAL-SLV", stock_qty: 0, price_override: 1800, attributes: [{ name: "Color", value: "Silver" }] },
    ],
  },
  {
    id: "oblique-earrings",
    slug: "oblique-earrings",
    name: "Oblique Earrings",
    description: "Angular lines and polished texture for a contemporary look.",
    base_price: 1650,
    status: "published",
    category_id: "earrings",
    category_name: "Earrings",
    category_slug: "earrings",
    created_at: "2026-05-30T00:00:00.000Z",
    images: [{ id: "oblique-1", url: obliqueImage, alt_text: "Oblique Earrings", sort_order: 0 }],
    variants: [{ id: "oblique-variant", sku: "JWL-OBQ-SLV", stock_qty: 9, price_override: null, attributes: [{ name: "Color", value: "Silver" }] }],
  },
  {
    id: "lintel-earrings",
    slug: "lintel-earrings",
    name: "Lintel Earrings",
    description: "Soft curves and a sculptural frame create understated elegance.",
    base_price: 2250,
    status: "published",
    category_id: "earrings",
    category_name: "Earrings",
    category_slug: "earrings",
    created_at: "2026-04-10T00:00:00.000Z",
    images: [{ id: "lintel-1", url: lintelImage, alt_text: "Lintel Earrings", sort_order: 0 }],
    variants: [{ id: "lintel-variant", sku: "JWL-LNT-GLD", stock_qty: 7, price_override: null, attributes: [{ name: "Color", value: "Gold" }] }],
  },
  {
    id: "shadowline-bracelet",
    slug: "shadowline-bracelet",
    name: "Shadowline Bracelet",
    description: "Bold chainwork with a polished, architectural finish.",
    base_price: 3950,
    status: "published",
    category_id: "bracelets",
    category_name: "Bracelets",
    category_slug: "bracelets",
    created_at: "2026-03-09T00:00:00.000Z",
    images: [{ id: "shadowline-1", url: shadowlineImage, alt_text: "Shadowline Bracelet", sort_order: 0 }],
    variants: [{ id: "shadowline-variant", sku: "JWL-SHW-SLV", stock_qty: 11, price_override: null }],
  },
  {
    id: "organic-earring",
    slug: "organic-earring",
    name: "Organic Ear Cuff",
    description: "A minimal contour with warm, organic form and premium finish.",
    base_price: 1450,
    status: "published",
    category_id: "earrings",
    category_name: "Earrings",
    category_slug: "earrings",
    created_at: "2026-07-01T00:00:00.000Z",
    images: [{ id: "organic-1", url: organicEarring, alt_text: "Organic Ear Cuff", sort_order: 0 }],
    variants: [{ id: "organic-variant", sku: "JWL-ORG-GLD", stock_qty: 14, price_override: null }],
  },
  {
    id: "link-bracelet",
    slug: "link-bracelet",
    name: "Link Bracelet",
    description: "Clean contemporary links with a polished, versatile finish.",
    base_price: 2100,
    status: "published",
    category_id: "bracelets",
    category_name: "Bracelets",
    category_slug: "bracelets",
    created_at: "2026-06-25T00:00:00.000Z",
    images: [{ id: "link-1", url: linkBracelet, alt_text: "Link Bracelet", sort_order: 0 }],
    variants: [{ id: "link-variant", sku: "JWL-LNK-SLV", stock_qty: 10, price_override: null }],
  },
];

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("your-project-id") && !key.includes("your-supabase-anon-key"));
};

interface DbProductRow {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  base_price: string | number;
  status: string;
  category_id: string;
  categories?: { name: string; slug: string } | { name: string; slug: string }[] | null;
  product_images?: Array<{ id: string; url: string; alt_text: string | null; sort_order: number }> | null;
  created_at: string;
}

const mapDbProduct = (product: DbProductRow): CatalogProduct => {
  const categoryInfo = Array.isArray(product.categories)
    ? product.categories[0]
    : product.categories;

  const rawImages = Array.isArray(product.product_images)
    ? product.product_images
    : product.product_images
      ? [product.product_images]
      : [];

  const images = rawImages.map(img => ({
    id: img.id,
    url: img.url,
    alt_text: img.alt_text || "",
    sort_order: img.sort_order
  }));

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description || "",
    base_price: Number(product.base_price || 0),
    status: product.status,
    category_id: product.category_id,
    category_name: categoryInfo?.name || null,
    category_slug: categoryInfo?.slug || null,
    created_at: product.created_at,
    images: images.sort((a, b) => a.sort_order - b.sort_order),
    variants: [],
  };
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
};

interface DbCategoryRow {
  id: string;
  name: string;
  slug: string;
}

export const getCatalogCategories = async (): Promise<CatalogCategory[]> => {
  if (!isSupabaseConfigured()) {
    return fallbackCategories;
  }

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("sort_order", { ascending: true })
      .limit(8);

    if (error || !data) throw error;
    return (data as unknown as DbCategoryRow[]).map((category) => ({ id: category.id, name: category.name, slug: category.slug }));
  } catch {
    return fallbackCategories;
  }
};

export const getCatalogProducts = async (options: CatalogProductQuery = {}): Promise<{ products: CatalogProduct[]; count: number; totalPages: number }> => {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 8;
  const offset = (page - 1) * pageSize;
  const categorySlug = options.categorySlug && options.categorySlug !== "all" ? options.categorySlug : null;
  const search = options.search?.trim() || null;
  const selectedCategories = options.selectedCategories?.filter(Boolean) ?? [];
  const selectedPrices = options.selectedPrices?.filter(Boolean) ?? [];
  const selectedMaterials = options.selectedMaterials?.filter(Boolean) ?? [];

  if (!isSupabaseConfigured()) {
    const filtered = fallbackProducts.filter((product) => {
      if (categorySlug && product.category_slug !== categorySlug) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(product.category_slug || "")) return false;
      if (search && !`${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedPrices.some((range) => range === "under-1000" && product.base_price >= 1000)) return false;
      if (selectedPrices.some((range) => range === "1000-2000" && !(product.base_price >= 1000 && product.base_price <= 2000))) return false;
      if (selectedPrices.some((range) => range === "2000-3000" && !(product.base_price >= 2000 && product.base_price <= 3000))) return false;
      if (selectedPrices.some((range) => range === "over-3000" && product.base_price <= 3000)) return false;
      if (selectedMaterials.length > 0) {
        const matchesMaterial = selectedMaterials.some((material) => product.description.toLowerCase().includes(material.toLowerCase()));
        if (!matchesMaterial) return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (options.sortBy === "price-low") return a.base_price - b.base_price;
      if (options.sortBy === "price-high") return b.base_price - a.base_price;
      if (options.sortBy === "newest") return (b.created_at || "").localeCompare(a.created_at || "");
      if (options.sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

    return {
      products: sorted.slice(offset, offset + pageSize),
      count: sorted.length,
      totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
    };
  }

  try {
    let query = supabase
      .from("products")
      .select("id, name, slug, description, base_price, status, category_id, created_at, categories:category_id(name, slug), product_images(id, url, alt_text, sort_order)", { count: "exact" })
      .eq("status", "published");

    if (categorySlug) {
      const { data: categoryData } = await supabase.from("categories").select("id").eq("slug", categorySlug).maybeSingle();
      if (categoryData?.id) {
        query = query.eq("category_id", categoryData.id);
      }
    }

    if (selectedCategories.length > 0) {
      const categoryIds = (await Promise.all(selectedCategories.map((slug) => supabase.from("categories").select("id").eq("slug", slug).maybeSingle()))).map((result) => result.data?.id).filter(Boolean);
      if (categoryIds.length > 0) {
        query = query.in("category_id", categoryIds as string[]);
      }
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, count, error } = await query.order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);
    if (error) throw error;

    const products = (data || []).map(mapDbProduct);
    const sorted = [...products].sort((a, b) => {
      if (options.sortBy === "price-low") return a.base_price - b.base_price;
      if (options.sortBy === "price-high") return b.base_price - a.base_price;
      if (options.sortBy === "newest") return (b.created_at || "").localeCompare(a.created_at || "");
      if (options.sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

    return { products: sorted, count: count || sorted.length, totalPages: Math.max(1, Math.ceil((count || sorted.length) / pageSize)) };
  } catch {
    return { products: fallbackProducts, count: fallbackProducts.length, totalPages: 1 };
  }
};

export const getCatalogProductByIdentifier = async (identifier: string | undefined): Promise<CatalogProduct | null> => {
  if (!identifier) return fallbackProducts[0];

  if (!isSupabaseConfigured()) {
    return fallbackProducts.find((product) => product.slug === identifier || product.id === identifier) || fallbackProducts[0];
  }

  try {
    const query = supabase
      .from("products")
      .select("id, name, slug, description, base_price, status, category_id, created_at, categories:category_id(name, slug)")
      .eq("status", "published")
      .or(`slug.eq.${identifier},id.eq.${identifier}`)
      .maybeSingle();

    const { data, error } = await query;
    if (error || !data) throw error;

    const product = mapDbProduct(data as unknown as DbProductRow);

    interface DbImageRow {
      id: string;
      url: string;
      alt_text: string | null;
      sort_order: number;
    }

    interface DbVariantAttributeJoin {
      attribute_values: {
        value: string;
        attributes: {
          name: string;
        } | null;
      } | null;
    }

    interface DbVariantRow {
      id: string;
      sku: string | null;
      stock_qty: number;
      price_override: number | null;
      variant_attribute_values?: DbVariantAttributeJoin[] | DbVariantAttributeJoin | null;
    }

    const { data: imageData } = await supabase
      .from("product_images")
      .select("id, url, alt_text, sort_order")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true });

    const { data: variantData } = await supabase
      .from("product_variants")
      .select(`
        id, 
        sku, 
        stock_qty, 
        price_override,
        variant_attribute_values (
          attribute_values (
            value,
            attributes (
              name
            )
          )
        )
      `)
      .eq("product_id", product.id)
      .order("created_at", { ascending: true });

    return {
      ...product,
      images: ((imageData as unknown as DbImageRow[]) || []).map((image) => ({ 
        id: image.id, 
        url: image.url, 
        alt_text: image.alt_text || "", 
        sort_order: image.sort_order 
      })),
      variants: ((variantData as unknown as DbVariantRow[]) || []).map((variant) => {
        const rawAttrArray = Array.isArray(variant.variant_attribute_values)
          ? variant.variant_attribute_values
          : variant.variant_attribute_values
            ? [variant.variant_attribute_values]
            : [];

        const attrs = rawAttrArray
          .map((vav) => {
            const av = vav?.attribute_values;
            if (!av) return null;
            
            const attr = Array.isArray(av.attributes) 
              ? av.attributes[0] 
              : av.attributes;
              
            if (!attr?.name) return null;
            return {
              name: attr.name,
              value: av.value
            };
          })
          .filter((x): x is { name: string; value: string } => x !== null);

        return {
          id: variant.id,
          sku: variant.sku,
          stock_qty: variant.stock_qty,
          price_override: variant.price_override ? Number(variant.price_override) : null,
          attributes: attrs
        };
      }),
    };
  } catch {
    return fallbackProducts.find((product) => product.slug === identifier || product.id === identifier) || fallbackProducts[0];
  }
};

export const getFeaturedProducts = async (limit = 8): Promise<CatalogProduct[]> => {
  const { products } = await getCatalogProducts({ page: 1, pageSize: limit });
  return products;
};

export const getRelatedProducts = async (currentProduct: CatalogProduct, limit = 8): Promise<CatalogProduct[]> => {
  if (!currentProduct) return [];

  if (!isSupabaseConfigured()) {
    const matched = fallbackProducts.filter(
      (p) => p.id !== currentProduct.id && p.category_id === currentProduct.category_id
    );
    if (matched.length > 0) return matched.slice(0, limit);
    return fallbackProducts.filter((p) => p.id !== currentProduct.id).slice(0, limit);
  }

  try {
    let query = supabase
      .from("products")
      .select("id, name, slug, description, base_price, status, category_id, created_at, categories:category_id(name, slug), product_images(id, url, alt_text, sort_order)")
      .eq("status", "published")
      .neq("id", currentProduct.id);

    if (currentProduct.category_id) {
      query = query.eq("category_id", currentProduct.category_id);
    }

    const { data, error } = await query.limit(limit);
    if (error) throw error;

    let products = (data || []).map(mapDbProduct);

    if (products.length < limit) {
      const { data: padData } = await supabase
        .from("products")
        .select("id, name, slug, description, base_price, status, category_id, created_at, categories:category_id(name, slug), product_images(id, url, alt_text, sort_order)")
        .eq("status", "published")
        .limit(limit + 5);

      if (padData) {
        const mappedPads = padData.map(mapDbProduct);
        const filteredPads = mappedPads.filter(
          (p) => p.id !== currentProduct.id && !products.some((existing) => existing.id === p.id)
        );
        products = [...products, ...filteredPads].slice(0, limit);
      }
    }

    return products;
  } catch {
    return fallbackProducts.filter((p) => p.id !== currentProduct.id).slice(0, limit);
  }
};

export const getCompleteTheLookProducts = async (currentProduct: CatalogProduct, limit = 4): Promise<CatalogProduct[]> => {
  if (!currentProduct) return [];

  if (!isSupabaseConfigured()) {
    const matched = fallbackProducts.filter(
      (p) => p.id !== currentProduct.id && p.category_id !== currentProduct.category_id
    );
    if (matched.length > 0) return matched.slice(0, limit);
    return fallbackProducts.filter((p) => p.id !== currentProduct.id).slice(0, limit);
  }

  try {
    let query = supabase
      .from("products")
      .select("id, name, slug, description, base_price, status, category_id, created_at, categories:category_id(name, slug), product_images(id, url, alt_text, sort_order)")
      .eq("status", "published")
      .neq("id", currentProduct.id);

    if (currentProduct.category_id) {
      query = query.neq("category_id", currentProduct.category_id);
    }

    const { data, error } = await query.limit(limit);
    if (error) throw error;

    let products = (data || []).map(mapDbProduct);

    if (products.length < limit) {
      const { data: padData } = await supabase
        .from("products")
        .select("id, name, slug, description, base_price, status, category_id, created_at, categories:category_id(name, slug), product_images(id, url, alt_text, sort_order)")
        .eq("status", "published")
        .limit(limit + 5);

      if (padData) {
        const mappedPads = padData.map(mapDbProduct);
        const filteredPads = mappedPads.filter(
          (p) => p.id !== currentProduct.id && !products.some((existing) => existing.id === p.id)
        );
        products = [...products, ...filteredPads].slice(0, limit);
      }
    }

    return products;
  } catch {
    return fallbackProducts.filter((p) => p.id !== currentProduct.id).slice(0, limit);
  }
};
