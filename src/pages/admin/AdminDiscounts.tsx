import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Discount {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order_value: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  code: "",
  type: "percentage" as "percentage" | "fixed",
  value: "",
  min_order_value: "0",
  starts_at: "",
  ends_at: "",
  is_active: true,
};

const AdminDiscounts: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDiscounts(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load discount codes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setIsDialogOpen(true);
  };

  const openEdit = (d: Discount) => {
    setEditingId(d.id);
    setForm({
      code: d.code,
      type: d.type,
      value: String(d.value),
      min_order_value: String(d.min_order_value),
      starts_at: d.starts_at ? d.starts_at.slice(0, 10) : "",
      ends_at: d.ends_at ? d.ends_at.slice(0, 10) : "",
      is_active: d.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) return toast.error("Discount code is required.");
    if (!form.value || Number(form.value) <= 0) return toast.error("Value must be greater than 0.");
    if (form.type === "percentage" && Number(form.value) > 100)
      return toast.error("Percentage discount cannot exceed 100.");

    setIsSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        min_order_value: Number(form.min_order_value) || 0,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        is_active: form.is_active,
      };

      if (editingId) {
        const { error } = await supabase.from("discounts").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Discount code updated.");
      } else {
        const { error } = await supabase.from("discounts").insert(payload);
        if (error) {
          if (error.code === "23505") throw new Error("A discount with that code already exists.");
          throw error;
        }
        toast.success("Discount code created.");
      }

      setIsDialogOpen(false);
      await load();
    } catch (err: unknown) {
      toast.error("Failed to save discount.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("discounts").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Discount code deleted.");
      setDiscounts((prev) => prev.filter((d) => d.id !== deleteId));
    } catch {
      toast.error("Failed to delete discount.");
    } finally {
      setDeleteId(null);
    }
  };

  const toggleActive = async (d: Discount) => {
    try {
      const { error } = await supabase
        .from("discounts")
        .update({ is_active: !d.is_active })
        .eq("id", d.id);
      if (error) throw error;
      setDiscounts((prev) => prev.map((x) => (x.id === d.id ? { ...x, is_active: !x.is_active } : x)));
    } catch {
      toast.error("Failed to toggle discount status.");
    }
  };

  const formatValue = (d: Discount) =>
    d.type === "percentage" ? `${d.value}% off` : `€${d.value} off`;

  const isExpired = (d: Discount) => d.ends_at && new Date(d.ends_at) < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Discount Codes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage coupon codes for your store.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} />
          New Code
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-14 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      ) : discounts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Tag className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p className="text-sm">No discount codes yet.</p>
          <Button variant="outline" onClick={openCreate} className="mt-4 gap-2 text-sm">
            <Plus size={14} /> Create your first code
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-foreground">Code</th>
                <th className="text-left px-4 py-3 font-medium text-foreground hidden sm:table-cell">Discount</th>
                <th className="text-left px-4 py-3 font-medium text-foreground hidden md:table-cell">Min. Order</th>
                <th className="text-left px-4 py-3 font-medium text-foreground hidden lg:table-cell">Expires</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {discounts.map((d) => (
                <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-foreground">{d.code}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                    {formatValue(d)}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {d.min_order_value > 0 ? `€${d.min_order_value}` : "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {d.ends_at ? (
                      <span className={isExpired(d) ? "text-destructive" : ""}>
                        {new Date(d.ends_at).toLocaleDateString()}
                        {isExpired(d) && " (expired)"}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(d)}
                      className="flex items-center gap-1.5 text-xs font-medium"
                    >
                      {d.is_active ? (
                        <>
                          <CheckCircle size={14} className="text-emerald-500" />
                          <span className="text-emerald-600">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={14} className="text-muted-foreground" />
                          <span className="text-muted-foreground">Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(d)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(d.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-md">
          <DialogHeader>
            <DialogTitle className="font-semibold">
              {editingId ? "Edit Discount Code" : "New Discount Code"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER20"
                className="font-mono uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v as "percentage" | "fixed" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="value">
                  Value * {form.type === "percentage" ? "(%)" : "(€)"}
                </Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  max={form.type === "percentage" ? "100" : undefined}
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  placeholder={form.type === "percentage" ? "20" : "10"}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="min_order">Minimum order value (€)</Label>
              <Input
                id="min_order"
                type="number"
                min="0"
                value={form.min_order_value}
                onChange={(e) => setForm((f) => ({ ...f, min_order_value: e.target.value }))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Leave at 0 for no minimum.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="starts_at">Starts</Label>
                <Input
                  id="starts_at"
                  type="date"
                  value={form.starts_at}
                  onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ends_at">Expires</Label>
                <Input
                  id="ends_at"
                  type="date"
                  value={form.ends_at}
                  onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active (customers can use this code)
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : editingId ? "Save Changes" : "Create Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete discount code?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The code will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDiscounts;
