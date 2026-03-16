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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Invoice, PaymentMethod } from "../backend.d";
import { InvoiceStatus } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useRole } from "../hooks/useRole";
import { dateToNano, formatCurrency, formatDate } from "../lib/format";

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const colorMap: Record<string, string> = {
    [InvoiceStatus.unpaid]: "bg-red-100 text-red-700",
    [InvoiceStatus.partial]: "bg-amber-100 text-amber-700",
    [InvoiceStatus.paid]: "bg-green-100 text-green-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorMap[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

export default function Invoices() {
  const { actor } = useActor();
  const { isManager, isAdmin } = useRole();
  const qc = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [soId, setSoId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payNotes, setPayNotes] = useState("");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => actor!.getAllInvoices(),
    enabled: !!actor,
  });
  const { data: salesOrders = [] } = useQuery({
    queryKey: ["salesOrders"],
    queryFn: () => actor!.getAllSalesOrders(),
    enabled: !!actor,
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => actor!.getAllCustomers(),
    enabled: !!actor,
  });

  const createMut = useMutation({
    mutationFn: () =>
      actor!.createInvoice(BigInt(soId), dateToNano(new Date(dueDate))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created");
      setCreateDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const payMut = useMutation({
    mutationFn: () => {
      const method: PaymentMethod =
        payMethod === "cash"
          ? { __kind__: "cash", cash: null }
          : payMethod === "bankTransfer"
            ? { __kind__: "bankTransfer", bankTransfer: null }
            : payMethod === "creditCard"
              ? { __kind__: "creditCard", creditCard: null }
              : payMethod === "check"
                ? { __kind__: "check", check: null }
                : { __kind__: "other", other: payNotes };
      return actor!.addPayment(
        selectedInvoice!.id,
        BigInt(Math.round(Number.parseFloat(payAmount) * 100)),
        method,
        payNotes,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Payment recorded");
      setPayDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: bigint) => actor!.deleteInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openPay(inv: Invoice) {
    setSelectedInvoice(inv);
    setPayAmount("");
    setPayMethod("cash");
    setPayNotes("");
    setPayDialogOpen(true);
  }

  return (
    <div className="space-y-4" data-ocid="invoices.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Invoices</h2>
          <p className="text-muted-foreground">{invoices.length} total</p>
        </div>
        {isManager && (
          <Button
            data-ocid="invoices.primary_button"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        )}
      </div>

      {isLoading ? (
        <div
          className="flex justify-center py-10"
          data-ocid="invoices.loading_state"
        >
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table data-ocid="invoices.table">
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                    data-ocid="invoices.empty_state"
                  >
                    No invoices
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv, i) => {
                  const customer = customers.find(
                    (c) => c.id === inv.customerId,
                  );
                  return (
                    <TableRow
                      key={String(inv.id)}
                      data-ocid={`invoices.row.${i + 1}`}
                    >
                      <TableCell className="font-mono text-sm">
                        INV-{String(inv.id).padStart(4, "0")}
                      </TableCell>
                      <TableCell>{customer?.name ?? "--"}</TableCell>
                      <TableCell>{formatCurrency(inv.totalAmount)}</TableCell>
                      <TableCell>{formatCurrency(inv.amountPaid)}</TableCell>
                      <TableCell>{formatDate(inv.dueDate)}</TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {isManager && inv.status !== InvoiceStatus.paid && (
                            <Button
                              variant="ghost"
                              size="icon"
                              data-ocid={`invoices.pay_button.${i + 1}`}
                              onClick={() => openPay(inv)}
                            >
                              <DollarSign className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              data-ocid={`invoices.delete_button.${i + 1}`}
                              onClick={() => deleteMut.mutate(inv.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create invoice dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-ocid="invoices.create.dialog">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Sales Order</Label>
              <Select value={soId} onValueChange={setSoId}>
                <SelectTrigger data-ocid="invoices.so.select">
                  <SelectValue placeholder="Select sales order" />
                </SelectTrigger>
                <SelectContent>
                  {salesOrders.map((so) => (
                    <SelectItem key={String(so.id)} value={String(so.id)}>
                      SO-{String(so.id).padStart(4, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                data-ocid="invoices.duedate.input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="invoices.create.cancel_button"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="invoices.create.submit_button"
              disabled={createMut.isPending || !soId || !dueDate}
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log payment dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent data-ocid="invoices.pay.dialog">
          <DialogHeader>
            <DialogTitle>Log Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Outstanding:{" "}
              {selectedInvoice
                ? formatCurrency(
                    selectedInvoice.totalAmount - selectedInvoice.amountPaid,
                  )
                : "--"}
            </p>
            <div>
              <Label>Amount ($)</Label>
              <Input
                data-ocid="invoices.pay.amount.input"
                type="number"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger data-ocid="invoices.pay.method.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bankTransfer">Bank Transfer</SelectItem>
                  <SelectItem value="creditCard">Credit Card</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                data-ocid="invoices.pay.notes.textarea"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="invoices.pay.cancel_button"
              onClick={() => setPayDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="invoices.pay.submit_button"
              disabled={payMut.isPending || !payAmount}
              onClick={() => payMut.mutate()}
            >
              {payMut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
