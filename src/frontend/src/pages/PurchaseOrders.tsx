import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { PurchaseOrderLineItem } from "../backend.d";
import { PurchaseOrderStatus } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useRole } from "../hooks/useRole";
import { formatDate } from "../lib/format";

function StatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const colorMap: Record<string, string> = {
    [PurchaseOrderStatus.draft]: "bg-gray-100 text-gray-700",
    [PurchaseOrderStatus.sent]: "bg-blue-100 text-blue-700",
    [PurchaseOrderStatus.received]: "bg-green-100 text-green-700",
    [PurchaseOrderStatus.cancelled]: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorMap[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

export default function PurchaseOrders() {
  const { actor } = useActor();
  const { isManager } = useRole();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [lineItems, setLineItems] = useState<
    Array<{ productId: string; quantity: string; unitCost: string }>
  >([{ productId: "", quantity: "1", unitCost: "0" }]);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: () => actor!.getAllPurchaseOrders(),
    enabled: !!actor,
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => actor!.getAllSuppliers(),
    enabled: !!actor,
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => actor!.getAllProducts(),
    enabled: !!actor,
  });

  const createMut = useMutation({
    mutationFn: () => {
      const items: PurchaseOrderLineItem[] = lineItems.map((li) => ({
        productId: BigInt(li.productId),
        quantity: BigInt(li.quantity),
        unitCost: BigInt(Math.round(Number.parseFloat(li.unitCost) * 100)),
      }));
      return actor!.createPurchaseOrder(BigInt(supplierId), items);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchaseOrders"] });
      toast.success("Purchase order created");
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: bigint; status: PurchaseOrderStatus }) =>
      actor!.updatePurchaseOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchaseOrders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function addLine() {
    setLineItems((l) => [
      ...l,
      { productId: "", quantity: "1", unitCost: "0" },
    ]);
  }
  function removeLine(i: number) {
    setLineItems((l) => l.filter((_, idx) => idx !== i));
  }

  const statuses = Object.values(PurchaseOrderStatus);

  return (
    <div className="space-y-4" data-ocid="purchase-orders.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Purchase Orders</h2>
          <p className="text-muted-foreground">{orders.length} total</p>
        </div>
        {isManager && (
          <Button
            data-ocid="purchase-orders.primary_button"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New PO
          </Button>
        )}
      </div>

      {isLoading ? (
        <div
          className="flex justify-center py-10"
          data-ocid="purchase-orders.loading_state"
        >
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table data-ocid="purchase-orders.table">
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                {isManager && <TableHead>Update Status</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground"
                    data-ocid="purchase-orders.empty_state"
                  >
                    No purchase orders
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o, i) => {
                  const supplier = suppliers.find((s) => s.id === o.supplierId);
                  return (
                    <TableRow
                      key={String(o.id)}
                      data-ocid={`purchase-orders.row.${i + 1}`}
                    >
                      <TableCell className="font-mono text-sm">
                        PO-{String(o.id).padStart(4, "0")}
                      </TableCell>
                      <TableCell>{supplier?.name ?? "--"}</TableCell>
                      <TableCell>{o.lineItems.length}</TableCell>
                      <TableCell>{formatDate(o.createdAt)}</TableCell>
                      <TableCell>
                        <StatusBadge status={o.status} />
                      </TableCell>
                      {isManager && (
                        <TableCell>
                          <Select
                            value={o.status}
                            onValueChange={(v) =>
                              statusMut.mutate({
                                id: o.id,
                                status: v as PurchaseOrderStatus,
                              })
                            }
                          >
                            <SelectTrigger
                              data-ocid={`purchase-orders.status.select.${i + 1}`}
                              className="h-8 w-32"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" data-ocid="purchase-orders.dialog">
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger data-ocid="purchase-orders.supplier.select">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={String(s.id)} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Line Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid="purchase-orders.add_line.button"
                  onClick={addLine}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Line
                </Button>
              </div>
              {lineItems.map((li, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: order matters here
                <div key={i} className="flex gap-2 mb-2 items-end">
                  <div className="flex-1">
                    <Select
                      value={li.productId}
                      onValueChange={(v) =>
                        setLineItems((l) =>
                          l.map((x, idx) =>
                            idx === i ? { ...x, productId: v } : x,
                          ),
                        )
                      }
                    >
                      <SelectTrigger
                        data-ocid={`purchase-orders.product.select.${i + 1}`}
                      >
                        <SelectValue placeholder="Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={String(p.id)} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    <Input
                      data-ocid={`purchase-orders.qty.input.${i + 1}`}
                      type="number"
                      placeholder="Qty"
                      value={li.quantity}
                      onChange={(e) =>
                        setLineItems((l) =>
                          l.map((x, idx) =>
                            idx === i ? { ...x, quantity: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      data-ocid={`purchase-orders.cost.input.${i + 1}`}
                      type="number"
                      step="0.01"
                      placeholder="Cost"
                      value={li.unitCost}
                      onChange={(e) =>
                        setLineItems((l) =>
                          l.map((x, idx) =>
                            idx === i ? { ...x, unitCost: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-ocid={`purchase-orders.remove_line.button.${i + 1}`}
                    onClick={() => removeLine(i)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="purchase-orders.cancel_button"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="purchase-orders.submit_button"
              disabled={createMut.isPending || !supplierId}
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create PO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
