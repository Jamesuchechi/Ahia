import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Loader2, 
  UploadCloud, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  PlusCircle, 
  Settings, 
  Layers, 
  ExternalLink 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Interfaces
interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  status: "draft" | "published" | "archived";
  created_at: string;
  categories?: { name: string; slug: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Attribute {
  id: string;
  name: string;
}

interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  sku: string | null;
  price_override: number | null;
  stock_qty: number;
  attributeValues?: { attribute_id: string; value_id: string; name: string; value: string }[];
}

interface ProductImage {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  url: string;
  alt_text: string;
  sort_order: number;
}

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<AttributeValue[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modal / Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeEditTab, setActiveEditTab] = useState("general");

  // General Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Variant Manager State
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newStock, setNewStock] = useState<number>(0);
  const [newPriceOverride, setNewPriceOverride] = useState<string>("");
  const [selectedAttrValues, setSelectedAttrValues] = useState<{ [key: string]: string }>({});
  const [isCreatingVariant, setIsCreatingVariant] = useState(false);

  // Image Manager State
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageAltInput, setImageAltInput] = useState("");
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV Import State
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // Auto slug generation
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(generateSlug(val));
  };

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch categories
      const { data: catData } = await supabase.from("categories").select("id, name, slug");
      setCategories(catData || []);

      // 2. Fetch attributes & values
      const { data: attrData } = await supabase.from("attributes").select("*");
      setAttributes(attrData || []);

      const { data: valData } = await supabase.from("attribute_values").select("*");
      setAttributeValues(valData || []);

      // 3. Fetch products
      let query = supabase.from("products").select("*, categories:category_id(name, slug)");
      
      const { data: prodData, error } = await query;
      if (error) throw error;
      setProducts(prodData || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to fetch catalog data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch variants for selected product
  const fetchVariants = async (productId: string) => {
    setLoadingVariants(true);
    try {
      const { data: varData, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId);

      if (error) throw error;

      // For each variant, fetch attribute values linked to it
      const populatedVariants = await Promise.all(
        (varData || []).map(async (v) => {
          const { data: joinData } = await supabase
            .from("variant_attribute_values")
            .select("attribute_value_id")
            .eq("variant_id", v.id);

          const valueIds = (joinData || []).map(j => j.attribute_value_id);
          
          // Map to attributes & values details
          const details = valueIds.map(valId => {
            const valObj = attributeValues.find(av => av.id === valId);
            const attrObj = attributes.find(a => a.id === valObj?.attribute_id);
            return {
              attribute_id: attrObj?.id || "",
              value_id: valId,
              name: attrObj?.name || "",
              value: valObj?.value || ""
            };
          });

          return {
            ...v,
            attributeValues: details
          };
        })
      );

      setVariants(populatedVariants);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load variants");
    } finally {
      setLoadingVariants(false);
    }
  };

  // Fetch images for selected product
  const fetchImages = async (productId: string) => {
    setLoadingImages(true);
    try {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load images");
    } finally {
      setLoadingImages(false);
    }
  };

  // Create new product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || basePrice < 0) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setIsSubmittingProduct(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .insert({
          name,
          slug,
          description,
          base_price: basePrice,
          status,
          category_id: categoryId === "none" ? null : categoryId
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Product created successfully!");
      setIsCreateOpen(false);
      
      // Reset state
      setName("");
      setSlug("");
      setDescription("");
      setBasePrice(0);
      setStatus("draft");
      setCategoryId("none");

      fetchData();
      if (data) {
        // Open edit dialog immediately so they can add variants and images
        handleEditClick(data as Product);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create product");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Edit Click Handler
  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setSlug(product.slug);
    setDescription(product.description || "");
    setBasePrice(product.base_price);
    setStatus(product.status);
    setCategoryId(product.category_id || "none");
    setActiveEditTab("general");

    fetchVariants(product.id);
    fetchImages(product.id);
  };

  // Update product details
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSubmittingProduct(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          name,
          slug,
          description,
          base_price: basePrice,
          status,
          category_id: categoryId === "none" ? null : categoryId
        })
        .eq("id", editingProduct.id);

      if (error) throw error;
      toast.success("Product details updated successfully!");
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update product");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will delete all its variants, images, and reviews.`)) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("Product deleted successfully");
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete product");
    }
  };

  // Variant: Create
  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Check if at least one attribute value is selected
    const attrValIds = Object.values(selectedAttrValues).filter(val => val !== "none");
    if (attrValIds.length === 0) {
      toast.error("Please select at least one attribute value combination");
      return;
    }

    setIsCreatingVariant(true);
    try {
      // 1. Insert product variant row
      const { data: newVar, error: varErr } = await supabase
        .from("product_variants")
        .insert({
          product_id: editingProduct.id,
          sku: newSku.trim() || null,
          price_override: newPriceOverride.trim() ? parseFloat(newPriceOverride) : null,
          stock_qty: newStock
        })
        .select()
        .single();

      if (varErr) throw varErr;

      // 2. Insert variant attribute values join rows
      if (newVar && attrValIds.length > 0) {
        const joinRows = attrValIds.map(valId => ({
          variant_id: newVar.id,
          attribute_value_id: valId
        }));

        const { error: joinErr } = await supabase
          .from("variant_attribute_values")
          .insert(joinRows);

        if (joinErr) throw joinErr;
      }

      toast.success("Variant added successfully!");
      setNewSku("");
      setNewStock(0);
      setNewPriceOverride("");
      setSelectedAttrValues({});
      fetchVariants(editingProduct.id);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add variant");
    } finally {
      setIsCreatingVariant(false);
    }
  };

  // Variant: Delete
  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm("Are you sure you want to delete this variant?")) return;

    try {
      const { error } = await supabase.from("product_variants").delete().eq("id", variantId);
      if (error) throw error;
      toast.success("Variant deleted");
      if (editingProduct) {
        fetchVariants(editingProduct.id);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete variant");
    }
  };

  // Image: Add from URL
  const handleAddImageUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !imageUrlInput.trim()) return;

    try {
      const { error } = await supabase
        .from("product_images")
        .insert({
          product_id: editingProduct.id,
          url: imageUrlInput.trim(),
          alt_text: imageAltInput.trim(),
          sort_order: images.length
        });

      if (error) throw error;

      toast.success("Image URL added successfully!");
      setImageUrlInput("");
      setImageAltInput("");
      fetchImages(editingProduct.id);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add image");
    }
  };

  // Image: Upload file to storage
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProduct || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setIsUploadingFile(true);
    try {
      // 1. Generate unique file name and path
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `products/${editingProduct.id}/${fileName}`;

      // 2. Upload file to Supabase Storage bucket 'product-images'
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Get public URL of the uploaded image
      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // 4. Save file metadata & URL into public.product_images
      const { error: dbError } = await supabase
        .from("product_images")
        .insert({
          product_id: editingProduct.id,
          url: publicUrl,
          alt_text: file.name.substring(0, file.name.lastIndexOf(".")),
          sort_order: images.length
        });

      if (dbError) throw dbError;

      toast.success("File uploaded and linked successfully!");
      fetchImages(editingProduct.id);
    } catch (err: any) {
      console.error(err);
      toast.error(
        `Failed to upload image. ${err.message || ""}\n` +
        "Ensure the bucket 'product-images' exists in Supabase Storage and is set to public."
      );
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Image: Delete
  const handleDeleteImage = async (imgId: string) => {
    try {
      // If it is a storage image, we could theoretically delete it from storage,
      // but deleting it from DB table is primary. Let's delete from DB.
      const { error } = await supabase.from("product_images").delete().eq("id", imgId);
      if (error) throw error;
      toast.success("Image removed");
      if (editingProduct) {
        fetchImages(editingProduct.id);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to remove image");
    }
  };

  // CSV: Parse and Import
  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        toast.error("Failed to read CSV file content");
        setIsImporting(false);
        return;
      }

      try {
        // Parse CSV lines (simple parsing, handles double quotes)
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length < 2) {
          toast.error("CSV file must contain at least a header row and one data row.");
          setIsImporting(false);
          return;
        }

        const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
        
        let successCount = 0;
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
          if (values.length < headers.length) continue;

          // Map values to header keys
          const row: { [key: string]: string } = {};
          headers.forEach((h, index) => {
            row[h] = values[index];
          });

          // Check required columns
          const pName = row["name"];
          const pPrice = parseFloat(row["base_price"]);
          if (!pName || isNaN(pPrice)) {
            errorCount++;
            continue;
          }

          // Generate slug
          const pSlug = row["slug"] || generateSlug(pName);

          // Get category ID from category slug
          const catSlug = row["category_slug"];
          let catId: string | null = null;
          if (catSlug) {
            const matchedCat = categories.find(c => c.slug === catSlug);
            if (matchedCat) {
              catId = matchedCat.id;
            } else {
              // Create category if it doesn't exist
              const { data: newCat } = await supabase
                .from("categories")
                .insert({ name: catSlug.charAt(0).toUpperCase() + catSlug.slice(1), slug: catSlug })
                .select()
                .single();
              if (newCat) {
                catId = newCat.id;
                // Add to local state so we don't recreate it
                categories.push(newCat);
              }
            }
          }

          // 1. Insert product
          const { data: insertedProduct, error: prodErr } = await supabase
            .from("products")
            .upsert({
              name: pName,
              slug: pSlug,
              description: row["description"] || "",
              base_price: pPrice,
              status: (row["status"] as any) || "published",
              category_id: catId
            }, { onConflict: "slug" })
            .select()
            .single();

          if (prodErr) {
            console.error("CSV insert product error:", prodErr);
            errorCount++;
            continue;
          }

          // 2. Insert variant
          if (insertedProduct) {
            const sku = row["sku"] || `SKU-${insertedProduct.slug.toUpperCase()}`;
            const stock = parseInt(row["stock_qty"]) || 0;
            const priceOverride = parseFloat(row["price_override"]);

            const { data: insertedVariant, error: varErr } = await supabase
              .from("product_variants")
              .insert({
                product_id: insertedProduct.id,
                sku: sku,
                price_override: isNaN(priceOverride) ? null : priceOverride,
                stock_qty: stock
              })
              .select()
              .single();

            if (varErr) {
              console.error("CSV insert variant error:", varErr);
              successCount++; // Product succeeded, but variant failed
              continue;
            }

            // 3. Link attributes if specified (Format e.g. "Size:M,Color:Black")
            const attrString = row["attributes"];
            if (attrString && insertedVariant) {
              const pairs = attrString.split(";").map(p => p.trim());
              for (const pair of pairs) {
                const parts = pair.split(":").map(p => p.trim());
                if (parts.length === 2) {
                  const attrName = parts[0];
                  const attrVal = parts[1];

                  // Match/find Attribute
                  let dbAttr = attributes.find(a => a.name.toLowerCase() === attrName.toLowerCase());
                  if (!dbAttr) {
                    const { data: newAttr } = await supabase.from("attributes").insert({ name: attrName }).select().single();
                    if (newAttr) {
                      dbAttr = newAttr;
                      attributes.push(newAttr);
                    }
                  }

                  if (dbAttr) {
                    // Match/find Attribute Value
                    let dbVal = attributeValues.find(v => v.attribute_id === dbAttr?.id && v.value.toLowerCase() === attrVal.toLowerCase());
                    if (!dbVal) {
                      const { data: newVal } = await supabase.from("attribute_values").insert({ attribute_id: dbAttr.id, value: attrVal }).select().single();
                      if (newVal) {
                        dbVal = newVal;
                        attributeValues.push(newVal);
                      }
                    }

                    if (dbVal) {
                      // Insert Variant Attribute Value Join row
                      await supabase.from("variant_attribute_values").insert({
                        variant_id: insertedVariant.id,
                        attribute_value_id: dbVal.id
                      });
                    }
                  }
                }
              }
            }

            // 4. Attach image if URL provided
            const imgUrl = row["image_url"];
            if (imgUrl) {
              await supabase.from("product_images").insert({
                product_id: insertedProduct.id,
                url: imgUrl,
                alt_text: pName
              });
            }

            successCount++;
          }
        }

        toast.success(`Import complete! Successfully imported ${successCount} products. Errors: ${errorCount}`);
        setIsCsvOpen(false);
        setCsvFile(null);
        fetchData();
      } catch (err: any) {
        console.error("CSV import error:", err);
        toast.error("An error occurred during CSV parsing");
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(csvFile);
  };

  // Filtered Products List
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || p.category_id === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            <span>Product Catalog</span>
          </h1>
          <p className="text-muted-foreground font-light text-sm">
            Add general products, build multi-attribute variants, configure pricing overrides, and manage images.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="font-light gap-2" onClick={() => setIsCsvOpen(true)}>
            <FileSpreadsheet size={16} />
            <span>Import CSV</span>
          </Button>
          <Button className="font-light gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} />
            <span>New Product</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products by name, slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 font-light bg-background"
            />
          </div>

          <div className="flex gap-2 min-w-[280px]">
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
              <SelectTrigger className="font-light bg-background flex-1">
                <Filter className="h-3 w-3 mr-2 opacity-60" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-border">
                <SelectItem value="all" className="font-light">All Statuses</SelectItem>
                <SelectItem value="draft" className="font-light">Draft</SelectItem>
                <SelectItem value="published" className="font-light">Published</SelectItem>
                <SelectItem value="archived" className="font-light">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val)}>
              <SelectTrigger className="font-light bg-background flex-1">
                <Filter className="h-3 w-3 mr-2 opacity-60" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-border">
                <SelectItem value="all" className="font-light">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="font-light">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid / Table */}
      <Card className="border border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin mb-3" />
              <span className="text-sm font-light">Loading catalog products...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground font-light text-sm">
              No products found matching your search options.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="p-4 pl-6 font-medium">Product</th>
                    <th className="p-4 font-medium">Category</th>
                    <th className="p-4 font-medium">Base Price</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 pr-6 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-light">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-medium text-foreground">{product.name}</div>
                        <div className="text-xs text-muted-foreground font-light">/{product.slug}</div>
                      </td>
                      <td className="p-4">
                        {product.categories?.name || (
                          <span className="text-muted-foreground italic text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4">
                        €{product.base_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <Badge 
                          className={`font-light rounded-full text-xs px-2.5 py-0.5 border ${
                            product.status === "published" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : product.status === "draft" 
                              ? "bg-amber-50 text-amber-700 border-amber-200" 
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {product.status}
                        </Badge>
                      </td>
                      <td className="p-4 pr-6 text-right space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-muted"
                          onClick={() => handleEditClick(product)}
                        >
                          <Edit size={14} className="text-muted-foreground" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-destructive/10"
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                        >
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Import Dialog */}
      <Dialog open={isCsvOpen} onOpenChange={(open) => !open && setIsCsvOpen(false)}>
        <DialogContent className="sm:max-w-md bg-white border border-border">
          <DialogHeader>
            <DialogTitle className="font-normal">Import Products via CSV</DialogTitle>
            <DialogDescription className="font-light text-xs">
              Upload a `.csv` file to bulk insert products, variants, attributes, and image URLs.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCsvImport} className="space-y-4">
            <div className="border border-dashed border-border rounded-md p-8 flex flex-col items-center justify-center bg-muted/5">
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground font-light text-center mb-4">
                Drag and drop your file here, or click to browse.
              </p>
              <input
                ref={csvFileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="font-light"
                onClick={() => csvFileInputRef.current?.click()}
              >
                Choose File
              </Button>
              {csvFile && (
                <span className="text-xs text-foreground font-normal mt-3 bg-muted px-3 py-1 rounded">
                  {csvFile.name}
                </span>
              )}
            </div>

            <div className="bg-muted/30 p-3 rounded text-[10px] text-muted-foreground space-y-1 font-mono">
              <p className="font-semibold">Required Header Fields:</p>
              <p>name, base_price, category_slug (opt), sku (opt), stock_qty (opt), attributes (opt: "Size:M;Color:Black"), image_url (opt)</p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCsvOpen(false)}
                disabled={isImporting}
                className="font-light"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isImporting || !csvFile} className="font-light">
                {isImporting ? "Importing..." : "Upload & Parse"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Product Modal (Simple Details) */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => !open && setIsCreateOpen(false)}>
        <DialogContent className="sm:max-w-md bg-white border border-border">
          <DialogHeader>
            <DialogTitle className="font-normal">Add Product</DialogTitle>
            <DialogDescription className="font-light">
              Add base properties to start. You can attach images and variations in the next step.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="prod-name">Product Name *</Label>
              <Input
                id="prod-name"
                type="text"
                placeholder="e.g. Classic Silk Shirt"
                value={name}
                onChange={handleNameChange}
                disabled={isSubmittingProduct}
                className="font-light bg-background"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="prod-slug">URL Slug *</Label>
              <Input
                id="prod-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                disabled={isSubmittingProduct}
                className="font-light bg-background"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="prod-price">Base Price (€) *</Label>
                <Input
                  id="prod-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={basePrice || ""}
                  onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                  disabled={isSubmittingProduct}
                  className="font-light bg-background"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="prod-category">Category</Label>
                <Select
                  value={categoryId}
                  onValueChange={(val) => setCategoryId(val)}
                  disabled={isSubmittingProduct}
                >
                  <SelectTrigger id="prod-category" className="font-light bg-background">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-border">
                    <SelectItem value="none" className="font-light">None</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="font-light">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="prod-desc">Description</Label>
              <Textarea
                id="prod-desc"
                placeholder="Product design notes and styling details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmittingProduct}
                rows={3}
                className="font-light bg-background resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="prod-status">Catalog Status</Label>
              <Select
                value={status}
                onValueChange={(val: any) => setStatus(val)}
                disabled={isSubmittingProduct}
              >
                <SelectTrigger id="prod-status" className="font-light bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-border">
                  <SelectItem value="draft" className="font-light">Draft (Hidden)</SelectItem>
                  <SelectItem value="published" className="font-light">Published (Storefront)</SelectItem>
                  <SelectItem value="archived" className="font-light">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmittingProduct}
                className="font-light"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingProduct} className="font-light">
                {isSubmittingProduct ? "Creating..." : "Save details"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog (Tabbed UI for General details, variants, images) */}
      <Dialog open={editingProduct !== null} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="sm:max-w-3xl bg-white border border-border h-[90vh] md:h-auto overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-normal text-xl">Manage Product: {editingProduct?.name}</DialogTitle>
            <DialogDescription className="font-light text-xs">
              Configure product details, variation combinations, inventory counts, and image assets.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeEditTab} onValueChange={(val) => setActiveEditTab(val)} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted rounded p-1">
              <TabsTrigger value="general" className="text-xs font-light py-2">Details</TabsTrigger>
              <TabsTrigger value="variants" className="text-xs font-light py-2">Variants & Inventory</TabsTrigger>
              <TabsTrigger value="images" className="text-xs font-light py-2">Images & Assets</TabsTrigger>
            </TabsList>

            {/* TAB: General Details */}
            <TabsContent value="general" className="space-y-4">
              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-name">Product Name *</Label>
                  <Input
                    id="edit-name"
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    disabled={isSubmittingProduct}
                    className="font-light bg-background"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-slug">URL Slug *</Label>
                  <Input
                    id="edit-slug"
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    disabled={isSubmittingProduct}
                    className="font-light bg-background"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-price">Base Price (€) *</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={basePrice || ""}
                      onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                      disabled={isSubmittingProduct}
                      className="font-light bg-background"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select
                      value={categoryId}
                      onValueChange={(val) => setCategoryId(val)}
                      disabled={isSubmittingProduct}
                    >
                      <SelectTrigger id="edit-category" className="font-light bg-background">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-border">
                        <SelectItem value="none" className="font-light">None</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="font-light">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-desc">Description</Label>
                  <Textarea
                    id="edit-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmittingProduct}
                    rows={4}
                    className="font-light bg-background resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(val: any) => setStatus(val)}
                    disabled={isSubmittingProduct}
                  >
                    <SelectTrigger id="edit-status" className="font-light bg-background">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-border">
                      <SelectItem value="draft" className="font-light">Draft</SelectItem>
                      <SelectItem value="published" className="font-light">Published</SelectItem>
                      <SelectItem value="archived" className="font-light">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-border">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingProduct(null)}
                    disabled={isSubmittingProduct}
                    className="font-light"
                  >
                    Close
                  </Button>
                  <Button type="submit" disabled={isSubmittingProduct} className="font-light">
                    {isSubmittingProduct ? "Saving..." : "Save Details"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* TAB: Variants & Inventory */}
            <TabsContent value="variants" className="space-y-6">
              {/* Add Variant Form */}
              <div className="border border-border p-4 rounded bg-muted/10 space-y-4">
                <h4 className="font-normal text-sm flex items-center gap-1">
                  <PlusCircle size={16} />
                  <span>Build Variant Combinations</span>
                </h4>
                
                <form onSubmit={handleAddVariant} className="space-y-4">
                  {/* Render attributes selections */}
                  {attributes.length === 0 ? (
                    <p className="text-xs font-light text-muted-foreground italic">
                      Configure attributes (e.g. Size, Color) first under the Attributes tab before mapping variations.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {attributes.map((attr) => {
                        const vals = attributeValues.filter(av => av.attribute_id === attr.id);
                        return (
                          <div key={attr.id} className="space-y-1">
                            <Label className="text-xs">{attr.name}</Label>
                            <Select
                              value={selectedAttrValues[attr.id] || "none"}
                              onValueChange={(val) => 
                                setSelectedAttrValues(prev => ({ ...prev, [attr.id]: val }))
                              }
                              disabled={isCreatingVariant}
                            >
                              <SelectTrigger className="text-xs bg-background h-9 font-light">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-border">
                                <SelectItem value="none" className="font-light text-xs">Unselected</SelectItem>
                                {vals.map((v) => (
                                  <SelectItem key={v.id} value={v.id} className="font-light text-xs">
                                    {v.value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border/60 pt-4">
                    <div className="space-y-1">
                      <Label htmlFor="var-sku" className="text-xs">SKU (Stock Keeping Unit)</Label>
                      <Input
                        id="var-sku"
                        type="text"
                        placeholder="e.g. JWL-GLD-PTH"
                        value={newSku}
                        onChange={(e) => setNewSku(e.target.value)}
                        disabled={isCreatingVariant}
                        className="font-light bg-background text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="var-stock" className="text-xs">Stock Qty *</Label>
                      <Input
                        id="var-stock"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newStock || ""}
                        onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                        disabled={isCreatingVariant}
                        className="font-light bg-background text-xs h-9"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="var-price" className="text-xs">Price Override (€)</Label>
                      <Input
                        id="var-price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 2900 (opt)"
                        value={newPriceOverride}
                        onChange={(e) => setNewPriceOverride(e.target.value)}
                        disabled={isCreatingVariant}
                        className="font-light bg-background text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" size="sm" className="font-light" disabled={isCreatingVariant || attributes.length === 0}>
                      {isCreatingVariant ? "Adding Variant..." : "Generate Variant"}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Variants List */}
              <div className="space-y-2">
                <h4 className="font-normal text-sm flex items-center gap-1">
                  <Layers size={16} />
                  <span>Existing Variants</span>
                </h4>

                {loadingVariants ? (
                  <div className="flex justify-center py-6 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : variants.length === 0 ? (
                  <p className="text-xs font-light text-muted-foreground text-center py-8 border border-dashed rounded bg-muted/5">
                    No variants created yet. Define combination attributes above to generate inventory variations.
                  </p>
                ) : (
                  <div className="border border-border rounded-md overflow-hidden bg-background">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase font-semibold">
                          <th className="p-3 pl-4">SKU</th>
                          <th className="p-3">Attributes</th>
                          <th className="p-3">Inventory</th>
                          <th className="p-3">Price</th>
                          <th className="p-3 pr-4 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-light">
                        {variants.map((v) => (
                          <tr key={v.id} className="hover:bg-muted/5">
                            <td className="p-3 pl-4 font-mono">{v.sku || <span className="text-muted-foreground italic">None</span>}</td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {v.attributeValues?.map((av, index) => (
                                  <Badge key={index} variant="secondary" className="font-light text-[10px] rounded px-1.5 py-0.5">
                                    {av.name}: {av.value}
                                  </Badge>
                                )) || <span className="text-muted-foreground italic">No Options</span>}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`font-normal ${v.stock_qty <= 5 ? "text-red-600 font-medium" : "text-foreground"}`}>
                                {v.stock_qty} pcs {v.stock_qty <= 5 && "— Low Stock"}
                              </span>
                            </td>
                            <td className="p-3">
                              {v.price_override ? (
                                <span className="font-normal text-primary">
                                  €{v.price_override.toLocaleString("en-US", { minimumFractionDigits: 2 })} (override)
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic">Base Price</span>
                              )}
                            </td>
                            <td className="p-3 pr-4 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:bg-destructive/10 rounded-sm"
                                onClick={() => handleDeleteVariant(v.id)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB: Images & Assets */}
            <TabsContent value="images" className="space-y-6">
              {/* Add Image URL / Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Local File */}
                <div className="border border-border p-4 rounded bg-muted/10 flex flex-col items-center justify-center min-h-[160px]">
                  <UploadCloud size={28} className="text-muted-foreground mb-2" />
                  <h4 className="font-normal text-sm mb-1">Upload Local Image</h4>
                  <p className="text-[10px] text-muted-foreground text-center max-w-[200px] mb-4">
                    Directly upload a PNG/JPG/WebP file to your Supabase Storage.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadFile}
                    disabled={isUploadingFile}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-light"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingFile}
                  >
                    {isUploadingFile ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Uploading...</span>
                      </span>
                    ) : (
                      <span>Browse Files</span>
                    )}
                  </Button>
                </div>

                {/* Attach External URL */}
                <form onSubmit={handleAddImageUrl} className="border border-border p-4 rounded bg-muted/10 space-y-3">
                  <h4 className="font-normal text-sm flex items-center gap-1">
                    <ImageIcon size={16} />
                    <span>Attach Image URL</span>
                  </h4>
                  
                  <div className="space-y-1">
                    <Label htmlFor="img-url" className="text-xs">Image Link / URL *</Label>
                    <Input
                      id="img-url"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="font-light bg-background text-xs h-9"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="img-alt" className="text-xs">Alt Text / Label</Label>
                    <Input
                      id="img-alt"
                      type="text"
                      placeholder="e.g. Hero storefront view"
                      value={imageAltInput}
                      onChange={(e) => setImageAltInput(e.target.value)}
                      className="font-light bg-background text-xs h-9"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button type="submit" size="sm" className="font-light" disabled={!imageUrlInput.trim()}>
                      Add URL Link
                    </Button>
                  </div>
                </form>
              </div>

              {/* Images Grid */}
              <div className="space-y-2">
                <h4 className="font-normal text-sm flex items-center gap-1">
                  <ImageIcon size={16} />
                  <span>Product Asset Gallery</span>
                </h4>

                {loadingImages ? (
                  <div className="flex justify-center py-6 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : images.length === 0 ? (
                  <p className="text-xs font-light text-muted-foreground text-center py-12 border border-dashed rounded bg-muted/5">
                    No images attached to this product. Add URLs or upload files to populate the gallery.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {images.map((img) => (
                      <div 
                        key={img.id} 
                        className="group relative border border-border rounded-md overflow-hidden bg-muted/10 aspect-square flex flex-col justify-between"
                      >
                        <img
                          src={img.url}
                          alt={img.alt_text}
                          className="w-full h-full object-cover select-none pointer-events-none flex-1"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-[10px] text-white flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="truncate pr-2 font-light">{img.alt_text || "Image"}</span>
                          <button
                            type="button"
                            className="text-red-400 hover:text-red-200 transition-colors p-1"
                            onClick={() => handleDeleteImage(img.id)}
                            aria-label="Remove image"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        {/* URL Link */}
                        <a 
                          href={img.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="absolute top-2 right-2 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                          aria-label="View link"
                        >
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
