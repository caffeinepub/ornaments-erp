import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useRole } from "../hooks/useRole";
import { formatCurrency } from "../lib/format";

interface FormState {
  sku: string;
  name: string;
  category: string;
  description: string;
  quantityOnHand: string;
  unitCost: string;
  reorderLevel: string;
}
const emptyForm = (): FormState => ({
  sku: "",
  name: "",
  category: "",
  description: "",
  quantityOnHand: "0",
  unitCost: "0",
  reorderLevel: "10",
});

export default function Inventory() {
  const { actor } = useActor();
  const { isManager, isAdmin } = useRole();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(
    null,
  );
  const [adjustQty, setAdjustQty] = useState("0");
  const [form, setForm] = useState<FormState>(emptyForm());

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => actor!.getAllProducts(),
    enabled: !!actor,
  });

  const createMut = useMutation({
    mutationFn: (f: FormState) =>
      actor!.createProduct(
        f.sku,
        f.name,
        f.category,
        f.description,
        BigInt(f.quantityOnHand),
        BigInt(Math.round(Number.parseFloat(f.unitCost) * 100)),
        BigInt(f.reorderLevel),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created");
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (f: FormState) =>
      actor!.updateProduct(
        editing!.id,
        f.sku,
        f.name,
        f.category,
        f.description,
        BigInt(f.quantityOnHand),
        BigInt(Math.round(Number.parseFloat(f.unitCost) * 100)),
        BigInt(f.reorderLevel),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated");
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: bigint) => actor!.deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const adjustMut = useMutation({
    mutationFn: ({ id, change }: { id: bigint; change: bigint }) =>
      actor!.adjustStock(id, change),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Stock adjusted");
      setAdjustDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      sku: p.sku,
      name: p.name,
      category: p.category,
      description: p.description,
      quantityOnHand: String(Number(p.quantityOnHand)),
      unitCost: (Number(p.unitCost) / 100).toFixed(2),
      reorderLevel: String(Number(p.reorderLevel)),
    });
    setDialogOpen(true);
  }
  function openAdjust(p: Product) {
    setAdjustingProduct(p);
    setAdjustQty("0");
    setAdjustDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateMut.mutate(form);
    else createMut.mutate(form);
  }

  return (
    <div className="space-y-4" data-ocid="inventory.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory</h2>
          <p className="text-muted-foreground">{products.length} products</p>
        </div>
        {isManager && (
          <Button data-ocid="inventory.primary_button" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          data-ocid="inventory.search_input"
          className="pl-9"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div
          className="flex justify-center py-10"
          data-ocid="inventory.loading_state"
        >
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table data-ocid="inventory.table">
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                    data-ocid="inventory.empty_state"
                  >
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p, i) => (
                  <TableRow
                    key={String(p.id)}
                    data-ocid={`inventory.row.${i + 1}`}
                  >
                    <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>{Number(p.quantityOnHand)}</TableCell>
                    <TableCell>{formatCurrency(p.unitCost)}</TableCell>
                    <TableCell>
                      {Number(p.quantityOnHand) <= Number(p.reorderLevel) ? (
                        <Badge variant="destructive">Low Stock</Badge>
                      ) : (
                        <Badge variant="secondary">In Stock</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {isManager && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-ocid={`inventory.edit_button.${i + 1}`}
                              onClick={() => openEdit(p)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-ocid={`inventory.adjust_button.${i + 1}`}
                              onClick={() => openAdjust(p)}
                            >
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`inventory.delete_button.${i + 1}`}
                            onClick={() => deleteMut.mutate(p.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Product dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="inventory.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU</Label>
                <Input
                  data-ocid="inventory.sku.input"
                  value={form.sku}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sku: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  data-ocid="inventory.category.input"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-2">
                <Label>Name</Label>
                <Input
                  data-ocid="inventory.name.input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea
                  data-ocid="inventory.description.textarea"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={2}
                />
              </div>
              <div>
                <Label>Qty on Hand</Label>
                <Input
                  data-ocid="inventory.qty.input"
                  type="number"
                  value={form.quantityOnHand}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantityOnHand: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Unit Cost ($)</Label>
                <Input
                  data-ocid="inventory.cost.input"
                  type="number"
                  step="0.01"
                  value={form.unitCost}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unitCost: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Reorder Level</Label>
                <Input
                  data-ocid="inventory.reorder.input"
                  type="number"
                  value={form.reorderLevel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reorderLevel: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                data-ocid="inventory.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="inventory.submit_button"
                disabled={createMut.isPending || updateMut.isPending}
              >
                {(createMut.isPending || updateMut.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editing ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock adjustment dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent data-ocid="inventory.adjust.dialog">
          <DialogHeader>
            <DialogTitle>Adjust Stock: {adjustingProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Current:{" "}
              {adjustingProduct ? Number(adjustingProduct.quantityOnHand) : 0}{" "}
              units. Enter positive number to add, negative to subtract.
            </p>
            <div>
              <Label>Quantity Change</Label>
              <Input
                data-ocid="inventory.adjust.input"
                type="number"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="inventory.adjust.cancel_button"
              onClick={() => setAdjustDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="inventory.adjust.confirm_button"
              disabled={adjustMut.isPending}
              onClick={() =>
                adjustingProduct &&
                adjustMut.mutate({
                  id: adjustingProduct.id,
                  change: BigInt(adjustQty),
                })
              }
            >
              {adjustMut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
