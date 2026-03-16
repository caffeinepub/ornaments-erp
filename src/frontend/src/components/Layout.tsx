import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Building2,
  DollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Page } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRole } from "../hooks/useRole";

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "customers", label: "Customers", icon: Building2 },
  { id: "suppliers", label: "Suppliers", icon: Truck },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
  { id: "sales-orders", label: "Sales Orders", icon: FileText },
  { id: "invoices", label: "Invoices", icon: DollarSign },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users, adminOnly: true },
];

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

export default function Layout({ currentPage, onNavigate, children }: Props) {
  const { clear } = useInternetIdentity();
  const { role } = useRole();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = role === "admin";
  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  const Sidebar = ({ mobile = false }) => (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar text-sidebar-foreground",
        mobile ? "w-64" : "w-60",
      )}
    >
      <div className="p-5 border-b border-sidebar-border">
        <h1 className="text-lg font-bold text-white">Ornaments ERP</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-0.5">
          Business Management
        </p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              type="button"
              key={item.id}
              data-ocid={`nav.${item.id}.link`}
              onClick={() => {
                onNavigate(item.id);
                if (mobile) setMobileOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <button
          type="button"
          data-ocid="nav.logout.button"
          onClick={clear}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: overlay backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <h1 className="text-lg font-bold">Ornaments ERP</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
