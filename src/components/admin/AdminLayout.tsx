import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Sliders, 
  ShoppingCart, 
  LogOut, 
  Menu, 
  X, 
  ArrowLeft 
} from "lucide-react";
import { toast } from "sonner";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AdminLayout: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sidebarItems: SidebarItem[] = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: FolderTree },
    { name: "Attributes", href: "/admin/attributes", icon: Sliders },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (err) {
      console.error(err);
      toast.error("Failed to sign out");
    }
  };

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-light">
      {/* Top Header */}
      <header className="bg-background border-b border-border h-16 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            className="lg:hidden p-2 text-foreground hover:bg-muted rounded-md transition-colors"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm tracking-widest uppercase">Ahia Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-xs text-muted-foreground">
            Role: <strong className="text-foreground capitalize">{profile?.role || "Admin"}</strong>
          </span>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="text-xs font-light gap-2 h-9">
            <LogOut size={14} />
            <span>Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex relative">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-background border-r border-border p-4 sticky top-16 h-[calc(100vh-4rem)] flex-shrink-0">
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-all duration-200 ${
                    active 
                      ? "bg-primary text-primary-foreground font-normal shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="absolute bottom-4 left-4 right-4 pt-4 border-t border-border">
            <Link
              to="/"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <ArrowLeft size={12} />
              <span>Return to Storefront</span>
            </Link>
          </div>
        </aside>

        {/* Mobile Sidebar Slide-out */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Sidebar content */}
            <div className="relative w-64 bg-background border-r border-border p-4 flex flex-col h-full animate-slide-in-left">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm tracking-widest uppercase">Ahia Admin</span>
                </div>
                <button
                  className="p-1 hover:bg-muted rounded-full"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="space-y-1 flex-1">
                {sidebarItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-all duration-200 ${
                        active 
                          ? "bg-primary text-primary-foreground font-normal shadow-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-border">
                <Link
                  to="/"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <ArrowLeft size={12} />
                  <span>Return to Storefront</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Outer Content Panel */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
