import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShoppingCart, Search, Filter, Eye, Loader2, RefreshCw, Calendar, MapPin, Phone, Mail, User } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Interfaces
interface Order {
  id: string;
  user_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  shipping_option: string;
  shipping_cost: number;
  subtotal: number;
  discount_amount: number;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  created_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string | null;
  quantity: number;
  price: number;
  product_name?: string;
  sku?: string;
}

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Selected Order details
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editStatus, setEditStatus] = useState<Order["status"]>("pending");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (error) throw error;

      // Populate item names/SKUs from variants & products
      const populatedItems = await Promise.all(
        (data || []).map(async (item) => {
          if (!item.variant_id) {
            return { ...item, product_name: "Unknown Product", sku: "N/A" };
          }

          // Fetch variant info
          const { data: variantData } = await supabase
            .from("product_variants")
            .select("product_id, sku")
            .eq("id", item.variant_id)
            .single();

          if (variantData) {
            // Fetch product info
            const { data: productData } = await supabase
              .from("products")
              .select("name")
              .eq("id", variantData.product_id)
              .single();

            return {
              ...item,
              product_name: productData?.name || "Product",
              sku: variantData.sku || "N/A"
            };
          }

          return { ...item, product_name: "Product Variant", sku: "N/A" };
        })
      );

      setOrderItems(populatedItems);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load order items details");
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleViewClick = (order: Order) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    fetchOrderItems(order.id);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: editStatus })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast.success("Order status updated successfully!");
      
      // Update local states
      setSelectedOrder(prev => prev ? { ...prev, status: editStatus } : null);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: editStatus } : o));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: "numeric", 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  // Filter orders
  const filteredOrders = orders.filter(o => {
    const fullName = `${o.first_name} ${o.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                          o.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <span>Order Fulfillment</span>
          </h1>
          <p className="text-muted-foreground font-light text-sm">
            Monitor incoming customer purchases, review items purchased, and update logistics statuses.
          </p>
        </div>

        <Button variant="outline" className="font-light gap-2" onClick={fetchOrders}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by customer name, email, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 font-light bg-background"
            />
          </div>

          <div className="w-full md:w-[220px]">
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
              <SelectTrigger className="font-light bg-background w-full">
                <Filter className="h-3 w-3 mr-2 opacity-60" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-border">
                <SelectItem value="all" className="font-light">All Statuses</SelectItem>
                <SelectItem value="pending" className="font-light">Pending</SelectItem>
                <SelectItem value="processing" className="font-light">Processing</SelectItem>
                <SelectItem value="shipped" className="font-light">Shipped</SelectItem>
                <SelectItem value="delivered" className="font-light">Delivered</SelectItem>
                <SelectItem value="cancelled" className="font-light">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin mb-3" />
              <span className="text-sm font-light">Loading orders...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground font-light text-sm">
              No orders found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="p-4 pl-6 font-medium">Order ID</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Customer</th>
                    <th className="p-4 font-medium">Total</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 pr-6 text-right font-medium">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-light">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 pl-6 font-mono text-xs text-muted-foreground truncate max-w-[120px]">
                        {order.id}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-foreground">{order.first_name} {order.last_name}</div>
                        <div className="text-xs text-muted-foreground font-light">{order.email}</div>
                      </td>
                      <td className="p-4 font-normal">
                        €{order.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <Badge 
                          className={`font-light rounded-full text-xs px-2.5 py-0.5 border ${
                            order.status === "delivered" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : order.status === "shipped" 
                              ? "bg-blue-50 text-blue-700 border-blue-200" 
                              : order.status === "processing" 
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                              : order.status === "pending" 
                              ? "bg-amber-50 text-amber-700 border-amber-200" 
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-muted"
                          onClick={() => handleViewClick(order)}
                        >
                          <Eye size={14} className="text-muted-foreground hover:text-foreground" />
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

      {/* Order Details Dialog */}
      <Dialog open={selectedOrder !== null} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-2xl bg-white border border-border h-[90vh] md:h-auto overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-normal text-lg flex items-center gap-2">
              <span>Order Details</span>
              <span className="font-mono text-xs text-muted-foreground">({selectedOrder?.id.substring(0, 8)}...)</span>
            </DialogTitle>
            <DialogDescription className="font-light text-xs">
              Review transaction contents and adjust shipment stages.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 mt-4">
              {/* Order Status Controller */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-border rounded bg-muted/10 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block">Fulfillment Status</span>
                  <Badge 
                    className={`font-light rounded-full text-xs px-2.5 py-0.5 border ${
                      selectedOrder.status === "delivered" 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : selectedOrder.status === "shipped" 
                        ? "bg-blue-50 text-blue-700 border-blue-200" 
                        : selectedOrder.status === "processing" 
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                        : selectedOrder.status === "pending" 
                        ? "bg-amber-50 text-amber-700 border-amber-200" 
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {selectedOrder.status}
                  </Badge>
                </div>

                <div className="flex gap-2 items-center">
                  <Select 
                    value={editStatus} 
                    onValueChange={(val: any) => setEditStatus(val)}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="font-light bg-background w-[160px] h-9">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-border">
                      <SelectItem value="pending" className="font-light">Pending</SelectItem>
                      <SelectItem value="processing" className="font-light">Processing</SelectItem>
                      <SelectItem value="shipped" className="font-light">Shipped</SelectItem>
                      <SelectItem value="delivered" className="font-light">Delivered</SelectItem>
                      <SelectItem value="cancelled" className="font-light text-destructive">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    size="sm" 
                    className="font-light h-9" 
                    onClick={handleUpdateStatus}
                    disabled={updatingStatus || editStatus === selectedOrder.status}
                  >
                    {updatingStatus ? "Saving..." : "Apply"}
                  </Button>
                </div>
              </div>

              {/* Grid: Customer Info & Shipping Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-border rounded p-4 space-y-3">
                  <h4 className="font-normal text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User size={12} />
                    <span>Customer Information</span>
                  </h4>
                  <div className="space-y-2 text-xs font-light">
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-foreground">Name:</span> {selectedOrder.first_name} {selectedOrder.last_name}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail size={12} className="text-muted-foreground" />
                      <span>{selectedOrder.email}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone size={12} className="text-muted-foreground" />
                      <span>{selectedOrder.phone}</span>
                    </p>
                  </div>
                </div>

                <div className="border border-border rounded p-4 space-y-3">
                  <h4 className="font-normal text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPin size={12} />
                    <span>Shipping Address</span>
                  </h4>
                  <div className="space-y-1 text-xs font-light">
                    <p className="text-foreground">{selectedOrder.shipping_address}</p>
                    <p className="text-foreground">{selectedOrder.shipping_city}, {selectedOrder.shipping_postal_code}</p>
                    <p className="text-foreground">{selectedOrder.shipping_country}</p>
                    <p className="text-[10px] text-muted-foreground pt-1 italic">
                      Method: {selectedOrder.shipping_option} (+€{selectedOrder.shipping_cost.toFixed(2)})
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items Breakdown */}
              <div className="space-y-2">
                <h4 className="font-normal text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShoppingCart size={12} />
                  <span>Order Items</span>
                </h4>

                {loadingItems ? (
                  <div className="flex justify-center py-6 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="border border-border rounded overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/20 text-muted-foreground uppercase font-semibold">
                          <th className="p-3 pl-4">Item</th>
                          <th className="p-3">SKU</th>
                          <th className="p-3 text-center">Qty</th>
                          <th className="p-3 text-right pr-4">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-light">
                        {orderItems.map((item) => (
                          <tr key={item.id}>
                            <td className="p-3 pl-4">
                              <span className="font-medium text-foreground">{item.product_name}</span>
                            </td>
                            <td className="p-3 font-mono text-muted-foreground">{item.sku}</td>
                            <td className="p-3 text-center">{item.quantity}</td>
                            <td className="p-3 text-right pr-4">
                              €{item.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Order Financial Totals */}
              <div className="border-t border-border pt-4 flex flex-col items-end text-xs space-y-1.5">
                <div className="flex justify-between w-full max-w-[240px] font-light">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="text-foreground">€{selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[240px] font-light">
                  <span className="text-muted-foreground">Shipping Cost:</span>
                  <span className="text-foreground">€{selectedOrder.shipping_cost.toFixed(2)}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between w-full max-w-[240px] font-light text-emerald-600">
                    <span>Discount:</span>
                    <span>-€{selectedOrder.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between w-full max-w-[240px] font-semibold text-sm pt-2 border-t border-border/60">
                  <span>Grand Total:</span>
                  <span>€{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-light flex-1">
                  <Calendar size={12} />
                  <span>Placed: {formatDate(selectedOrder.created_at)}</span>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setSelectedOrder(null)}
                  className="font-light text-xs h-9"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
