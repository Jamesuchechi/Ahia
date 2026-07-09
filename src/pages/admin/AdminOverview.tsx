import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Users, 
  Loader2, 
  AlertTriangle, 
  ArrowRight,
  TrendingDown,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

// Interfaces
interface Stats {
  revenue: number;
  ordersCount: number;
  productsCount: number;
  customersCount: number;
}

interface RecentOrder {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  total: number;
  status: string;
  created_at: string;
}

interface LowStockItem {
  id: string;
  sku: string | null;
  stock_qty: number;
  product_name: string;
}

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ revenue: 0, ordersCount: 0, productsCount: 0, customersCount: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders Count & Revenue (sum order totals where status != cancelled)
      const { data: ordersData, error: ordersErr } = await supabase
        .from("orders")
        .select("total, status");
      
      if (ordersErr) throw ordersErr;

      const ordersCount = ordersData?.length || 0;
      const revenue = (ordersData || [])
        .filter(o => o.status !== "cancelled")
        .reduce((sum, o) => sum + o.total, 0);

      // 2. Fetch Products count
      const { count: productsCount, error: prodErr } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      if (prodErr) throw prodErr;

      // 3. Fetch Customers count
      const { count: customersCount, error: custErr } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "customer");

      if (custErr) throw custErr;

      setStats({
        revenue,
        ordersCount,
        productsCount: productsCount || 0,
        customersCount: customersCount || 0
      });

      // 4. Fetch 5 Recent Orders
      const { data: recData } = await supabase
        .from("orders")
        .select("id, first_name, last_name, email, total, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      
      setRecentOrders(recData || []);

      // 5. Fetch low stock variants (stock_qty <= 5)
      const { data: varData } = await supabase
        .from("product_variants")
        .select("id, sku, stock_qty, product_id")
        .lte("stock_qty", 5)
        .order("stock_qty", { ascending: true })
        .limit(5);

      if (varData && varData.length > 0) {
        // Populate product names
        const populatedLowStock = await Promise.all(
          varData.map(async (v) => {
            const { data: p } = await supabase
              .from("products")
              .select("name")
              .eq("id", v.product_id)
              .single();
            return {
              id: v.id,
              sku: v.sku,
              stock_qty: v.stock_qty,
              product_name: p?.name || "Product"
            };
          })
        );
        setLowStockItems(populatedLowStock);
      } else {
        setLowStockItems([]);
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to fetch dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
        <span className="text-sm font-light">Compiling dashboard analytics...</span>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: `€${stats.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: "Net earnings excluding cancelled orders",
      icon: TrendingUp,
      color: "text-emerald-600"
    },
    {
      title: "Total Orders",
      value: stats.ordersCount,
      description: "Lifetime checkouts processed",
      icon: ShoppingCart,
      color: "text-indigo-600"
    },
    {
      title: "Catalog Products",
      value: stats.productsCount,
      description: "Active styles & merchandise",
      icon: Package,
      color: "text-amber-600"
    },
    {
      title: "Active Customers",
      value: stats.customersCount,
      description: "Registered storefront members",
      icon: Users,
      color: "text-rose-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light tracking-tight">Overview</h1>
        <p className="text-muted-foreground font-light text-sm">
          Analytics dashboard compiling real-time financial totals, sales volumes, and logistics reports.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{card.title}</span>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-normal tracking-tight">{card.value}</div>
              <p className="text-[10px] text-muted-foreground font-light mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List (Col span 2) */}
        <Card className="lg:col-span-2 border border-border">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="font-normal text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span>Recent Transactions</span>
              </CardTitle>
              <CardDescription className="font-light">
                Monitor incoming checkout events as they occur.
              </CardDescription>
            </div>
            <Link 
              to="/admin/orders" 
              className="text-xs text-primary hover:underline flex items-center gap-1 font-light"
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground font-light text-center py-12">No orders placed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 font-semibold text-muted-foreground uppercase">
                      <th className="p-3 pl-6">Customer</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3 pr-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-light">
                    {recentOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-muted/5 transition-colors">
                        <td className="p-3 pl-6">
                          <span className="font-medium text-foreground">{o.first_name} {o.last_name}</span>
                          <span className="text-[10px] text-muted-foreground block">{o.email}</span>
                        </td>
                        <td className="p-3 text-muted-foreground">{formatDate(o.created_at)}</td>
                        <td className="p-3">€{o.total.toFixed(2)}</td>
                        <td className="p-3 pr-6 text-right">
                          <Badge 
                            className={`font-light rounded-full text-[10px] px-2 py-0.5 border ${
                              o.status === "delivered" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                : o.status === "pending" 
                                ? "bg-amber-50 text-amber-700 border-amber-200" 
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {o.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts (Col span 1) */}
        <Card className="lg:col-span-1 border border-border">
          <CardHeader>
            <CardTitle className="font-normal text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Inventory Alerts</span>
            </CardTitle>
            <CardDescription className="font-light">
              Restock alerts for merchandise variants with 5 or fewer items remaining.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-muted-foreground font-light text-center py-12 bg-muted/10 border border-dashed rounded-md">
                All inventory lines are sufficiently stocked.
              </p>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex justify-between items-center p-3 border border-border rounded-md bg-amber-50/10 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <span className="font-medium text-foreground block truncate">{item.product_name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{item.sku || "No SKU"}</span>
                    </div>
                    <Badge variant="destructive" className="font-light text-[10px] rounded px-1.5 py-0.5 h-fit shrink-0">
                      {item.stock_qty} left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
