import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  BookOpen, Plus, Edit2, Trash2, Camera, MapPin, 
  X, Save, Loader2, ListPlus, Eye, ArrowLeft, PlusCircle, Upload
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

interface DBLookbook {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_image: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
}

interface DBLook {
  id: string;
  lookbook_id: string;
  title: string;
  description: string | null;
  image_url: string;
  sort_order: number;
  created_at: string;
}

interface DBLookSpot {
  id: string;
  look_id: string;
  product_id: string;
  x: number;
  y: number;
}

interface SimpleProduct {
  id: string;
  name: string;
  slug: string;
}

const AdminLookbooks: React.FC = () => {
  const [lookbooks, setLookbooks] = useState<DBLookbook[]>([]);
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbAvailable, setDbAvailable] = useState(true);

  // Active View State
  // 'list' | 'lookbook-detail' | 'hotspots'
  const [currentView, setCurrentView] = useState<'list' | 'lookbook-detail' | 'hotspots'>('list');
  const [selectedLookbook, setSelectedLookbook] = useState<DBLookbook | null>(null);
  const [selectedLook, setSelectedLook] = useState<DBLook | null>(null);

  // Lists
  const [looks, setLooks] = useState<DBLook[]>([]);
  const [spots, setSpots] = useState<DBLookSpot[]>([]);

  // Form State: Lookbook
  const [lbTitle, setLbTitle] = useState("");
  const [lbSubtitle, setLbSubtitle] = useState("");
  const [lbDescription, setLbDescription] = useState("");
  const [lbCoverImage, setLbCoverImage] = useState("");
  const [lbStatus, setLbStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [isSavingLb, setIsSavingLb] = useState(false);
  const [editingLb, setEditingLb] = useState<DBLookbook | null>(null);
  const [isLbDialogOpen, setIsLbDialogOpen] = useState(false);

  // Form State: Look
  const [lkTitle, setLkTitle] = useState("");
  const [lkDescription, setLkDescription] = useState("");
  const [lkImageUrl, setLkImageUrl] = useState("");
  const [lkSortOrder, setLkSortOrder] = useState<number>(0);
  const [isSavingLk, setIsSavingLk] = useState(false);
  const [editingLk, setEditingLk] = useState<DBLook | null>(null);
  const [isLkDialogOpen, setIsLkDialogOpen] = useState(false);

  // Hotspot Placement State
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [pendingSpot, setPendingSpot] = useState<{ x: number; y: number } | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [isSavingSpot, setIsSavingSpot] = useState(false);

  // File Upload State
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingLookImg, setIsUploadingLookImg] = useState(false);

  useEffect(() => {
    fetchLookbooks();
    fetchProducts();
  }, []);

  // Fetch lookbooks
  const fetchLookbooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lookbooks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "PGRST116" || error.message.includes("does not exist")) {
          setDbAvailable(false);
        }
        throw error;
      }
      setLookbooks(data || []);
      setDbAvailable(true);
    } catch (e) {
      const err = e as Error;
      console.warn("Lookbooks table not yet initialized or connection failed:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products for hotspot tagging
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug")
        .eq("status", "published")
        .order("name", { ascending: true });
      if (error) throw error;
      setProducts(data || []);
    } catch (e) {
      console.warn("Failed to load products list for hotspots tagging:", e);
    }
  };

  // Fetch looks for a selected lookbook
  const fetchLooks = async (lookbookId: string) => {
    try {
      const { data, error } = await supabase
        .from("looks")
        .select("*")
        .eq("lookbook_id", lookbookId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setLooks(data || []);
    } catch (e) {
      toast.error("Failed to load looks");
    }
  };

  // Fetch spots for a selected look
  const fetchSpots = async (lookId: string) => {
    try {
      const { data, error } = await supabase
        .from("look_spots")
        .select("*")
        .eq("look_id", lookId);
      if (error) throw error;
      setSpots(data || []);
    } catch (e) {
      toast.error("Failed to load spots");
    }
  };

  // Lookbook creation / update
  const handleSaveLookbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lbTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSavingLb(true);
    const payload = {
      title: lbTitle,
      subtitle: lbSubtitle || null,
      description: lbDescription || null,
      cover_image: lbCoverImage || null,
      status: lbStatus
    };

    try {
      if (editingLb) {
        const { error } = await supabase
          .from("lookbooks")
          .update(payload)
          .eq("id", editingLb.id);
        if (error) throw error;
        toast.success("Lookbook updated successfully");
      } else {
        const { error } = await supabase
          .from("lookbooks")
          .insert(payload);
        if (error) throw error;
        toast.success("Lookbook created successfully");
      }
      setIsLbDialogOpen(false);
      resetLbForm();
      fetchLookbooks();
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to save lookbook");
    } finally {
      setIsSavingLb(false);
    }
  };

  // Delete lookbook
  const handleDeleteLookbook = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lookbook? This will delete all associated looks and hotspots!")) return;
    try {
      const { error } = await supabase
        .from("lookbooks")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Lookbook deleted");
      fetchLookbooks();
      if (selectedLookbook?.id === id) {
        setCurrentView('list');
        setSelectedLookbook(null);
      }
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to delete");
    }
  };

  // Look creation / update
  const handleSaveLook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLookbook) return;
    if (!lkTitle.trim() || !lkImageUrl.trim()) {
      toast.error("Title and Image URL are required");
      return;
    }

    setIsSavingLk(true);
    const payload = {
      lookbook_id: selectedLookbook.id,
      title: lkTitle,
      description: lkDescription || null,
      image_url: lkImageUrl,
      sort_order: lkSortOrder
    };

    try {
      if (editingLk) {
        const { error } = await supabase
          .from("looks")
          .update(payload)
          .eq("id", editingLk.id);
        if (error) throw error;
        toast.success("Look updated");
      } else {
        const { error } = await supabase
          .from("looks")
          .insert(payload);
        if (error) throw error;
        toast.success("Look added");
      }
      setIsLkDialogOpen(false);
      resetLkForm();
      fetchLooks(selectedLookbook.id);
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to save look");
    } finally {
      setIsSavingLk(false);
    }
  };

  // Delete look
  const handleDeleteLook = async (id: string) => {
    if (!confirm("Are you sure you want to delete this look?")) return;
    try {
      const { error } = await supabase
        .from("looks")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Look deleted");
      if (selectedLookbook) {
        fetchLooks(selectedLookbook.id);
      }
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to delete look");
    }
  };

  // Hotspot Click Placement
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingSpot({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
    setSelectedProductId(products[0]?.id || "");
  };

  // Save Hotspot Spot
  const handleSaveSpot = async () => {
    if (!selectedLook || !pendingSpot || !selectedProductId) return;
    setIsSavingSpot(true);

    try {
      const { error } = await supabase
        .from("look_spots")
        .insert({
          look_id: selectedLook.id,
          product_id: selectedProductId,
          x: pendingSpot.x,
          y: pendingSpot.y
        });

      if (error) throw error;
      toast.success("Hotspot pin added");
      setPendingSpot(null);
      fetchSpots(selectedLook.id);
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to save pin");
    } finally {
      setIsSavingSpot(false);
    }
  };

  // Delete Hotspot Spot
  const handleDeleteSpot = async (spotId: string) => {
    try {
      const { error } = await supabase
        .from("look_spots")
        .delete()
        .eq("id", spotId);
      if (error) throw error;
      toast.success("Hotspot removed");
      if (selectedLook) {
        fetchSpots(selectedLook.id);
      }
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to delete spot");
    }
  };

  // Image Upload: Lookbook Cover
  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingCover(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `cover-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `lookbooks/covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setLbCoverImage(data.publicUrl);
      toast.success("Cover image uploaded successfully!");
    } catch (err) {
      const errorMsg = (err as Error).message || "Failed to upload cover image";
      toast.error(errorMsg);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Image Upload: Look Image
  const handleUploadLookImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingLookImg(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `look-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `lookbooks/looks/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setLkImageUrl(data.publicUrl);
      toast.success("Look image uploaded successfully!");
    } catch (err) {
      const errorMsg = (err as Error).message || "Failed to upload look image";
      toast.error(errorMsg);
    } finally {
      setIsUploadingLookImg(false);
    }
  };

  // Resets
  const resetLbForm = () => {
    setLbTitle("");
    setLbSubtitle("");
    setLbDescription("");
    setLbCoverImage("");
    setLbStatus("draft");
    setEditingLb(null);
  };

  const resetLkForm = () => {
    setLkTitle("");
    setLkDescription("");
    setLkImageUrl("");
    setLkSortOrder(0);
    setEditingLk(null);
  };

  const handleEditLbClick = (lb: DBLookbook) => {
    setEditingLb(lb);
    setLbTitle(lb.title);
    setLbSubtitle(lb.subtitle || "");
    setLbDescription(lb.description || "");
    setLbCoverImage(lb.cover_image || "");
    setLbStatus(lb.status);
    setIsLbDialogOpen(true);
  };

  const handleEditLkClick = (lk: DBLook) => {
    setEditingLk(lk);
    setLkTitle(lk.title);
    setLkDescription(lk.description || "");
    setLkImageUrl(lk.image_url);
    setLkSortOrder(lk.sort_order);
    setIsLkDialogOpen(true);
  };

  const handleManageLooksClick = (lb: DBLookbook) => {
    setSelectedLookbook(lb);
    fetchLooks(lb.id);
    setCurrentView('lookbook-detail');
  };

  const handleHotspotsClick = (lk: DBLook) => {
    setSelectedLook(lk);
    fetchSpots(lk.id);
    setPendingSpot(null);
    setCurrentView('hotspots');
  };

  return (
    <div className="space-y-6">
      
      {/* DB Check Notice */}
      {!dbAvailable && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md text-sm font-light">
          <strong>Database Sync Required:</strong> The <code>lookbooks</code> tables have not been fully initialized in this database yet. You must apply migrations to manage live collections. Falling back to storefront presets.
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span>Lookbook Editorial Campaign Management</span>
          </h1>
          <p className="text-muted-foreground font-light text-sm">
            Curate visuals, design hotspots (shop-the-look tags), and publish editorial grids.
          </p>
        </div>
        {currentView === 'list' && (
          <Button 
            disabled={!dbAvailable} 
            onClick={() => { resetLbForm(); setIsLbDialogOpen(true); }}
            className="font-light gap-2 rounded-none"
          >
            <Plus size={16} />
            <span>Create Campaign Lookbook</span>
          </Button>
        )}
      </div>

      {/* VIEW: list (Campaign lookbooks grid) */}
      {currentView === 'list' && (
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="font-normal text-lg">Active Editorial Campaigns</CardTitle>
            <CardDescription className="font-light">
              Overview of all collection campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <span className="text-sm font-light">Loading lookbooks...</span>
              </div>
            ) : lookbooks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground font-light text-sm">
                No active campaign lookbooks found in the database.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lookbooks.map((lb) => (
                  <div key={lb.id} className="border border-border bg-muted/5 flex flex-col group relative overflow-hidden">
                    <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                      {lb.cover_image ? (
                        <img 
                          src={lb.cover_image} 
                          alt={lb.title} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Camera size={32} className="opacity-40" />
                        </div>
                      )}
                      <span className={`absolute top-2 right-2 text-[10px] uppercase font-medium px-2 py-0.5 tracking-wider border backdrop-blur-xs ${
                        lb.status === 'published' 
                          ? "bg-green-50/90 text-green-700 border-green-200" 
                          : lb.status === 'archived'
                          ? "bg-muted/95 text-muted-foreground border-border"
                          : "bg-amber-50/90 text-amber-700 border-amber-200"
                      }`}>
                        {lb.status}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-medium text-base text-foreground line-clamp-1">{lb.title}</h3>
                        <p className="text-xs text-muted-foreground font-light line-clamp-2 mt-1">{lb.subtitle || "No subtitle"}</p>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-border/60">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleManageLooksClick(lb)}
                          className="flex-1 text-xs font-light rounded-none h-8"
                        >
                          <ListPlus size={12} className="mr-1" />
                          <span>Manage Looks</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditLbClick(lb)}
                          className="h-8 w-8 hover:bg-muted"
                        >
                          <Edit2 size={13} className="text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteLookbook(lb.id)}
                          className="h-8 w-8 hover:bg-destructive/10"
                        >
                          <Trash2 size={13} className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* VIEW: lookbook-detail (Manage looks inside a lookbook) */}
      {currentView === 'lookbook-detail' && selectedLookbook && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setCurrentView('list')} className="rounded-none font-light">
              <ArrowLeft size={14} className="mr-1" />
              <span>Back to Campaigns</span>
            </Button>
            <h2 className="text-xl font-normal text-foreground">
              Campaign: <strong className="font-medium">{selectedLookbook.title}</strong>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left/Center: Looks List (2 Cols) */}
            <Card className="lg:col-span-2 border border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-normal text-lg">Looks & Editorial Images</CardTitle>
                  <CardDescription className="font-light">
                    Add specific looks/outfits inside this campaign campaign.
                  </CardDescription>
                </div>
                <Button onClick={() => { resetLkForm(); setIsLkDialogOpen(true); }} className="font-light gap-2 rounded-none text-xs h-8">
                  <PlusCircle size={14} />
                  <span>Add Look</span>
                </Button>
              </CardHeader>
              <CardContent>
                {looks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground font-light text-sm">
                    No looks defined in this campaign yet. Add one to start tagging hotspots.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {looks.map((lk) => (
                      <div key={lk.id} className="flex gap-4 p-4 border border-border bg-muted/5 items-center justify-between">
                        <div className="flex gap-4 items-center">
                          <div className="w-16 h-20 bg-muted border border-border overflow-hidden">
                            <img src={lk.image_url} alt={lk.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-foreground">{lk.title}</h4>
                            <p className="text-xs text-muted-foreground font-light mt-0.5 line-clamp-1">{lk.description || "No description"}</p>
                            <span className="text-[10px] text-muted-foreground/80 bg-muted px-2 py-0.5 mt-2 inline-block rounded-full font-light">
                              Sort Order: {lk.sort_order}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleHotspotsClick(lk)}
                            className="text-xs font-light h-8 rounded-none gap-1 bg-background"
                          >
                            <MapPin size={12} className="text-primary" />
                            <span>Edit Hotspots</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditLkClick(lk)}
                            className="h-8 w-8 hover:bg-muted"
                          >
                            <Edit2 size={13} className="text-muted-foreground" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteLook(lk.id)}
                            className="h-8 w-8 hover:bg-destructive/10"
                          >
                            <Trash2 size={13} className="text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: Lookbook Metadata details (1 Col) */}
            <Card className="lg:col-span-1 border border-border h-fit">
              <CardHeader>
                <CardTitle className="font-normal text-lg">Campaign Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm font-light">
                <div className="aspect-[16/10] bg-muted border border-border overflow-hidden">
                  {selectedLookbook.cover_image && (
                    <img src={selectedLookbook.cover_image} alt={selectedLookbook.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Subtitle</p>
                  <p className="text-foreground font-normal">{selectedLookbook.subtitle || "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Description</p>
                  <p className="text-foreground leading-relaxed text-xs">{selectedLookbook.description || "—"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                  <p className="capitalize font-normal text-foreground">{selectedLookbook.status}</p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      )}

      {/* VIEW: hotspots (Interactive hotspot selector dashboard) */}
      {currentView === 'hotspots' && selectedLook && selectedLookbook && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setCurrentView('lookbook-detail');
                fetchLooks(selectedLookbook.id);
              }} 
              className="rounded-none font-light"
            >
              <ArrowLeft size={14} className="mr-1" />
              <span>Back to Looks</span>
            </Button>
            <h2 className="text-xl font-normal text-foreground">
              Hotspots Manager: <strong className="font-medium">{selectedLook.title}</strong>
            </h2>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Visual Hotspots Editor Panel (8 Cols) */}
            <Card className="lg:col-span-8 border border-border">
              <CardHeader>
                <CardTitle className="font-normal text-lg">Add Pins on Look</CardTitle>
                <CardDescription className="font-light">
                  Click directly anywhere on the image below to place a shop spot.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  ref={imageContainerRef}
                  onClick={handleImageClick}
                  className="relative aspect-[3/4] md:aspect-[4/5] bg-black overflow-hidden cursor-crosshair border border-border"
                >
                  <img 
                    src={selectedLook.image_url} 
                    alt={selectedLook.title} 
                    className="w-full h-full object-cover select-none pointer-events-none" 
                  />

                  {/* Render Existing Hotspot Pins */}
                  {spots.map((sp) => {
                    const matchedProd = products.find(p => p.id === sp.product_id);
                    return (
                      <div
                        key={sp.id}
                        onClick={(e) => e.stopPropagation()} // Prevent triggering new spot placing
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center group"
                        style={{ left: `${sp.x}%`, top: `${sp.y}%` }}
                      >
                        <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg font-bold text-xs select-none">
                          <MapPin size={14} />
                        </div>
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-xs border border-border p-2 text-[10px] w-36 shadow-lg hidden group-hover:block z-40 text-center font-normal">
                          <p className="truncate font-medium">{matchedProd?.name || "Unknown Product"}</p>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDeleteSpot(sp.id)}
                            className="h-5 text-[9px] w-full mt-1.5 rounded-none font-light py-0 px-2"
                          >
                            Delete Tag
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Render Pending Spot Pin */}
                  {pendingSpot && (
                    <div
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                      style={{ left: `${pendingSpot.x}%`, top: `${pendingSpot.y}%` }}
                    >
                      <div className="h-7 w-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg animate-bounce">
                        <Plus size={14} />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right: Tag details and settings panel (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Placement box */}
              {pendingSpot ? (
                <Card className="border border-amber-300 bg-amber-50/5">
                  <CardHeader>
                    <CardTitle className="font-normal text-base text-amber-800 flex items-center gap-1.5">
                      <MapPin size={16} />
                      <span>Tag Product</span>
                    </CardTitle>
                    <CardDescription className="text-amber-700/80 font-light text-xs">
                      Coordinate: {pendingSpot.x}%, {pendingSpot.y}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="tag-product-select">Select Product *</Label>
                      <Select 
                        value={selectedProductId}
                        onValueChange={(val) => setSelectedProductId(val)}
                      >
                        <SelectTrigger id="tag-product-select" className="bg-background border-border font-light text-xs">
                          <SelectValue placeholder="Search product" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-border">
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id} className="font-light text-xs">
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPendingSpot(null)}
                        className="flex-1 rounded-none font-light h-9 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSaveSpot}
                        disabled={isSavingSpot || !selectedProductId}
                        className="flex-1 rounded-none font-light h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        {isSavingSpot ? "Saving..." : "Save Spot"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="font-normal text-base">Select Pin Area</CardTitle>
                    <CardDescription className="font-light text-xs">
                      No spot selected. Click on the lookbook image to add a new shopping pin.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              {/* Spots List */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="font-normal text-base">Tagged Products ({spots.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 font-light text-xs">
                  {spots.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4 font-light text-xs">
                      No products tagged in this look yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {spots.map((sp) => {
                        const matchedProd = products.find(p => p.id === sp.product_id);
                        return (
                          <div key={sp.id} className="flex justify-between items-center p-2 border border-border bg-muted/10 rounded-sm">
                            <span className="font-medium truncate max-w-[70%]">
                              {matchedProd?.name || "Unknown Product"}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">
                                ({sp.x}%, {sp.y}%)
                              </span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteSpot(sp.id)}
                                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                              >
                                <X size={12} />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      )}

      {/* DIALOG: Lookbook Add/Edit Form */}
      <Dialog open={isLbDialogOpen} onOpenChange={setIsLbDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-border">
          <DialogHeader>
            <DialogTitle className="font-normal">
              {editingLb ? "Edit Campaign Lookbook" : "Create Campaign Lookbook"}
            </DialogTitle>
            <DialogDescription className="font-light">
              Fill details to configure lookbook.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveLookbook} className="space-y-4 text-xs font-light">
            <div className="space-y-1">
              <Label htmlFor="lb-title">Campaign Title *</Label>
              <Input
                id="lb-title"
                type="text"
                placeholder="e.g. Summer Oasis"
                value={lbTitle}
                onChange={(e) => setLbTitle(e.target.value)}
                disabled={isSavingLb}
                className="font-light bg-background"
                required
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="lb-subtitle">Subtitle</Label>
              <Input
                id="lb-subtitle"
                type="text"
                placeholder="e.g. High Summer Campaign"
                value={lbSubtitle}
                onChange={(e) => setLbSubtitle(e.target.value)}
                disabled={isSavingLb}
                className="font-light bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lb-desc">Description</Label>
              <Input
                id="lb-desc"
                type="text"
                placeholder="e.g. Breezy linens and warm light outfits..."
                value={lbDescription}
                onChange={(e) => setLbDescription(e.target.value)}
                disabled={isSavingLb}
                className="font-light bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lb-cover">Cover Image</Label>
              <div className="flex gap-2">
                <Input
                  id="lb-cover"
                  type="text"
                  placeholder="https://images.unsplash.com/photo-... or upload"
                  value={lbCoverImage}
                  onChange={(e) => setLbCoverImage(e.target.value)}
                  disabled={isSavingLb || isUploadingCover}
                  className="font-light bg-background flex-1 text-xs"
                />
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadCover}
                    disabled={isSavingLb || isUploadingCover}
                    className="hidden"
                    id="lb-cover-file"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-3 rounded-none text-xs font-light gap-1"
                    disabled={isSavingLb || isUploadingCover}
                    onClick={() => document.getElementById("lb-cover-file")?.click()}
                  >
                    <Upload size={14} />
                    <span>{isUploadingCover ? "..." : "Upload"}</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="lb-status-select">Status</Label>
              <Select 
                value={lbStatus}
                onValueChange={(val) => setLbStatus(val as 'draft' | 'published' | 'archived')}
                disabled={isSavingLb}
              >
                <SelectTrigger id="lb-status-select" className="bg-background border-border font-light text-xs">
                  <SelectValue placeholder="Draft" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-border">
                  <SelectItem value="draft" className="font-light text-xs">Draft</SelectItem>
                  <SelectItem value="published" className="font-light text-xs">Published</SelectItem>
                  <SelectItem value="archived" className="font-light text-xs">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsLbDialogOpen(false)}
                disabled={isSavingLb}
                className="font-light rounded-none text-xs h-9"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingLb} className="font-light rounded-none text-xs h-9 bg-primary">
                {isSavingLb ? "Saving..." : "Save Lookbook"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Look Add/Edit Form */}
      <Dialog open={isLkDialogOpen} onOpenChange={setIsLkDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-border">
          <DialogHeader>
            <DialogTitle className="font-normal">
              {editingLk ? "Edit Look Details" : "Add Look to Campaign"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveLook} className="space-y-4 text-xs font-light">
            <div className="space-y-1">
              <Label htmlFor="lk-title">Look Title *</Label>
              <Input
                id="lk-title"
                type="text"
                placeholder="e.g. Look 01: Canary Dress"
                value={lkTitle}
                onChange={(e) => setLkTitle(e.target.value)}
                disabled={isSavingLk}
                className="font-light bg-background"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lk-desc">Description</Label>
              <Input
                id="lk-desc"
                type="text"
                placeholder="e.g. Lightweight breezy sundress layered with gold necklaces..."
                value={lkDescription}
                onChange={(e) => setLkDescription(e.target.value)}
                disabled={isSavingLk}
                className="font-light bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lk-image">Look Image *</Label>
              <div className="flex gap-2">
                <Input
                  id="lk-image"
                  type="text"
                  placeholder="https://images.unsplash.com/photo-... or upload"
                  value={lkImageUrl}
                  onChange={(e) => setLkImageUrl(e.target.value)}
                  disabled={isSavingLk || isUploadingLookImg}
                  className="font-light bg-background flex-1 text-xs"
                  required
                />
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadLookImg}
                    disabled={isSavingLk || isUploadingLookImg}
                    className="hidden"
                    id="lk-image-file"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-3 rounded-none text-xs font-light gap-1"
                    disabled={isSavingLk || isUploadingLookImg}
                    onClick={() => document.getElementById("lk-image-file")?.click()}
                  >
                    <Upload size={14} />
                    <span>{isUploadingLookImg ? "..." : "Upload"}</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="lk-sort">Sort Order</Label>
              <Input
                id="lk-sort"
                type="number"
                value={lkSortOrder}
                onChange={(e) => setLkSortOrder(parseInt(e.target.value) || 0)}
                disabled={isSavingLk}
                className="font-light bg-background"
              />
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsLkDialogOpen(false)}
                disabled={isSavingLk}
                className="font-light rounded-none text-xs h-9"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingLk} className="font-light rounded-none text-xs h-9 bg-primary">
                {isSavingLk ? "Saving..." : "Save Look"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminLookbooks;
