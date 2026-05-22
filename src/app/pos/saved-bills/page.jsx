"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Receipt, Eye, Trash2, Printer, Download, ArrowLeft, Search, X, RefreshCw, CheckCircle } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";

export default function SavedBillsPage() {
  const router = useRouter();
  const [savedBills, setSavedBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedBill, setSelectedBill] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, bill: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedBills();
  }, []);

  const apiRequest = async (endpoint, method = 'GET', data = null) => {
    const url = `/api/${endpoint}`;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }
    try {
      const response = await fetch(url, options);
      
      // For DELETE, check if response is ok without trying to parse JSON
      if (method === 'DELETE') {
        if (response.ok) {
          return { success: true };
        } else {
          const text = await response.text();
          throw new Error(text || `Delete failed with status ${response.status}`);
        }
      }
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || `Request failed`);
      }
      return result;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  };

  const loadSavedBills = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('order', 'GET');
      let orders = [];
      if (Array.isArray(response)) orders = response;
      else if (response.data && Array.isArray(response.data)) orders = response.data;
      else if (response.orders && Array.isArray(response.orders)) orders = response.orders;
      
      const formattedBills = orders.map(order => ({
        id: order.id,
        billNumber: order.billNumber || `BILL-${order.id}`,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        tableId: order.tableId,
        customerName: order.customerName || 'Guest',
        contactNumber: order.contactNumber,
        items: order.items?.map(item => ({
          ...item,
          name: item.name || `Item ${item.id}`,
          price: item.price,
          quantity: item.quantity,
          total: item.total
        })) || [],
        subtotal: order.subtotal,
        discount: order.discount?.value || 0,
        discountAmount: order.discount?.amount || 0,
        tax: order.tax?.amount || 0,
        taxRate: order.tax?.rate || 10,
        total: order.total,
        grossAmount: order.grossAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        timestamp: order.timestamp || order.createdat || new Date().toISOString(),
        synced: true
      }));
      
      // Also load from localStorage
      const localOrders = JSON.parse(localStorage.getItem('saved_orders') || '[]');
      const allBills = [...formattedBills, ...localOrders];
      
      // Remove duplicates by id
      const uniqueBills = [];
      const seenIds = new Set();
      for (const bill of allBills) {
        const billId = bill.billNumber;
        if (!seenIds.has(billId)) {
          seenIds.add(billId);
          uniqueBills.push(bill);
        }
      }
      
      uniqueBills.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setSavedBills(uniqueBills);
      
    } catch (error) {
      console.error('Error loading bills:', error);
      const localOrders = JSON.parse(localStorage.getItem('saved_orders') || '[]');
      localOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setSavedBills(localOrders);
      toast.error('Could not fetch from server. Showing local bills only.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBill = async (bill) => {
    try {
      // Try to delete from backend if it has an ID
      if (bill.id) {
        try {
          await apiRequest(`order/${bill.id}`, 'DELETE');
          toast.success("Bill deleted from server!");
        } catch (serverError) {
          console.error('Server delete error:', serverError);
          toast.error("Could not delete from server. Removing locally only.");
        }
      } else {
        toast.success("Bill removed from local storage!");
      }
      
      // Remove from local state
      const updatedBills = savedBills.filter((b) => b.id !== bill.id && b.billNumber !== bill.billNumber);
      setSavedBills(updatedBills);
      
      // Remove from localStorage
      const localOrders = JSON.parse(localStorage.getItem('saved_orders') || '[]');
      const filteredLocal = localOrders.filter((order) => order.id !== bill.id && order.billNumber !== bill.billNumber);
      localStorage.setItem('saved_orders', JSON.stringify(filteredLocal));
      
      setDeleteModal({ show: false, bill: null });
      
      // Refresh the list to ensure consistency
      await loadSavedBills();
      
    } catch (error) {
      console.error('Error in delete process:', error);
      toast.error('Failed to delete bill');
    }
  };

  const placeOrder = (bill) => {
    toast.success(`Processing order ${bill.billNumber}...`);
    localStorage.setItem('order_to_complete', JSON.stringify(bill));
    router.push('/pos');
  };

  const printBill = (bill) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${bill.billNumber}</title>
          <style>
            @page { size: 80mm auto; margin: 0mm; }
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0; padding: 8px 5px; line-height: 1.3; }
            .header { text-align: center; margin-bottom: 10px; }
            .restaurant-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .flex-row { display: flex; justify-content: space-between; margin: 4px 0; }
            .item-name { font-weight: bold; }
            .item-detail { display: flex; justify-content: space-between; margin-left: 10px; font-size: 11px; }
            .final-total { font-size: 14px; font-weight: bold; margin: 8px 0; }
            .footer { text-align: center; margin-top: 15px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">🍽️ SAVORY DELIGHT</div>
            <div>Butwal-11, Milanchowk, Nepal</div>
            <div>Phone: +977 985-1234567</div>
          </div>
          <div class="divider"></div>
          <div class="flex-row"><span>Bill No:</span><span>${bill.billNumber}</span></div>
          <div class="flex-row"><span>Order Type:</span><span>${bill.orderType?.toUpperCase() || 'N/A'}</span></div>
          ${bill.customerName && bill.customerName !== 'Guest' ? `<div class="flex-row"><span>Customer:</span><span>${bill.customerName}</span></div>` : ''}
          <div class="flex-row"><span>Date:</span><span>${new Date(bill.timestamp).toLocaleString()}</span></div>
          <div class="divider"></div>
          <div><strong>ITEMS:</strong></div>
          ${bill.items?.map(item => `
            <div>
              <div class="item-name">${item.name || `Item ${item.id}`}</div>
              <div class="item-detail">
                <span>${item.quantity} x रु${(item.price || 0).toFixed(2)}</span>
                <span>रु${(item.total || item.price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          `).join('')}
          <div class="divider"></div>
          <div class="flex-row"><span>Subtotal:</span><span>रु${(bill.subtotal || 0).toFixed(2)}</span></div>
          ${bill.discount > 0 ? `<div class="flex-row"><span>Discount (${bill.discount}%):</span><span>-रु${(bill.discountAmount || 0).toFixed(2)}</span></div>` : ''}
          <div class="flex-row"><span>Tax (${bill.taxRate || 10}%):</span><span>रु${(bill.tax || 0).toFixed(2)}</span></div>
          <div class="divider"></div>
          <div class="final-total flex-row"><span>TOTAL:</span><span>रु${(bill.total || 0).toFixed(2)}</span></div>
          <div class="divider"></div>
          <div class="footer"><div>✨ Thank you! ✨</div><div>Visit Again!</div></div>
          <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }</script>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    toast.success("Printing...");
  };

  const downloadBill = (bill) => {
    const billText = `
╔════════════════════════════════════════════╗
║              🍽️ SAVORY DELIGHT             ║
╠════════════════════════════════════════════╣
║  Butwal-11, Milanchowk, Nepal              ║
║  Phone: +977 985-1234567                   ║
╠════════════════════════════════════════════╣
║  Bill No: ${bill.billNumber.padEnd(30)}║
║  Order Type: ${(bill.orderType || 'N/A').toUpperCase().padEnd(30)}║
${bill.customerName && bill.customerName !== 'Guest' ? `║  Customer: ${bill.customerName.padEnd(30)}║` : ''}
║  Date: ${new Date(bill.timestamp).toLocaleString().padEnd(30)}║
╠════════════════════════════════════════════╣
║  ITEMS                                     ║
${bill.items?.map(item => `║  ${(item.name || `Item ${item.id}`).substring(0, 28).padEnd(28)}  ║
║    ${item.quantity} x रु${(item.price || 0).toFixed(2)} = रु${((item.price || 0) * item.quantity).toFixed(2).padEnd(25)}║`).join('\n')}
╠════════════════════════════════════════════╣
║  Subtotal: रु${(bill.subtotal || 0).toFixed(2).padEnd(30)}║
${bill.discount > 0 ? `║  Discount (${bill.discount}%): -रु${(bill.discountAmount || 0).toFixed(2).padEnd(30)}║` : ''}
║  Tax (10%): रु${(bill.tax || 0).toFixed(2).padEnd(30)}║
╠════════════════════════════════════════════╣
║  TOTAL: रु${(bill.total || 0).toFixed(2).padEnd(30)}║
╠════════════════════════════════════════════╣
║              ✨ Thank you! ✨               ║
║                Visit Again!                ║
╚════════════════════════════════════════════╝
    `;
    const blob = new Blob([billText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bill.billNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Bill downloaded!");
  };

  const filteredBills = savedBills.filter((bill) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (bill.billNumber?.toLowerCase().includes(search)) ||
      (bill.orderNumber?.toLowerCase().includes(search)) ||
      (bill.customerName?.toLowerCase().includes(search));
    const matchesFilter = filterType === "all" || bill.orderType === filterType;
    return matchesSearch && matchesFilter;
  });

  const BillDetailModal = ({ bill, onClose }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Bill Details</h2>
            <button onClick={onClose} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-5">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-500 text-xs">Bill Number</p><p className="font-semibold">{bill.billNumber}</p></div>
              <div><p className="text-gray-500 text-xs">Order Type</p><p className="font-semibold capitalize">{bill.orderType || 'N/A'}</p></div>
              {bill.customerName && bill.customerName !== 'Guest' && (
                <div className="col-span-2"><p className="text-gray-500 text-xs">Customer</p><p className="font-semibold">{bill.customerName}</p></div>
              )}
              <div className="col-span-2"><p className="text-gray-500 text-xs">Date & Time</p><p className="font-semibold">{new Date(bill.timestamp).toLocaleString()}</p></div>
            </div>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
            <div className="space-y-2">
              {bill.items?.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                  <div><p className="font-medium text-gray-900 text-sm">{item.name}</p><p className="text-xs text-gray-500">रु{(item.price || 0).toLocaleString()} × {item.quantity}</p></div>
                  <p className="font-semibold text-gray-900 text-sm">रु{(item.total || item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-200 pt-3 space-y-2 mb-4">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>रु{(bill.subtotal || 0).toLocaleString()}</span></div>
            {bill.discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount ({bill.discount}%)</span><span>-रु{(bill.discountAmount || 0).toFixed(2)}</span></div>}
            <div className="flex justify-between text-sm"><span>Tax ({bill.taxRate || 10}%)</span><span>रु{(bill.tax || 0).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg text-gray-900 border-t border-gray-200 pt-2"><span>Total</span><span>रु{(bill.total || 0).toLocaleString()}</span></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { printBill(bill); onClose(); }} className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium flex items-center justify-center gap-2"><Printer size={16} /> Print</button>
            <button onClick={() => { downloadBill(bill); onClose(); }} className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium flex items-center justify-center gap-2"><Download size={16} /> Download</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "branch_head", "cashier", "worker"]}>
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div><p className="mt-4 text-gray-600">Loading bills...</p></div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "branch_head", "cashier", "worker"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/pos")} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
            <div><h1 className="text-2xl font-semibold text-gray-900">Saved Bills</h1><p className="text-sm text-gray-500">{filteredBills.length} bills found</p></div>
          </div>
          <button onClick={loadSavedBills} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium flex items-center gap-2"><RefreshCw size={16} /> Refresh</button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by bill number, customer name..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm"><option value="all">All Orders</option><option value="dine-in">Dine-in</option><option value="takeaway">Takeaway</option></select>
          </div>
        </div>

        {filteredBills.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center"><Receipt className="text-gray-300 mx-auto mb-3" size={48} /><p className="text-gray-500 font-medium">No saved bills found</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBills.map((bill) => (
              <div key={bill.id || bill.billNumber} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center"><Receipt className="text-gray-700" size={20} /></div><div><p className="font-semibold text-gray-900 text-sm">{bill.billNumber}</p><p className="text-xs text-gray-500 capitalize mt-0.5">{bill.orderType || 'N/A'}</p></div></div>
                  {bill.orderStatus === 'paid' && <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Paid</span>}
                  {bill.orderStatus === 'completed' && <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Completed</span>}
                </div>
                {bill.customerName && bill.customerName !== 'Guest' && <div className="mb-1 text-sm"><span className="text-gray-600">Customer: </span><span className="font-medium text-gray-900">{bill.customerName}</span></div>}
                <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Items</span><span className="font-medium">{bill.items?.length || 0}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Total</span><span className="font-bold text-gray-900">रु{(bill.total || 0).toLocaleString()}</span></div>
                  <div className="text-xs text-gray-500">{new Date(bill.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedBill(bill)} className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"><Eye size={14} /> View</button>
                  <button onClick={() => placeOrder(bill)} className="p-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50" title="Place Order"><CheckCircle size={16} /></button>
                  <button onClick={() => printBill(bill)} className="p-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50" title="Print Bill"><Printer size={16} /></button>
                  <button onClick={() => setDeleteModal({ show: true, bill })} className="p-2 border border-gray-200 text-red-600 rounded-lg hover:bg-red-50" title="Delete Bill"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedBill && <BillDetailModal bill={selectedBill} onClose={() => setSelectedBill(null)} />}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Bill</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete bill <span className="font-semibold">{deleteModal.bill?.billNumber}</span>? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteModal({ show: false, bill: null })} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteBill(deleteModal.bill)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}