'use client';

import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  Hash,
  FileText,
  User,
  Phone,
  Building2,
  Package,
  CreditCard,
  DollarSign,
  Layers,
  Eye,
  X,
  ShoppingBag,
  Tag,
  Loader
} from "lucide-react";

import toast, { Toaster } from "react-hot-toast";

export default function ViewLedgerPage() {
  const router = useRouter();
  const params = useParams();
  const ledgerId = params.id;
  
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // ================= FETCH TRANSACTION =================
  const fetchTransaction = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/ledgers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data = await response.json();
      console.log("LEDGER RESPONSE:", data);

      let foundTransaction = null;

      for (const item of data) {
        if (item.id === ledgerId) {
          // Process ledgers to extract items from the nested structure
          const processedLedgers = (item.ledgers || []).map(ledger => {
            let purchaseItems = [];
            let orderItems = [];
            
            // Extract items from purchase structure
            if (ledger.purchase && ledger.purchase.items && Array.isArray(ledger.purchase.items)) {
              purchaseItems = ledger.purchase.items.map(item => ({
                id: item.id,
                name: item.inventory?.name || 'Unknown Item',
                quantity: Number(item.quantity) || 0,
                price: Number(item.price) || 0,
                total: (Number(item.quantity) || 0) * (Number(item.price) || 0),
                unit: item.inventory?.unit || 'pcs',
                inventoryId: item.inventory?.id
              }));
            }
            
            // Extract items from order structure
            if (ledger.order && ledger.order.items && Array.isArray(ledger.order.items)) {
              orderItems = ledger.order.items.map(item => ({
                id: item.id,
                name: item.name || 'Unknown Item',
                quantity: Number(item.quantity) || 0,
                price: Number(item.price) || 0,
                total: (Number(item.quantity) || 0) * (Number(item.price) || 0),
                unit: item.unit || 'pcs'
              }));
            }
            
            return {
              ...ledger,
              debit: Number(ledger.debit) || 0,
              credit: Number(ledger.credit) || 0,
              balance: Number(ledger.balance) || 0,
              purchase: ledger.purchase ? {
                ...ledger.purchase,
                totalAmount: Number(ledger.purchase.totalAmount) || 0,
                totalItems: Number(ledger.purchase.totalItems) || 0,
                items: purchaseItems
              } : null,
              order: ledger.order ? {
                ...ledger.order,
                totalAmount: Number(ledger.order.total) || Number(ledger.order.totalAmount) || 0,
                totalItems: ledger.order.items?.length || 0,
                items: orderItems
              } : null
            };
          });

          foundTransaction = {
            id: item.id,
            type: item.type || 'N/A',
            name: item.name || item.supplier?.name || 'N/A',
            contactNumber: item.contactNumber || item.supplier?.contact || 'N/A',
            ledgers: processedLedgers,
            supplier: item.supplier,
            createdAt: item.createdAt,
            totalBalance: processedLedgers.reduce((sum, l) => sum + (l.balance), 0),
            totalDebit: processedLedgers.reduce((sum, l) => sum + (l.debit), 0),
            totalCredit: processedLedgers.reduce((sum, l) => sum + (l.credit), 0)
          };
          break;
        }
      }

      console.log("FOUND TRANSACTION:", foundTransaction);

      if (!foundTransaction) {
        toast.error("Transaction not found");
        router.push("/ledgers");
        return;
      }

      setTransaction(foundTransaction);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch transaction");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ledgerId) {
      fetchTransaction();
    }
  }, [ledgerId]);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/ledgers/${ledgerId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }

      toast.success("Transaction deleted successfully");
      setDeleteModal(false);
      
      setTimeout(() => {
        router.push("/ledgers");
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete transaction");
    }
  };

  const handleViewDetails = (ledger) => {
    setSelectedLedger(ledger);
    setShowPurchaseModal(true);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "branch_head", "accountant"]}>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading transaction details...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!transaction) return null;

  const isCompleted = transaction.totalBalance === 0;
  const hasMultipleLedgers = transaction.ledgers.length > 1;

  return (
    <ProtectedRoute allowedRoles={["admin", "branch_head", "accountant"]}>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">

          {/* HEADER */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/ledgers")}
                className="p-2 rounded-lg hover:bg-white transition"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {transaction.type} Details
                </h1>
                <p className="text-sm text-gray-500">
                  ID: {transaction.id}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/ledgers/edit/${transaction.id}`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={() => setDeleteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-red-50 hover:border-red-200 transition"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>

          {/* MAIN CARD */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            
            {/* TOP SECTION */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm opacity-80 mb-2">Account Holder</p>
                  <h2 className="text-2xl font-bold">{transaction.name}</h2>
                  {transaction.contactNumber && (
                    <p className="text-sm opacity-80 mt-1">{transaction.contactNumber}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80 mb-2">Total Balance</p>
                  <p className={`text-3xl font-bold ${isCompleted ? 'text-green-400' : 'text-orange-400'}`}>
                    रु {Math.abs(transaction.totalBalance).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-8">

              {/* STATUS BADGES */}
              <div className="flex gap-3 flex-wrap">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                  {transaction.type}
                </span>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  isCompleted ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                }`}>
                  {isCompleted ? <CheckCircle size={15} /> : <Clock size={15} />}
                  {isCompleted ? "Completed" : "Pending"}
                </span>
                {hasMultipleLedgers && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2">
                    <Layers size={15} />
                    {transaction.ledgers.length} Ledger Entries
                  </span>
                )}
              </div>

              {/* LEDGERS TABLE */}
              {transaction.ledgers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Layers size={20} />
                    Ledger Entries ({transaction.ledgers.length})
                  </h3>
                  
                  <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ledger ID</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Items</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Debit (Dr)</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Credit (Cr)</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Balance</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {transaction.ledgers.map((ledger, index) => {
                          const purchaseItems = ledger.purchase?.items || [];
                          const orderItems = ledger.order?.items || [];
                          const hasItems = purchaseItems.length > 0 || orderItems.length > 0;
                          const hasPurchaseOrOrder = ledger.purchase || ledger.order;
                          
                          // Format items for display
                          const itemsDisplay = () => {
                            if (purchaseItems.length > 0) {
                              return purchaseItems.map(item => `${item.name} (${item.quantity})`).join(', ');
                            } else if (orderItems.length > 0) {
                              return orderItems.map(item => `${item.name} (${item.quantity})`).join(', ');
                            }
                            return 'No items';
                          };
                          
                          return (
                            <tr key={ledger.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                              <td className="px-4 py-3">
                                <span className="font-mono text-xs text-gray-600">
                                  {ledger.id?.slice(0, 8)}...
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex px-2 py-1 bg-gray-100 rounded text-xs">
                                  {ledger.type || 'INVOICE'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-xs text-gray-700 max-w-xs truncate" title={itemsDisplay()}>
                                  {itemsDisplay()}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-red-600 font-medium">
                                रु {ledger.debit.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right text-green-600 font-medium">
                                रु {ledger.credit.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`font-medium ${ledger.balance === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                  रु {ledger.balance.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {ledger.createdAt ? new Date(ledger.createdAt).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {hasPurchaseOrOrder && (
                                  <button
                                    onClick={() => handleViewDetails(ledger)}
                                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="View Details"
                                  >
                                    <Eye size={16} className="text-blue-600" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                          <td colSpan="4" className="px-4 py-3 text-right font-semibold text-gray-900">
                            Totals:
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-red-600">
                            रु {transaction.totalDebit.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-green-600">
                            रु {transaction.totalCredit.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            रु {Math.abs(transaction.totalBalance).toLocaleString()}
                          </td>
                          <td colSpan="2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* SUPPLIER INFORMATION */}
              {transaction.supplier && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 size={20} />
                    Supplier Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InfoCard icon={<User size={18} />} label="Supplier Name" value={transaction.supplier.name} />
                    <InfoCard icon={<Phone size={18} />} label="Contact" value={transaction.supplier.contact} />
                    <InfoCard icon={<Building2 size={18} />} label="Location" value={transaction.supplier.location} />
                    <InfoCard icon={<CreditCard size={18} />} label="Bank Name" value={transaction.supplier.bankname} />
                    <InfoCard icon={<Hash size={18} />} label="Account Number" value={transaction.supplier.accountNo} />
                    <InfoCard icon={<DollarSign size={18} />} label="Total Credit" value={`रु ${Number(transaction.supplier.credit || 0).toLocaleString()}`} />
                    <InfoCard icon={<DollarSign size={18} />} label="Total Paid" value={`रु ${Number(transaction.supplier.paid || 0).toLocaleString()}`} />
                    <InfoCard icon={<DollarSign size={18} />} label="Total Amount" value={`रु ${Number(transaction.supplier.totalamount || 0).toLocaleString()}`} />
                  </div>
                </div>
              )}

              {/* CREATION INFO */}
              {transaction.createdAt && (
                <div className="text-center text-xs text-gray-400 pt-4 border-t">
                  Created on {new Date(transaction.createdAt).toLocaleString()}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* DETAILS MODAL - Handles both Purchase and Order */}
        {showPurchaseModal && selectedLedger && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedLedger.purchase ? 'Purchase Details' : 'Order Details'}
                  </h2>
                  <p className="text-sm text-gray-500">Ledger ID: {selectedLedger.id}</p>
                </div>
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Purchase Information */}
                {selectedLedger.purchase && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Package size={20} />
                        Purchase Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InfoCard icon={<Hash size={18} />} label="Purchase ID" value={selectedLedger.purchase.id} />
                        <InfoCard icon={<DollarSign size={18} />} label="Total Amount" value={`रु ${selectedLedger.purchase.totalAmount.toLocaleString()}`} />
                        <InfoCard icon={<Package size={18} />} label="Total Items" value={selectedLedger.purchase.totalItems} />
                        <InfoCard icon={<Calendar size={18} />} label="Purchase Date" value={selectedLedger.purchase.purchaseDate} />
                        <div className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-white rounded-lg">
                            <Tag size={18} className="text-gray-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <span className={`inline-flex px-2 py-1 rounded text-sm font-medium ${
                              selectedLedger.purchase.status === 'completed' || selectedLedger.purchase.status === 'paid' 
                                ? 'bg-green-100 text-green-700' 
                                : selectedLedger.purchase.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {selectedLedger.purchase.status || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <InfoCard icon={<Calendar size={18} />} label="Created At" value={new Date(selectedLedger.purchase.createdat).toLocaleString()} />
                      </div>
                    </div>

                    {/* Purchase Items Table */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <ShoppingBag size={20} />
                        Items Details
                      </h3>
                      <div className="overflow-x-auto border rounded-xl">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Item Name</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Unit</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Unit Price (रु)</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total (रु)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedLedger.purchase.items && selectedLedger.purchase.items.length > 0 ? (
                              selectedLedger.purchase.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                                  <td className="px-4 py-3 text-gray-600">{item.unit || 'pcs'}</td>
                                  <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                                  <td className="px-4 py-3 text-right text-gray-600">रु {item.price.toLocaleString()}</td>
                                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                    रु {item.total.toLocaleString()}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                  No item details available
                                </td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="bg-gray-50 border-t">
                            <tr>
                              <td colSpan="5" className="px-4 py-3 text-right font-semibold text-gray-900">
                                Grand Total:
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-gray-900">
                                रु {selectedLedger.purchase.totalAmount.toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {/* Order Information */}
                {selectedLedger.order && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <ShoppingBag size={20} />
                        Order Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <InfoCard icon={<Hash size={18} />} label="Order ID" value={selectedLedger.order.id} />
                        <InfoCard icon={<User size={18} />} label="Customer Name" value={selectedLedger.order.customerName || 'Guest'} />
                        <InfoCard icon={<DollarSign size={18} />} label="Gross Amount" value={`रु ${(selectedLedger.order.grossAmount || 0).toLocaleString()}`} />
                        <InfoCard icon={<Tag size={18} />} label="Discount" value={`${selectedLedger.order.discount?.value || 0}% (रु ${(selectedLedger.order.discount?.amount || 0).toLocaleString()})`} />
                        <InfoCard icon={<DollarSign size={18} />} label="Tax" value={`${selectedLedger.order.tax?.rate || 0}% (रु ${(selectedLedger.order.tax?.amount || 0).toLocaleString()})`} />
                        <InfoCard icon={<DollarSign size={18} />} label="Total Amount" value={`रु ${(selectedLedger.order.total || selectedLedger.order.totalAmount || 0).toLocaleString()}`} />
                        <div className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-white rounded-lg">
                            <CreditCard size={18} className="text-gray-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                            <p className="font-semibold text-gray-900 capitalize">{selectedLedger.order.paymentMethod || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-white rounded-lg">
                            <Tag size={18} className="text-gray-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Order Status</p>
                            <span className={`inline-flex px-2 py-1 rounded text-sm font-medium ${
                              selectedLedger.order.orderStatus === 'COMPLETED' 
                                ? 'bg-green-100 text-green-700' 
                                : selectedLedger.order.orderStatus === 'PENDING' 
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {selectedLedger.order.orderStatus || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-white rounded-lg">
                            <CreditCard size={18} className="text-gray-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                            <span className={`inline-flex px-2 py-1 rounded text-sm font-medium ${
                              selectedLedger.order.paymentStatus === 'PAID' 
                                ? 'bg-green-100 text-green-700' 
                                : selectedLedger.order.paymentStatus === 'PENDING' 
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {selectedLedger.order.paymentStatus || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <InfoCard icon={<Calendar size={18} />} label="Order Type" value={selectedLedger.order.orderType || 'N/A'} />
                        <InfoCard icon={<Calendar size={18} />} label="Created At" value={new Date(selectedLedger.order.createdAt).toLocaleString()} />
                      </div>
                    </div>

                    {/* Order Items Table */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Package size={20} />
                        Order Items
                      </h3>
                      <div className="overflow-x-auto border rounded-xl">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Item Name</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Unit Price (रु)</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total (रु)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedLedger.order.items && selectedLedger.order.items.length > 0 ? (
                              selectedLedger.order.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                                  <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                                  <td className="px-4 py-3 text-right text-gray-600">रु {item.price.toLocaleString()}</td>
                                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                    रु {(item.quantity * item.price).toLocaleString()}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                  No items in this order
                                </td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="bg-gray-50 border-t">
                            <tr>
                              <td colSpan="4" className="px-4 py-3 text-right font-semibold text-gray-900">
                                Grand Total:
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-gray-900">
                                रु {(selectedLedger.order.total || selectedLedger.order.totalAmount || 0).toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Payment Breakdown */}
                    {selectedLedger.order.paidAmount && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <CreditCard size={20} />
                          Payment Breakdown
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InfoCard icon={<DollarSign size={18} />} label="Cash Paid" value={`रु ${(selectedLedger.order.paidAmount.cash || 0).toLocaleString()}`} />
                          <InfoCard icon={<CreditCard size={18} />} label="Online Paid" value={`रु ${(selectedLedger.order.paidAmount.online || 0).toLocaleString()}`} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Ledger Summary */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ledger Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-red-50 rounded-xl p-4">
                      <p className="text-xs text-red-600 mb-1">Debit Amount</p>
                      <p className="text-2xl font-bold text-red-600">
                        रु {selectedLedger.debit.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-xs text-green-600 mb-1">Credit Amount</p>
                      <p className="text-2xl font-bold text-green-600">
                        रु {selectedLedger.credit.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-xs text-blue-600 mb-1">Current Balance</p>
                      <p className="text-2xl font-bold text-blue-600">
                        रु {selectedLedger.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Note */}
                {selectedLedger.note && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Note</h3>
                    <p className="text-gray-600 bg-gray-50 p-4 rounded-xl">{selectedLedger.note}</p>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end">
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE MODAL */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h2 className="text-lg font-semibold text-center mb-2">
                Delete Transaction?
              </h2>
              <p className="text-sm text-gray-600 text-center mb-6">
                This will delete all ledger entries for {transaction.name}. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal(false)}
                  className="flex-1 border rounded-lg py-2 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 text-white rounded-lg py-2 hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}

// ================= INFO CARD COMPONENT =================
function InfoCard({ icon, label, value, valueClass = "" }) {
  return (
    <div className="flex gap-3 p-4 bg-gray-50 rounded-xl">
      <div className="p-2 bg-white rounded-lg text-gray-600">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
          {label}
        </p>
        <p className={`font-semibold text-gray-900 break-all ${valueClass}`}>
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}