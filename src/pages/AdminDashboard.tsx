import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, LayoutDashboard, ShoppingCart, FolderTree, Package, Users, ArrowLeft } from "lucide-react";

const AdminDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col font-light">
      {/* Admin Top Header */}
      <header className="bg-background border-b border-border h-16 flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-medium text-sm tracking-wide uppercase">Ahia Admin Portal</span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Dev Mode</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Signed in as: <strong className="text-foreground">{profile?.first_name || user?.email}</strong>
          </span>
          <Button variant="outline" size="sm" onClick={() => signOut()} className="text-xs font-light">
            Sign Out
          </Button>
        </div>
      </header>

      {/* Admin Main Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 max-w-7xl w-full mx-auto p-6 gap-6">
        {/* Sidebar Nav */}
        <aside className="md:col-span-1 space-y-2">
          <Link
            to="/admin"
            className="flex items-center gap-3 px-4 py-3 bg-white border border-border rounded-md text-sm text-foreground hover:bg-muted/50 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            <span>Overview</span>
          </Link>
          <div className="opacity-60 cursor-not-allowed flex items-center gap-3 px-4 py-3 bg-transparent text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>Products (Phase 3)</span>
          </div>
          <div className="opacity-60 cursor-not-allowed flex items-center gap-3 px-4 py-3 bg-transparent text-sm text-muted-foreground">
            <FolderTree className="h-4 w-4" />
            <span>Categories (Phase 3)</span>
          </div>
          <div className="opacity-60 cursor-not-allowed flex items-center gap-3 px-4 py-3 bg-transparent text-sm text-muted-foreground">
            <ShoppingCart className="h-4 w-4" />
            <span>Orders (Phase 3)</span>
          </div>
          <div className="opacity-60 cursor-not-allowed flex items-center gap-3 px-4 py-3 bg-transparent text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Customers (Phase 3)</span>
          </div>

          <div className="pt-6 border-t border-border mt-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={12} />
              <span>Return to Storefront</span>
            </Link>
          </div>
        </aside>

        {/* Content Area */}
        <main className="md:col-span-3 space-y-6">
          <div className="bg-white border border-border p-8 rounded-lg shadow-sm">
            <h1 className="text-3xl font-light tracking-tight mb-2">Welcome to your Admin Dashboard</h1>
            <p className="text-muted-foreground font-light text-sm max-w-2xl">
              You have successfully authenticated as an <strong className="text-foreground font-medium">Administrator</strong>. 
              The Route Guards (`AdminRoute`) are operational, preventing unauthorized users from accessing this panel.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="border border-border p-4 rounded-md bg-muted/10">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Active Role</span>
                <p className="text-lg font-medium text-foreground mt-1 capitalize">{profile?.role || "Admin"}</p>
              </div>
              <div className="border border-border p-4 rounded-md bg-muted/10">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Database Sync</span>
                <p className="text-lg font-medium text-green-600 mt-1">Connected</p>
              </div>
              <div className="border border-border p-4 rounded-md bg-muted/10">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Next Milestone</span>
                <p className="text-lg font-medium text-primary mt-1">Phase 3: Core CRUD</p>
              </div>
            </div>
          </div>

          {/* Info Card on Phase 3 Tasks */}
          <div className="bg-white border border-border p-6 rounded-lg shadow-sm space-y-4">
            <h3 className="text-lg font-normal">Upcoming Tasks (Phase 3 Overview)</h3>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside font-light">
              <li>Category CRUD (Create, Read, Update, Delete)</li>
              <li>Attribute CRUD (Manage sizing, colors, material types)</li>
              <li>Product & Variant details management</li>
              <li>Image uploading via Supabase storage</li>
              <li>Inventory alerts and low-stock limits</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
