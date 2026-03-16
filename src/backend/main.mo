import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type Address = {
    street : Text;
    city : Text;
    state : Text;
    zip : Text;
    country : Text;
  };

  type CustomerId = Nat;
  type SupplierId = Nat;
  type ProductId = Nat;
  type PurchaseOrderId = Nat;
  type SalesOrderId = Nat;
  type InvoiceId = Nat;
  type PaymentId = Nat;

  type Customer = {
    id : CustomerId;
    name : Text;
    email : Text;
    phone : Text;
    address : Address;
    notes : Text;
  };

  type Supplier = {
    id : SupplierId;
    name : Text;
    email : Text;
    phone : Text;
    address : Address;
    notes : Text;
  };

  type Product = {
    id : ProductId;
    sku : Text;
    name : Text;
    category : Text;
    description : Text;
    quantityOnHand : Nat;
    unitCost : Nat;
    reorderLevel : Nat;
  };

  type PurchaseOrderStatus = {
    #draft;
    #sent;
    #received;
    #cancelled;
  };

  type PurchaseOrderLineItem = {
    productId : ProductId;
    quantity : Nat;
    unitCost : Nat;
  };

  type PurchaseOrder = {
    id : PurchaseOrderId;
    supplierId : SupplierId;
    status : PurchaseOrderStatus;
    lineItems : [PurchaseOrderLineItem];
    createdAt : Time.Time;
    receivedAt : ?Time.Time;
  };

  type SalesOrderStatus = {
    #draft;
    #confirmed;
    #shipped;
    #completed;
    #cancelled;
  };

  type SalesOrderLineItem = {
    productId : ProductId;
    quantity : Nat;
    unitPrice : Nat;
  };

  type SalesOrder = {
    id : SalesOrderId;
    customerId : CustomerId;
    status : SalesOrderStatus;
    lineItems : [SalesOrderLineItem];
    confirmedAt : ?Time.Time;
    createdAt : Time.Time;
    shippedAt : ?Time.Time;
  };

  type InvoiceStatus = {
    #unpaid;
    #partial;
    #paid;
  };

  type Invoice = {
    id : InvoiceId;
    salesOrderId : SalesOrderId;
    customerId : CustomerId;
    totalAmount : Nat;
    amountPaid : Nat;
    status : InvoiceStatus;
    dueDate : Time.Time;
    createdAt : Time.Time;
  };

  type PaymentMethod = {
    #cash;
    #creditCard;
    #bankTransfer;
    #check;
    #other : Text;
  };

  type Payment = {
    id : PaymentId;
    invoiceId : InvoiceId;
    amount : Nat;
    paymentDate : Time.Time;
    method : PaymentMethod;
    notes : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  module Customer {
    public func compare(c1 : Customer, c2 : Customer) : Order.Order {
      Nat.compare(c1.id, c2.id);
    };
  };

  module Supplier {
    public func compare(s1 : Supplier, s2 : Supplier) : Order.Order {
      Nat.compare(s1.id, s2.id);
    };
  };

  module Product {
    public func compare(p1 : Product, p2 : Product) : Order.Order {
      Nat.compare(p1.id, p2.id);
    };
  };

  module PurchaseOrder {
    public func compare(po1 : PurchaseOrder, po2 : PurchaseOrder) : Order.Order {
      Nat.compare(po1.id, po2.id);
    };
  };

  module SalesOrder {
    public func compare(so1 : SalesOrder, so2 : SalesOrder) : Order.Order {
      Nat.compare(so1.id, so2.id);
    };
  };

  module Invoice {
    public func compare(i1 : Invoice, i2 : Invoice) : Order.Order {
      Nat.compare(i1.id, i2.id);
    };
  };

  module Payment {
    public func compare(p1 : Payment, p2 : Payment) : Order.Order {
      Nat.compare(p1.id, p2.id);
    };
  };

  let customers = Map.empty<CustomerId, Customer>();
  let suppliers = Map.empty<SupplierId, Supplier>();
  let products = Map.empty<ProductId, Product>();
  let purchaseOrders = Map.empty<PurchaseOrderId, PurchaseOrder>();
  let salesOrders = Map.empty<SalesOrderId, SalesOrder>();
  let invoices = Map.empty<InvoiceId, Invoice>();
  let payments = Map.empty<PaymentId, Payment>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextCustomerId = 0;
  var nextSupplierId = 0;
  var nextProductId = 0;
  var nextPurchaseOrderId = 0;
  var nextSalesOrderId = 0;
  var nextInvoiceId = 0;
  var nextPaymentId = 0;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Customer CRUD
  public query ({ caller }) func getAllCustomers() : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };
    customers.values().toArray().sort(Customer.compare);
  };

  public query ({ caller }) func getCustomer(customerId : CustomerId) : async ?Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };
    customers.get(customerId);
  };

  public shared ({ caller }) func createCustomer(name : Text, email : Text, phone : Text, address : Address, notes : Text) : async CustomerId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create customers");
    };
    let id = nextCustomerId;
    nextCustomerId += 1;
    let customer : Customer = {
      id;
      name;
      email;
      phone;
      address;
      notes;
    };
    customers.add(id, customer);
    id;
  };

  public shared ({ caller }) func updateCustomer(customerId : CustomerId, name : Text, email : Text, phone : Text, address : Address, notes : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update customers");
    };
    if (not customers.containsKey(customerId)) {
      Runtime.trap("Customer does not exist");
    };
    let customer : Customer = {
      id = customerId;
      name;
      email;
      phone;
      address;
      notes;
    };
    customers.add(customerId, customer);
  };

  public shared ({ caller }) func deleteCustomer(customerId : CustomerId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete customers");
    };
    if (not customers.containsKey(customerId)) {
      Runtime.trap("Customer does not exist");
    };
    customers.remove(customerId);
  };

  // Supplier CRUD
  public query ({ caller }) func getAllSuppliers() : async [Supplier] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view suppliers");
    };
    suppliers.values().toArray().sort(Supplier.compare);
  };

  public query ({ caller }) func getSupplier(supplierId : SupplierId) : async ?Supplier {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view suppliers");
    };
    suppliers.get(supplierId);
  };

  public shared ({ caller }) func createSupplier(name : Text, email : Text, phone : Text, address : Address, notes : Text) : async SupplierId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create suppliers");
    };
    let id = nextSupplierId;
    nextSupplierId += 1;
    let supplier : Supplier = {
      id;
      name;
      email;
      phone;
      address;
      notes;
    };
    suppliers.add(id, supplier);
    id;
  };

  public shared ({ caller }) func updateSupplier(supplierId : SupplierId, name : Text, email : Text, phone : Text, address : Address, notes : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update suppliers");
    };
    if (not suppliers.containsKey(supplierId)) {
      Runtime.trap("Supplier does not exist");
    };
    let supplier : Supplier = {
      id = supplierId;
      name;
      email;
      phone;
      address;
      notes;
    };
    suppliers.add(supplierId, supplier);
  };

  public shared ({ caller }) func deleteSupplier(supplierId : SupplierId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete suppliers");
    };
    if (not suppliers.containsKey(supplierId)) {
      Runtime.trap("Supplier does not exist");
    };
    suppliers.remove(supplierId);
  };

  // Product CRUD
  public query ({ caller }) func getAllProducts() : async [Product] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };
    products.values().toArray().sort();
  };

  public query ({ caller }) func getProduct(productId : ProductId) : async ?Product {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };
    products.get(productId);
  };

  public shared ({ caller }) func createProduct(sku : Text, name : Text, category : Text, description : Text, quantityOnHand : Nat, unitCost : Nat, reorderLevel : Nat) : async ProductId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create products");
    };
    let id = nextProductId;
    nextProductId += 1;
    let product : Product = {
      id;
      sku;
      name;
      category;
      description;
      quantityOnHand;
      unitCost;
      reorderLevel;
    };
    products.add(id, product);
    id;
  };

  public shared ({ caller }) func updateProduct(productId : ProductId, sku : Text, name : Text, category : Text, description : Text, quantityOnHand : Nat, unitCost : Nat, reorderLevel : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update products");
    };
    if (not products.containsKey(productId)) {
      Runtime.trap("Product does not exist");
    };
    let product : Product = {
      id = productId;
      sku;
      name;
      category;
      description;
      quantityOnHand;
      unitCost;
      reorderLevel;
    };
    products.add(productId, product);
  };

  public shared ({ caller }) func adjustStock(productId : ProductId, quantityChange : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can adjust stock");
    };
    let product = switch (products.get(productId)) {
      case (null) { Runtime.trap("Product does not exist") };
      case (?p) { p };
    };
    let newQuantity = if (quantityChange >= 0) {
      product.quantityOnHand + Int.abs(quantityChange);
    } else {
      let decrease = Int.abs(quantityChange);
      if (decrease > product.quantityOnHand) {
        Runtime.trap("Insufficient stock");
      };
      product.quantityOnHand - decrease;
    };
    let updatedProduct : Product = {
      id = product.id;
      sku = product.sku;
      name = product.name;
      category = product.category;
      description = product.description;
      quantityOnHand = newQuantity;
      unitCost = product.unitCost;
      reorderLevel = product.reorderLevel;
    };
    products.add(productId, updatedProduct);
  };

  public shared ({ caller }) func deleteProduct(productId : ProductId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    if (not products.containsKey(productId)) {
      Runtime.trap("Product does not exist");
    };
    products.remove(productId);
  };

  // Purchase Order CRUD
  public query ({ caller }) func getAllPurchaseOrders() : async [PurchaseOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view purchase orders");
    };
    purchaseOrders.values().toArray().sort();
  };

  public query ({ caller }) func getPurchaseOrder(purchaseOrderId : PurchaseOrderId) : async ?PurchaseOrder {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view purchase orders");
    };
    purchaseOrders.get(purchaseOrderId);
  };

  public shared ({ caller }) func createPurchaseOrder(supplierId : SupplierId, lineItems : [PurchaseOrderLineItem]) : async PurchaseOrderId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create purchase orders");
    };
    if (not suppliers.containsKey(supplierId)) {
      Runtime.trap("Supplier does not exist");
    };
    let id = nextPurchaseOrderId;
    nextPurchaseOrderId += 1;
    let purchaseOrder : PurchaseOrder = {
      id;
      supplierId;
      status = #draft;
      lineItems;
      createdAt = Time.now();
      receivedAt = null;
    };
    purchaseOrders.add(id, purchaseOrder);
    id;
  };

  public shared ({ caller }) func updatePurchaseOrderStatus(purchaseOrderId : PurchaseOrderId, status : PurchaseOrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update purchase orders");
    };
    let po = switch (purchaseOrders.get(purchaseOrderId)) {
      case (null) { Runtime.trap("Purchase order does not exist") };
      case (?p) { p };
    };
    let receivedAt = switch (status) {
      case (#received) { ?Time.now() };
      case (_) { po.receivedAt };
    };
    let updatedPO : PurchaseOrder = {
      id = po.id;
      supplierId = po.supplierId;
      status;
      lineItems = po.lineItems;
      createdAt = po.createdAt;
      receivedAt;
    };
    purchaseOrders.add(purchaseOrderId, updatedPO);

    // If receiving, increment inventory
    if (status == #received) {
      for (item in po.lineItems.vals()) {
        let product = switch (products.get(item.productId)) {
          case (null) { /* skip if product doesn't exist */ };
          case (?p) {
            let updatedProduct : Product = {
              id = p.id;
              sku = p.sku;
              name = p.name;
              category = p.category;
              description = p.description;
              quantityOnHand = p.quantityOnHand + item.quantity;
              unitCost = p.unitCost;
              reorderLevel = p.reorderLevel;
            };
            products.add(item.productId, updatedProduct);
          };
        };
      };
    };
  };

  public shared ({ caller }) func deletePurchaseOrder(purchaseOrderId : PurchaseOrderId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete purchase orders");
    };
    if (not purchaseOrders.containsKey(purchaseOrderId)) {
      Runtime.trap("Purchase order does not exist");
    };
    purchaseOrders.remove(purchaseOrderId);
  };

  // Sales Order CRUD
  public query ({ caller }) func getAllSalesOrders() : async [SalesOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sales orders");
    };
    salesOrders.values().toArray().sort();
  };

  public query ({ caller }) func getSalesOrder(salesOrderId : SalesOrderId) : async ?SalesOrder {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sales orders");
    };
    salesOrders.get(salesOrderId);
  };

  public shared ({ caller }) func createSalesOrder(customerId : CustomerId, lineItems : [SalesOrderLineItem]) : async SalesOrderId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create sales orders");
    };
    if (not customers.containsKey(customerId)) {
      Runtime.trap("Customer does not exist");
    };
    let id = nextSalesOrderId;
    nextSalesOrderId += 1;
    let salesOrder : SalesOrder = {
      id;
      customerId;
      status = #draft;
      lineItems;
      createdAt = Time.now();
      confirmedAt = null;
      shippedAt = null;
    };
    salesOrders.add(id, salesOrder);
    id;
  };

  public shared ({ caller }) func updateSalesOrderStatus(salesOrderId : SalesOrderId, status : SalesOrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update sales orders");
    };
    let so = switch (salesOrders.get(salesOrderId)) {
      case (null) { Runtime.trap("Sales order does not exist") };
      case (?s) { s };
    };

    let confirmedAt = switch (status) {
      case (#confirmed) { ?Time.now() };
      case (_) { so.confirmedAt };
    };

    let shippedAt = switch (status) {
      case (#shipped) { ?Time.now() };
      case (_) { so.shippedAt };
    };

    let updatedSO : SalesOrder = {
      id = so.id;
      customerId = so.customerId;
      status;
      lineItems = so.lineItems;
      createdAt = so.createdAt;
      confirmedAt;
      shippedAt;
    };
    salesOrders.add(salesOrderId, updatedSO);

    // If confirming, decrement inventory
    if (status == #confirmed and so.status == #draft) {
      for (item in so.lineItems.vals()) {
        let product = switch (products.get(item.productId)) {
          case (null) { Runtime.trap("Product does not exist") };
          case (?p) {
            if (p.quantityOnHand < item.quantity) {
              Runtime.trap("Insufficient stock for product: " # p.name);
            };
            let updatedProduct : Product = {
              id = p.id;
              sku = p.sku;
              name = p.name;
              category = p.category;
              description = p.description;
              quantityOnHand = p.quantityOnHand - item.quantity;
              unitCost = p.unitCost;
              reorderLevel = p.reorderLevel;
            };
            products.add(item.productId, updatedProduct);
          };
        };
      };
    };
  };

  public shared ({ caller }) func deleteSalesOrder(salesOrderId : SalesOrderId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete sales orders");
    };
    if (not salesOrders.containsKey(salesOrderId)) {
      Runtime.trap("Sales order does not exist");
    };
    salesOrders.remove(salesOrderId);
  };

  // Invoice CRUD
  public query ({ caller }) func getAllInvoices() : async [Invoice] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view invoices");
    };
    invoices.values().toArray().sort();
  };

  public query ({ caller }) func getInvoice(invoiceId : InvoiceId) : async ?Invoice {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view invoices");
    };
    invoices.get(invoiceId);
  };

  public shared ({ caller }) func createInvoice(salesOrderId : SalesOrderId, dueDate : Time.Time) : async InvoiceId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create invoices");
    };
    let salesOrder = switch (salesOrders.get(salesOrderId)) {
      case (null) { Runtime.trap("Sales order does not exist") };
      case (?so) { so };
    };

    var totalAmount = 0;
    for (item in salesOrder.lineItems.vals()) {
      totalAmount += item.quantity * item.unitPrice;
    };

    let id = nextInvoiceId;
    nextInvoiceId += 1;
    let invoice : Invoice = {
      id;
      salesOrderId;
      customerId = salesOrder.customerId;
      totalAmount;
      amountPaid = 0;
      status = #unpaid;
      dueDate;
      createdAt = Time.now();
    };
    invoices.add(id, invoice);
    id;
  };

  public shared ({ caller }) func deleteInvoice(invoiceId : InvoiceId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete invoices");
    };
    if (not invoices.containsKey(invoiceId)) {
      Runtime.trap("Invoice does not exist");
    };
    invoices.remove(invoiceId);
  };

  // Payment CRUD
  public query ({ caller }) func getAllPayments() : async [Payment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payments");
    };
    payments.values().toArray().sort();
  };

  public query ({ caller }) func getPayment(paymentId : PaymentId) : async ?Payment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payments");
    };
    payments.get(paymentId);
  };

  public shared ({ caller }) func addPayment(invoiceId : InvoiceId, amount : Nat, method : PaymentMethod, notes : Text) : async PaymentId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add payments");
    };
    let invoice = switch (invoices.get(invoiceId)) {
      case (null) { Runtime.trap("Invoice does not exist") };
      case (?inv) { inv };
    };

    let paymentId = nextPaymentId;
    nextPaymentId += 1;
    let payment : Payment = {
      id = paymentId;
      invoiceId;
      amount;
      paymentDate = Time.now();
      method;
      notes;
    };

    let newAmountPaid = invoice.amountPaid + amount;
    let newStatus = if (newAmountPaid >= invoice.totalAmount) {
      #paid;
    } else if (newAmountPaid > 0) {
      #partial;
    } else {
      #unpaid;
    };

    let updatedInvoice = {
      id = invoice.id;
      salesOrderId = invoice.salesOrderId;
      customerId = invoice.customerId;
      totalAmount = invoice.totalAmount;
      amountPaid = newAmountPaid;
      status = newStatus;
      dueDate = invoice.dueDate;
      createdAt = invoice.createdAt;
    };

    invoices.add(invoiceId, updatedInvoice);
    payments.add(paymentId, payment);
    paymentId;
  };

  public shared ({ caller }) func deletePayment(paymentId : PaymentId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete payments");
    };
    if (not payments.containsKey(paymentId)) {
      Runtime.trap("Payment does not exist");
    };
    payments.remove(paymentId);
  };

  // Dashboard and Reports
  public type DashboardStats = {
    totalRevenue : Nat;
    outstandingReceivables : Nat;
    lowStockProducts : [Product];
    recentSalesOrdersCount : Nat;
  };

  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard");
    };

    var totalRevenue = 0;
    var outstandingReceivables = 0;

    for (invoice in invoices.values()) {
      switch (invoice.status) {
        case (#paid) { totalRevenue += invoice.amountPaid };
        case (#partial) {
          totalRevenue += invoice.amountPaid;
          outstandingReceivables += (invoice.totalAmount - invoice.amountPaid);
        };
        case (#unpaid) { outstandingReceivables += invoice.totalAmount };
      };
    };

    let lowStockProducts = products.values().toArray().filter(func(p : Product) : Bool {
      p.quantityOnHand < p.reorderLevel;
    });

    let recentSalesOrdersCount = salesOrders.size();

    {
      totalRevenue;
      outstandingReceivables;
      lowStockProducts;
      recentSalesOrdersCount;
    };
  };

  public type SalesSummary = {
    totalSales : Nat;
    orderCount : Nat;
  };

  public query ({ caller }) func getSalesSummary(startDate : Time.Time, endDate : Time.Time) : async SalesSummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };

    var totalSales = 0;
    var orderCount = 0;

    for (so in salesOrders.values()) {
      if (so.createdAt >= startDate and so.createdAt <= endDate) {
        orderCount += 1;
        for (item in so.lineItems.vals()) {
          totalSales += item.quantity * item.unitPrice;
        };
      };
    };

    { totalSales; orderCount };
  };

  public query ({ caller }) func getInventoryValuation() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };

    var totalValue = 0;
    for (product in products.values()) {
      totalValue += product.quantityOnHand * product.unitCost;
    };
    totalValue;
  };

  public type CustomerReceivable = {
    customerId : CustomerId;
    customerName : Text;
    totalOutstanding : Nat;
  };

  public query ({ caller }) func getAccountsReceivable() : async [CustomerReceivable] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };

    let receivablesMap = Map.empty<CustomerId, Nat>();

    for (invoice in invoices.values()) {
      if (invoice.status != #paid) {
        let outstanding = invoice.totalAmount - invoice.amountPaid;
        let current = switch (receivablesMap.get(invoice.customerId)) {
          case (null) { 0 };
          case (?amount) { amount };
        };
        receivablesMap.add(invoice.customerId, current + outstanding);
      };
    };

    let result = Array.tabulate(
      receivablesMap.size(),
      func(i : Nat) : CustomerReceivable {
        let entries = receivablesMap.entries().toArray();
        let (customerId, totalOutstanding) = entries[i];
        let customerName = switch (customers.get(customerId)) {
          case (null) { "Unknown" };
          case (?c) { c.name };
        };
        { customerId; customerName; totalOutstanding };
      },
    );

    result;
  };
};
