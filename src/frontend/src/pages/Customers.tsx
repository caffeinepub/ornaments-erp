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
import type { Address, Customer } from "../backend.d";
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

export default function Customers() {
  const { actor } = useActor();
  const { isManager, isAdmin } = useRole();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => actor!.getAllCustomers(),
    enabled: !!actor,
  });

  const createMut = useMutation({
    mutationFn: (f: FormState) =>
      actor!.createCustomer(f.name, f.email, f.phone, f.address, f.notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created");
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (f: FormState) =>
      actor!.updateCustomer(
        editing!.id,
        f.name,
        f.email,
        f.phone,
        f.address,
        f.notes,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated");
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: bigint) => actor!.deleteCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }
  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone,
      notes: c.notes,
      address: c.address,
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
    <div className="space-y-4" data-ocid="customers.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customers</h2>
          <p className="text-muted-foreground">{customers.length} total</p>
        </div>
        {isManager && (
          <Button data-ocid="customers.primary_button" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          data-ocid="customers.search_input"
          className="pl-9"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div
          className="flex justify-center py-10"
          data-ocid="customers.loading_state"
        >
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table data-ocid="customers.table">
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
                    data-ocid="customers.empty_state"
                  >
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c, i) => (
                  <TableRow
                    key={String(c.id)}
                    data-ocid={`customers.row.${i + 1}`}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>{c.address.city}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {isManager && (
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`customers.edit_button.${i + 1}`}
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`customers.delete_button.${i + 1}`}
                            onClick={() => deleteMut.mutate(c.id)}
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
        <DialogContent data-ocid="customers.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Customer" : "Add Customer"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Name</Label>
                <Input
                  data-ocid="customers.name.input"
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
                  data-ocid="customers.email.input"
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
                  data-ocid="customers.phone.input"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Street</Label>
                <Input
                  data-ocid="customers.street.input"
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
                  data-ocid="customers.city.input"
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
                  data-ocid="customers.state.input"
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
                  data-ocid="customers.zip.input"
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
                  data-ocid="customers.country.input"
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
                  data-ocid="customers.notes.textarea"
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
                data-ocid="customers.cancel_button"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="customers.submit_button"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : "Add Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
