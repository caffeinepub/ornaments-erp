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
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Address, Supplier } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useRole } from "../hooks/useRole";

const emptyAddress = (): Address => ({
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "",
});
interface FormState {
  name: string;
  email: string;
  phone: string;
  notes: string;
  address: Address;
}
const emptyForm = (): FormState => ({
  name: "",
  email: "",
  phone: "",
  notes: "",
  address: emptyAddress(),
});

export default function Suppliers() {
  const { actor } = useActor();
  const { isManager, isAdmin } = useRole();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => actor!.getAllSuppliers(),
    enabled: !!actor,
  });

  const createMut = useMutation({
    mutationFn: (f: FormState) =>
      actor!.createSupplier(f.name, f.email, f.phone, f.address, f.notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier created");
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (f: FormState) =>
      actor!.updateSupplier(
        editing!.id,
        f.name,
        f.email,
        f.phone,
        f.address,
        f.notes,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier updated");
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: bigint) => actor!.deleteSupplier(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }
  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name,
      email: s.email,
      phone: s.phone,
      notes: s.notes,
      address: s.address,
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateMut.mutate(form);
    else createMut.mutate(form);
  }

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-4" data-ocid="suppliers.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Suppliers</h2>
          <p className="text-muted-foreground">{suppliers.length} total</p>
        </div>
        {isManager && (
          <Button data-ocid="suppliers.primary_button" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          data-ocid="suppliers.search_input"
          className="pl-9"
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div
          className="flex justify-center py-10"
          data-ocid="suppliers.loading_state"
        >
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table data-ocid="suppliers.table">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-10 text-muted-foreground"
                    data-ocid="suppliers.empty_state"
                  >
                    No suppliers found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s, i) => (
                  <TableRow
                    key={String(s.id)}
                    data-ocid={`suppliers.row.${i + 1}`}
                  >
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.phone}</TableCell>
                    <TableCell>{s.address.city}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {isManager && (
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`suppliers.edit_button.${i + 1}`}
                            onClick={() => openEdit(s)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`suppliers.delete_button.${i + 1}`}
                            onClick={() => deleteMut.mutate(s.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="suppliers.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Supplier" : "Add Supplier"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Name</Label>
                <Input
                  data-ocid="suppliers.name.input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  data-ocid="suppliers.email.input"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  data-ocid="suppliers.phone.input"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Street</Label>
                <Input
                  data-ocid="suppliers.street.input"
                  value={form.address.street}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      address: { ...f.address, street: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  data-ocid="suppliers.city.input"
                  value={form.address.city}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      address: { ...f.address, city: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  data-ocid="suppliers.state.input"
                  value={form.address.state}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      address: { ...f.address, state: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <Label>ZIP</Label>
                <Input
                  data-ocid="suppliers.zip.input"
                  value={form.address.zip}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      address: { ...f.address, zip: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  data-ocid="suppliers.country.input"
                  value={form.address.country}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      address: { ...f.address, country: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea
                  data-ocid="suppliers.notes.textarea"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                data-ocid="suppliers.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="suppliers.submit_button"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : "Add Supplier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
