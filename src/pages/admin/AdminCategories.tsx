import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FolderTree, Plus, Edit2, Trash2, FolderPlus, Loader2 } from "lucide-react";
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

interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State for Add
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<string>("none");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog State for Edit
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editParentId, setEditParentId] = useState<string>("none");
  const [editSortOrder, setEditSortOrder] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Auto-generate slug from name
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

  const handleEditNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditName(val);
    setEditSlug(generateSlug(val));
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch {
      console.error("Error fetching categories");
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error("Category name and slug are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const categoryData = {
        name,
        slug,
        parent_id: parentId === "none" ? null : parentId,
        sort_order: sortOrder,
      };

      const { error } = await supabase
        .from("categories")
        .insert(categoryData);

      if (error) throw error;

      toast.success("Category added successfully");
      setName("");
      setSlug("");
      setParentId("none");
      setSortOrder(0);
      fetchCategories();
    } catch {
      console.error("Failed to add category");
      toast.error("Failed to add category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditSlug(category.slug);
    setEditParentId(category.parent_id || "none");
    setEditSortOrder(category.sort_order);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editName.trim() || !editSlug.trim()) {
      toast.error("Category name and slug are required");
      return;
    }

    setIsUpdating(true);
    try {
      const updatedData = {
        name: editName,
        slug: editSlug,
        parent_id: editParentId === "none" ? null : editParentId,
        sort_order: editSortOrder,
      };

      const { error } = await supabase
        .from("categories")
        .update(updatedData)
        .eq("id", editingCategory.id);

      if (error) throw error;

      toast.success("Category updated successfully");
      setEditingCategory(null);
      fetchCategories();
    } catch {
      console.error("Failed to update category");
      toast.error("Failed to update category");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    // 1. Guard check: Check if any product is associated with this category
    try {
      const { data: products, error: productErr } = await supabase
        .from("products")
        .select("id")
        .eq("category_id", id)
        .limit(1);

      if (productErr) throw productErr;

      if (products && products.length > 0) {
        toast.error("Cannot delete category: Active products are associated with it.");
        return;
      }

      // 2. Guard check: Check if it has child subcategories
      const hasChildren = categories.some((c) => c.parent_id === id);
      if (hasChildren) {
        toast.error("Cannot delete category: It contains active subcategories. Delete children first.");
        return;
      }

      // 3. Delete category
      if (!confirm("Are you sure you want to delete this category?")) return;

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Category deleted successfully");
      fetchCategories();
    } catch {
      console.error("Failed to delete category");
      toast.error("Failed to delete category");
    }
  };

  // Group root categories and subcategories
  const rootCategories = categories.filter((c) => !c.parent_id);
  const getSubcategories = (parentId: string) => {
    return categories.filter((c) => c.parent_id === parentId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight flex items-center gap-2">
            <FolderTree className="h-8 w-8 text-primary" />
            <span>Category Management</span>
          </h1>
          <p className="text-muted-foreground font-light text-sm">
            Organize catalog classifications, define subcategories, and manage sort orders.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Add Category */}
        <Card className="lg:col-span-1 border border-border h-fit">
          <CardHeader>
            <CardTitle className="font-normal text-lg flex items-center gap-2">
              <FolderPlus size={18} />
              <span>Create Category</span>
            </CardTitle>
            <CardDescription className="font-light">
              Add a new category or subcategory to your store catalog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="category-name">Category Name *</Label>
                <Input
                  id="category-name"
                  type="text"
                  placeholder="e.g. Earrings"
                  value={name}
                  onChange={handleNameChange}
                  disabled={isSubmitting}
                  className="font-light bg-background"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="category-slug">URL Slug *</Label>
                <Input
                  id="category-slug"
                  type="text"
                  placeholder="e.g. earrings"
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  disabled={isSubmitting}
                  className="font-light bg-background"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="parent-category">Parent Category</Label>
                <Select
                  value={parentId}
                  onValueChange={(val) => setParentId(val)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="parent-category" className="font-light bg-background">
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-border">
                    <SelectItem value="none" className="font-light">None (Root Category)</SelectItem>
                    {rootCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="font-light">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="sort-order">Sort Order</Label>
                <Input
                  id="sort-order"
                  type="number"
                  placeholder="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  disabled={isSubmitting}
                  className="font-light bg-background"
                />
              </div>

              <Button type="submit" className="w-full font-light py-5 mt-4" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Adding...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Plus size={16} />
                    <span>Add Category</span>
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right List: Tree view */}
        <Card className="lg:col-span-2 border border-border">
          <CardHeader>
            <CardTitle className="font-normal text-lg">Categories Catalog</CardTitle>
            <CardDescription className="font-light">
              Hierarchical view of your store's categories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <span className="text-sm font-light">Loading catalog structure...</span>
              </div>
            ) : rootCategories.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground font-light text-sm">
                No categories found. Create one using the form on the left.
              </div>
            ) : (
              <div className="space-y-4">
                {rootCategories.map((root) => {
                  const children = getSubcategories(root.id);
                  return (
                    <div key={root.id} className="border border-border rounded-md p-4 bg-muted/5 space-y-3">
                      <div className="flex justify-between items-center bg-background p-2 px-3 border border-border/80 rounded-md">
                        <div className="flex items-center gap-2">
                          <FolderTree className="h-4 w-4 text-primary/70" />
                          <span className="font-medium text-sm">{root.name}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-light">
                            /{root.slug} (Order: {root.sort_order})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-muted"
                            onClick={() => handleEditClick(root)}
                          >
                            <Edit2 size={14} className="text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-destructive/10"
                            onClick={() => handleDeleteCategory(root.id)}
                          >
                            <Trash2 size={14} className="text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {/* Render Children */}
                      {children.length > 0 && (
                        <div className="pl-6 border-l border-border/80 space-y-2">
                          {children.map((child) => (
                            <div key={child.id} className="flex justify-between items-center bg-background p-2 px-3 border border-border/40 rounded-md">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/45" />
                                <span className="text-sm font-light">{child.name}</span>
                                <span className="text-xs text-muted-foreground bg-muted/65 px-2 py-0.5 rounded-full font-light">
                                  /{child.slug} (Order: {child.sort_order})
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 hover:bg-muted"
                                  onClick={() => handleEditClick(child)}
                                >
                                  <Edit2 size={14} className="text-muted-foreground" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 hover:bg-destructive/10"
                                  onClick={() => handleDeleteCategory(child.id)}
                                >
                                  <Trash2 size={14} className="text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={editingCategory !== null} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="sm:max-w-md bg-white border border-border">
          <DialogHeader>
            <DialogTitle className="font-normal">Edit Category</DialogTitle>
            <DialogDescription className="font-light">
              Modify the properties of category "{editingCategory?.name}".
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCategory} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-category-name">Category Name *</Label>
              <Input
                id="edit-category-name"
                type="text"
                value={editName}
                onChange={handleEditNameChange}
                disabled={isUpdating}
                className="font-light bg-background"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-category-slug">URL Slug *</Label>
              <Input
                id="edit-category-slug"
                type="text"
                value={editSlug}
                onChange={(e) => setEditSlug(generateSlug(e.target.value))}
                disabled={isUpdating}
                className="font-light bg-background"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-parent-category">Parent Category</Label>
              <Select
                value={editParentId}
                onValueChange={(val) => setEditParentId(val)}
                disabled={isUpdating}
              >
                <SelectTrigger id="edit-parent-category" className="font-light bg-background">
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-border">
                  <SelectItem value="none" className="font-light">None (Root Category)</SelectItem>
                  {rootCategories
                    .filter((c) => c.id !== editingCategory?.id) // Prevent self-referencing
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id} className="font-light">
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-sort-order">Sort Order</Label>
              <Input
                id="edit-sort-order"
                type="number"
                value={editSortOrder}
                onChange={(e) => setEditSortOrder(parseInt(e.target.value) || 0)}
                disabled={isUpdating}
                className="font-light bg-background"
              />
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingCategory(null)}
                disabled={isUpdating}
                className="font-light"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating} className="font-light">
                {isUpdating ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
