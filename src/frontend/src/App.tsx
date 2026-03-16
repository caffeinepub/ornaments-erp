import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import Layout from "./components/Layout";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Invoices from "./pages/Invoices";
import PurchaseOrders from "./pages/PurchaseOrders";
import Reports from "./pages/Reports";
import SalesOrders from "./pages/SalesOrders";
import Suppliers from "./pages/Suppliers";
import Users from "./pages/Users";

export type Page =
  | "dashboard"
  | "customers"
  | "suppliers"
  | "inventory"
  | "purchase-orders"
  | "sales-orders"
  | "invoices"
  | "reports"
  | "users";

export default function App() {
  const { identity, login } = useInternetIdentity();
  const { isFetching } = useActor();
  const [page, setPage] = useState<Page>("dashboard");

  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-sm mx-auto p-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Ornaments ERP
            </h1>
            <p className="text-muted-foreground">
              Sign in to access your business management system
            </p>
          </div>
          <Button
            data-ocid="login.primary_button"
            onClick={login}
            size="lg"
            className="w-full"
          >
            Sign in with Internet Identity
          </Button>
        </div>
        <Toaster />
      </div>
    );
  }

  if (isFetching) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-ocid="app.loading_state"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard />;
      case "customers":
        return <Customers />;
      case "suppliers":
        return <Suppliers />;
      case "inventory":
        return <Inventory />;
      case "purchase-orders":
        return <PurchaseOrders />;
      case "sales-orders":
        return <SalesOrders />;
      case "invoices":
        return <Invoices />;
      case "reports":
        return <Reports />;
      case "users":
        return <Users />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {renderPage()}
      <Toaster />
    </Layout>
  );
}
