import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type CustomerId = bigint;
export interface Address {
    zip: string;
    street: string;
    country: string;
    city: string;
    state: string;
}
export type Time = bigint;
export type PaymentMethod = {
    __kind__: "creditCard";
    creditCard: null;
} | {
    __kind__: "other";
    other: string;
} | {
    __kind__: "cash";
    cash: null;
} | {
    __kind__: "check";
    check: null;
} | {
    __kind__: "bankTransfer";
    bankTransfer: null;
};
export type PurchaseOrderId = bigint;
export interface SalesOrderLineItem {
    productId: ProductId;
    quantity: bigint;
    unitPrice: bigint;
}
export interface SalesSummary {
    totalSales: bigint;
    orderCount: bigint;
}
export interface SalesOrder {
    id: SalesOrderId;
    status: SalesOrderStatus;
    lineItems: Array<SalesOrderLineItem>;
    createdAt: Time;
    confirmedAt?: Time;
    shippedAt?: Time;
    customerId: CustomerId;
}
export interface Payment {
    id: PaymentId;
    method: PaymentMethod;
    invoiceId: InvoiceId;
    notes: string;
    paymentDate: Time;
    amount: bigint;
}
export interface Invoice {
    id: InvoiceId;
    status: InvoiceStatus;
    createdAt: Time;
    dueDate: Time;
    amountPaid: bigint;
    totalAmount: bigint;
    salesOrderId: SalesOrderId;
    customerId: CustomerId;
}
export type SalesOrderId = bigint;
export interface DashboardStats {
    lowStockProducts: Array<Product>;
    outstandingReceivables: bigint;
    totalRevenue: bigint;
    recentSalesOrdersCount: bigint;
}
export interface Customer {
    id: CustomerId;
    name: string;
    email: string;
    address: Address;
    notes: string;
    phone: string;
}
export type PaymentId = bigint;
export type InvoiceId = bigint;
export type SupplierId = bigint;
export interface PurchaseOrderLineItem {
    productId: ProductId;
    quantity: bigint;
    unitCost: bigint;
}
export type ProductId = bigint;
export interface PurchaseOrder {
    id: PurchaseOrderId;
    status: PurchaseOrderStatus;
    lineItems: Array<PurchaseOrderLineItem>;
    createdAt: Time;
    receivedAt?: Time;
    supplierId: SupplierId;
}
export interface Supplier {
    id: SupplierId;
    name: string;
    email: string;
    address: Address;
    notes: string;
    phone: string;
}
export interface CustomerReceivable {
    customerName: string;
    totalOutstanding: bigint;
    customerId: CustomerId;
}
export interface UserProfile {
    name: string;
}
export interface Product {
    id: ProductId;
    sku: string;
    name: string;
    description: string;
    quantityOnHand: bigint;
    category: string;
    reorderLevel: bigint;
    unitCost: bigint;
}
export enum InvoiceStatus {
    paid = "paid",
    unpaid = "unpaid",
    partial = "partial"
}
export enum PurchaseOrderStatus {
    cancelled = "cancelled",
    sent = "sent",
    draft = "draft",
    received = "received"
}
export enum SalesOrderStatus {
    shipped = "shipped",
    cancelled = "cancelled",
    completed = "completed",
    confirmed = "confirmed",
    draft = "draft"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPayment(invoiceId: InvoiceId, amount: bigint, method: PaymentMethod, notes: string): Promise<PaymentId>;
    adjustStock(productId: ProductId, quantityChange: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCustomer(name: string, email: string, phone: string, address: Address, notes: string): Promise<CustomerId>;
    createInvoice(salesOrderId: SalesOrderId, dueDate: Time): Promise<InvoiceId>;
    createProduct(sku: string, name: string, category: string, description: string, quantityOnHand: bigint, unitCost: bigint, reorderLevel: bigint): Promise<ProductId>;
    createPurchaseOrder(supplierId: SupplierId, lineItems: Array<PurchaseOrderLineItem>): Promise<PurchaseOrderId>;
    createSalesOrder(customerId: CustomerId, lineItems: Array<SalesOrderLineItem>): Promise<SalesOrderId>;
    createSupplier(name: string, email: string, phone: string, address: Address, notes: string): Promise<SupplierId>;
    deleteCustomer(customerId: CustomerId): Promise<void>;
    deleteInvoice(invoiceId: InvoiceId): Promise<void>;
    deletePayment(paymentId: PaymentId): Promise<void>;
    deleteProduct(productId: ProductId): Promise<void>;
    deletePurchaseOrder(purchaseOrderId: PurchaseOrderId): Promise<void>;
    deleteSalesOrder(salesOrderId: SalesOrderId): Promise<void>;
    deleteSupplier(supplierId: SupplierId): Promise<void>;
    getAccountsReceivable(): Promise<Array<CustomerReceivable>>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllInvoices(): Promise<Array<Invoice>>;
    getAllPayments(): Promise<Array<Payment>>;
    getAllProducts(): Promise<Array<Product>>;
    getAllPurchaseOrders(): Promise<Array<PurchaseOrder>>;
    getAllSalesOrders(): Promise<Array<SalesOrder>>;
    getAllSuppliers(): Promise<Array<Supplier>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomer(customerId: CustomerId): Promise<Customer | null>;
    getDashboardStats(): Promise<DashboardStats>;
    getInventoryValuation(): Promise<bigint>;
    getInvoice(invoiceId: InvoiceId): Promise<Invoice | null>;
    getPayment(paymentId: PaymentId): Promise<Payment | null>;
    getProduct(productId: ProductId): Promise<Product | null>;
    getPurchaseOrder(purchaseOrderId: PurchaseOrderId): Promise<PurchaseOrder | null>;
    getSalesOrder(salesOrderId: SalesOrderId): Promise<SalesOrder | null>;
    getSalesSummary(startDate: Time, endDate: Time): Promise<SalesSummary>;
    getSupplier(supplierId: SupplierId): Promise<Supplier | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCustomer(customerId: CustomerId, name: string, email: string, phone: string, address: Address, notes: string): Promise<void>;
    updateProduct(productId: ProductId, sku: string, name: string, category: string, description: string, quantityOnHand: bigint, unitCost: bigint, reorderLevel: bigint): Promise<void>;
    updatePurchaseOrderStatus(purchaseOrderId: PurchaseOrderId, status: PurchaseOrderStatus): Promise<void>;
    updateSalesOrderStatus(salesOrderId: SalesOrderId, status: SalesOrderStatus): Promise<void>;
    updateSupplier(supplierId: SupplierId, name: string, email: string, phone: string, address: Address, notes: string): Promise<void>;
}
