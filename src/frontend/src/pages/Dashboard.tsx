import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  DollarSign,
  Loader2,
  Package,
  Plus,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { formatCurrency } from "../lib/format";

const emptyAddress = { street: "", city: "", state: "", zip: "", country: "" };

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

export default function Dashboard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  // --- Dialogs state ---
  const [customerOpen, setCustomerOpen] = useState(false);
  const [salesOrderOpen, setSalesOrderOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  // Customer form
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");

  // Sales Order form
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  // Product form
  const [prodSku, setProdSku] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodCategory, setProdCategory] = useState("");
  const [prodDescription, setProdDescription] = useState("");
  const [prodQty, setProdQty] = useState("0");
  const [prodCost, setProdCost] = useState("0");
  const [prodReorder, setProdReorder] = useState("5");

  // --- Queries ---
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => actor!.getDashboardStats(),
    enabled: !!actor,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => actor!.getAllCustomers(),
    enabled: !!actor,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => actor!.getAllProducts(),
    enabled: !!actor,
  });

  // --- Mutations ---
  const createCustomerMutation = useMutation({
    mutationFn: () =>
      actor!.createCustomer(custName, custEmail, custPhone, emptyAddress, ""),
    onSuccess: () => {
      toast.success("Customer created successfully");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      setCustomerOpen(false);
      setCustName("");
      setCustEmail("");
      setCustPhone("");
    },
    onError: () => toast.error("Failed to create customer"),
  });

  const createSalesOrderMutation = useMutation({
    mutationFn: () => actor!.createSalesOrder(BigInt(selectedCustomerId), []),
    onSuccess: () => {
      toast.success("Sales order created successfully");
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      setSalesOrderOpen(false);
      setSelectedCustomerId("");
    },
    onError: () => toast.error("Failed to create sales order"),
  });

  const createProductMutation = useMutation({
    mutationFn: () =>
      actor!.createProduct(
        prodSku,
        prodName,
        prodCategory,
        prodDescription,
        BigInt(Number(prodQty)),
        BigInt(Math.round(Number(prodCost) * 100)),
        BigInt(Number(prodReorder)),
      ),
    onSuccess: () => {
      toast.success("Product created successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      setProductOpen(false);
      setProdSku("");
      setProdName("");
      setProdCategory("");
      setProdDescription("");
      setProdQty("0");
      setProdCost("0");
      setProdReorder("5");
    },
    onError: () => toast.error("Failed to create product"),
  });

  // --- Chart data ---
  const revenueData = [
    {
      name: "Revenue",
      value: stats ? Number(stats.totalRevenue) / 100 : 0,
    },
    {
      name: "Receivables",
      value: stats ? Number(stats.outstandingReceivables) / 100 : 0,
    },
  ];

  const lowStockCount = stats?.lowStockProducts.length ?? 0;
  const normalStockCount = Math.max(0, products.length - lowStockCount);
  const inventoryData = [
    { name: "Low Stock", value: lowStockCount, color: "#ef4444" },
    { name: "Normal Stock", value: normalStockCount, color: "#22c55e" },
  ];

  const kpis = [
    {
      title: "Total Revenue",
      value: stats ? formatCurrency(stats.totalRevenue) : "--",
      icon: DollarSign,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-50",
    },
    {
      title: "Outstanding Receivables",
      value: stats ? formatCurrency(stats.outstandingReceivables) : "--",
      icon: TrendingUp,
      colorClass: "text-amber-600",
      bgClass: "bg-amber-50",
    },
    {
      title: "Recent Sales Orders",
      value: stats ? String(Number(stats.recentSalesOrdersCount)) : "--",
      icon: ShoppingCart,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-50",
    },
    {
      title: "Low Stock Items",
      value: stats ? String(stats.lowStockProducts.length) : "--",
      icon: AlertTriangle,
      colorClass: "text-red-600",
      bgClass: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-8 pb-10" data-ocid="dashboard.page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back — here's your business overview
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {/* New Customer Dialog */}
          <Dialog open={customerOpen} onOpenChange={setCustomerOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                data-ocid="dashboard.new_customer.open_modal_button"
              >
                <Users className="h-4 w-4" />
                New Customer
              </Button>
            </DialogTrigger>
            <DialogContent data-ocid="dashboard.new_customer.dialog">
              <DialogHeader>
                <DialogTitle>Create New Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cust-name">Name *</Label>
                  <Input
                    id="cust-name"
                    placeholder="Customer name"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    data-ocid="dashboard.new_customer.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cust-email">Email</Label>
                  <Input
                    id="cust-email"
                    type="email"
                    placeholder="email@example.com"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cust-phone">Phone</Label>
                  <Input
                    id="cust-phone"
                    placeholder="+1 555 000 0000"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCustomerOpen(false)}
                  data-ocid="dashboard.new_customer.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createCustomerMutation.mutate()}
                  disabled={
                    !custName.trim() || createCustomerMutation.isPending
                  }
                  data-ocid="dashboard.new_customer.submit_button"
                >
                  {createCustomerMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Customer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* New Sales Order Dialog */}
          <Dialog open={salesOrderOpen} onOpenChange={setSalesOrderOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                data-ocid="dashboard.new_sales_order.open_modal_button"
              >
                <ShoppingCart className="h-4 w-4" />
                New Sales Order
              </Button>
            </DialogTrigger>
            <DialogContent data-ocid="dashboard.new_sales_order.dialog">
              <DialogHeader>
                <DialogTitle>Create New Sales Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Customer *</Label>
                  {customers.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No customers yet. Create a customer first.
                    </p>
                  ) : (
                    <Select
                      value={selectedCustomerId}
                      onValueChange={setSelectedCustomerId}
                    >
                      <SelectTrigger data-ocid="dashboard.new_sales_order.select">
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={String(c.id)} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  The order will be created in draft status with no line items.
                  You can add products from the Sales Orders page.
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSalesOrderOpen(false)}
                  data-ocid="dashboard.new_sales_order.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createSalesOrderMutation.mutate()}
                  disabled={
                    !selectedCustomerId ||
                    createSalesOrderMutation.isPending ||
                    customers.length === 0
                  }
                  data-ocid="dashboard.new_sales_order.submit_button"
                >
                  {createSalesOrderMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Order
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* New Product Dialog */}
          <Dialog open={productOpen} onOpenChange={setProductOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="gap-1.5"
                data-ocid="dashboard.new_product.open_modal_button"
              >
                <Plus className="h-4 w-4" />
                New Product
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-w-lg"
              data-ocid="dashboard.new_product.dialog"
            >
              <DialogHeader>
                <DialogTitle>Create New Product</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="prod-sku">SKU *</Label>
                  <Input
                    id="prod-sku"
                    placeholder="ORN-001"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    data-ocid="dashboard.new_product.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prod-name">Name *</Label>
                  <Input
                    id="prod-name"
                    placeholder="Product name"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prod-cat">Category</Label>
                  <Input
                    id="prod-cat"
                    placeholder="Necklaces"
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prod-cost">Unit Cost ($)</Label>
                  <Input
                    id="prod-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={prodCost}
                    onChange={(e) => setProdCost(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prod-qty">Qty on Hand</Label>
                  <Input
                    id="prod-qty"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={prodQty}
                    onChange={(e) => setProdQty(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prod-reorder">Reorder Level</Label>
                  <Input
                    id="prod-reorder"
                    type="number"
                    min="0"
                    placeholder="5"
                    value={prodReorder}
                    onChange={(e) => setProdReorder(e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="prod-desc">Description</Label>
                  <Input
                    id="prod-desc"
                    placeholder="Brief description"
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setProductOpen(false)}
                  data-ocid="dashboard.new_product.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createProductMutation.mutate()}
                  disabled={
                    !prodSku.trim() ||
                    !prodName.trim() ||
                    createProductMutation.isPending
                  }
                  data-ocid="dashboard.new_product.submit_button"
                >
                  {createProductMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.title} variants={itemVariants}>
              <Card
                className="hover:shadow-md transition-shadow"
                data-ocid={`dashboard.kpi.item.${i + 1}`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${kpi.bgClass}`}>
                    <Icon className={`h-4 w-4 ${kpi.colorClass}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton
                      className="h-8 w-28"
                      data-ocid="dashboard.loading_state"
                    />
                  ) : (
                    <p className="text-2xl font-bold tracking-tight">
                      {kpi.value}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts Row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Revenue vs Receivables Bar Chart */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Revenue vs Receivables
              </CardTitle>
            </CardHeader>
            <CardContent className="h-52">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueData}
                    margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) =>
                        `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        `$${value.toLocaleString()}`,
                        "",
                      ]}
                      cursor={{ fill: "oklch(0.94 0.01 250)" }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[6, 6, 0, 0]}
                      fill="oklch(0.45 0.18 250)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Inventory Status Pie Chart */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventory Status</CardTitle>
            </CardHeader>
            <CardContent className="h-52 flex items-center justify-center">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Package className="h-10 w-10 opacity-30" />
                  <p className="text-sm">No products yet</p>
                </div>
              ) : (
                <div className="flex items-center gap-8 w-full justify-center">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={inventoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {inventoryData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {inventoryData.map((entry) => (
                      <div
                        key={entry.name}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">
                          {entry.name}
                        </span>
                        <span className="font-semibold ml-auto pl-4">
                          {entry.value}
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground pt-1">
                      {products.length} total products
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Low Stock Alert Table */}
      {stats && stats.lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="p-1.5 bg-red-50 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </span>
                Low Stock Alert
                <Badge variant="destructive" className="ml-1">
                  {stats.lowStockProducts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="pl-6">Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">On Hand</TableHead>
                    <TableHead className="text-right pr-6">
                      Reorder At
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.lowStockProducts.map((p, i) => (
                    <TableRow
                      key={String(p.id)}
                      data-ocid={`dashboard.lowstock.item.${i + 1}`}
                    >
                      <TableCell className="pl-6 font-medium">
                        {p.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {p.sku}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="destructive"
                          className="font-mono tabular-nums"
                        >
                          {Number(p.quantityOnHand)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 text-muted-foreground">
                        {Number(p.reorderLevel)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Activity placeholder */}
      {(!stats || stats.recentSalesOrdersCount === BigInt(0)) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground"
                data-ocid="dashboard.activity.empty_state"
              >
                <ShoppingCart className="h-12 w-12 opacity-20" />
                <p className="text-sm font-medium">No recent activity</p>
                <p className="text-xs opacity-70">
                  Create your first sales order to see activity here
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => setSalesOrderOpen(true)}
                  data-ocid="dashboard.activity.primary_button"
                >
                  <Plus className="h-4 w-4 mr-1" /> Create Sales Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
