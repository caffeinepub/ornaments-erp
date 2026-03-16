import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import { dateToNano, formatCurrency } from "../lib/format";

export default function Reports() {
  const { actor } = useActor();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [runSales, setRunSales] = useState(false);

  const { data: salesSummary, isLoading: salesLoading } = useQuery({
    queryKey: ["salesSummary", startDate, endDate],
    queryFn: () =>
      actor!.getSalesSummary(
        dateToNano(new Date(startDate)),
        dateToNano(new Date(endDate)),
      ),
    enabled: !!actor && runSales && !!startDate && !!endDate,
  });

  const { data: inventoryVal } = useQuery({
    queryKey: ["inventoryValuation"],
    queryFn: () => actor!.getInventoryValuation(),
    enabled: !!actor,
  });

  const { data: ar = [] } = useQuery({
    queryKey: ["accountsReceivable"],
    queryFn: () => actor!.getAccountsReceivable(),
    enabled: !!actor,
  });

  return (
    <div className="space-y-6" data-ocid="reports.page">
      <div>
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-muted-foreground">Business insights and analytics</p>
      </div>

      {/* Sales Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div>
              <Label>Start Date</Label>
              <Input
                data-ocid="reports.start_date.input"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setRunSales(false);
                }}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                data-ocid="reports.end_date.input"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setRunSales(false);
                }}
              />
            </div>
            <Button
              data-ocid="reports.run_sales.button"
              onClick={() => setRunSales(true)}
              disabled={!startDate || !endDate}
            >
              {salesLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Run Report
            </Button>
          </div>
          {salesSummary && (
            <div
              className="grid grid-cols-2 gap-4"
              data-ocid="reports.sales.card"
            >
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(salesSummary.totalSales)}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Orders</p>
                <p className="text-2xl font-bold">
                  {Number(salesSummary.orderCount)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Valuation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inventory Valuation</CardTitle>
        </CardHeader>
        <CardContent>
          {inventoryVal !== undefined ? (
            <p
              className="text-2xl font-bold"
              data-ocid="reports.inventory.card"
            >
              {formatCurrency(inventoryVal)}
            </p>
          ) : (
            <Loader2
              className="h-5 w-5 animate-spin text-muted-foreground"
              data-ocid="reports.inventory.loading_state"
            />
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Total value of stock on hand
          </p>
        </CardContent>
      </Card>

      {/* Accounts Receivable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accounts Receivable</CardTitle>
        </CardHeader>
        <CardContent>
          <Table data-ocid="reports.ar.table">
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ar.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="text-center py-6 text-muted-foreground"
                    data-ocid="reports.ar.empty_state"
                  >
                    No outstanding receivables
                  </TableCell>
                </TableRow>
              ) : (
                ar.map((row, i) => (
                  <TableRow
                    key={String(row.customerId)}
                    data-ocid={`reports.ar.row.${i + 1}`}
                  >
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell className="font-medium text-amber-600">
                      {formatCurrency(row.totalOutstanding)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
