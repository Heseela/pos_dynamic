"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Receipt, 
  User, 
  Users, 
  Clock, 
  CheckCircle,
  Search,
  LayoutGrid,
  List,
  Coffee,
  UtensilsCrossed
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";
import Link from "next/link";

export default function POSPage() {
  const router = useRouter();

  // STATES
  const [tables, setTables] = useState([]);
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableName, setTableName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [loading, setLoading] = useState(true);

  // FETCH TABLES
  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tables");
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setTables(data.data || data);
    } catch (err) {
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // CREATE TABLE
  const createTable = async () => {
    if (!tableName.trim()) return toast.error("Table name required");

    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tableName,
          reserved: false,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Table created");
      setTableName("");
      setShowTableModal(false);
      fetchTables();
    } catch {
      toast.error("Failed to create table");
    }
  };

  // UPDATE TABLE
  const updateTable = async () => {
    try {
      const res = await fetch(`/api/tables/${editingTable.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tableName,
          reserved: editingTable.reserved,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Table updated");
      setEditingTable(null);
      setTableName("");
      setShowTableModal(false);
      fetchTables();
    } catch {
      toast.error("Update failed");
    }
  };

  // DELETE TABLE
  const deleteTable = async (id) => {
    try {
      const res = await fetch(`/api/tables/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Table deleted");
      fetchTables();
    } catch {
      toast.error("Delete failed");
    }
  };

  // TOGGLE RESERVE
  const toggleReserve = async (table) => {
    try {
      const res = await fetch(`/api/tables/${table.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: table.name,
          reserved: !table.reserved,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success(table.reserved ? "Table unreserved" : "Table reserved");
      fetchTables();
    } catch {
      toast.error("Failed to update reservation");
    }
  };

  // Filter tables based on search
  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalTables = tables.length;
  const availableTables = tables.filter(t => !t.reserved).length;
  const reservedTables = tables.filter(t => t.reserved).length;

  return (
    <ProtectedRoute allowedRoles={["admin", "branch_head", "cashier", "worker"]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        
        {/* Hero Section - Responsive */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Point of Sale</h1>
                <p className="text-gray-300 text-sm sm:text-base mt-1">Manage tables and process orders efficiently</p>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={() => router.push("/pos/individual")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  <User size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden xs:inline">Individual Order</span>
                  <span className="xs:hidden">Individual Order</span>
                </button>
                <button
                  onClick={() => {
                    setEditingTable(null);
                    setTableName("");
                    setShowTableModal(true);
                  }}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 border border-white/20 text-sm sm:text-base"
                >
                  <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden xs:inline">Add Table</span>
                  <span className="xs:hidden">Add</span>
                </button>
                <button
                  onClick={() => router.push("/pos/saved-bills")}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 border border-white/20 text-sm sm:text-base"
                >
                  <Receipt size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden xs:inline">Saved Bills</span>
                  <span className="xs:hidden">Bills</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm font-medium">Total Tables</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{totalTables}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <UtensilsCrossed size={18} className="sm:w-[24px] sm:h-[24px] text-gray-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-xs sm:text-sm font-medium">Available</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{availableTables}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-50 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <CheckCircle size={18} className="sm:w-[24px] sm:h-[24px] text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-xs sm:text-sm font-medium">Reserved</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{reservedTables}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-50 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <Clock size={18} className="sm:w-[24px] sm:h-[24px] text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          
          {/* Toolbar - Responsive */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-gray-100 p-3 sm:p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full sm:flex-1 sm:max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-sm sm:text-base"
                />
              </div>
              
              {/* View Toggle */}
              <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                    viewMode === "grid" 
                      ? "bg-white text-gray-900 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LayoutGrid size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                    viewMode === "list" 
                      ? "bg-white text-gray-900 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12 sm:py-20">
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">Loading tables...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredTables.length === 0 && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-gray-100 p-8 sm:p-12 text-center">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <UtensilsCrossed size={28} className="sm:w-[40px] sm:h-[40px] text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Tables Found</h3>
              <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">
                {searchQuery ? "No tables match your search criteria." : "Get started by adding your first table."}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => {
                    setEditingTable(null);
                    setTableName("");
                    setShowTableModal(true);
                  }}
                  className="bg-gray-900 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl hover:bg-gray-800 transition inline-flex items-center gap-2 text-sm sm:text-base"
                >
                  <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Add Your First Table
                </button>
              )}
            </div>
          )}

          {/* Table Grid/List View - Fully Responsive */}
          {!loading && filteredTables.length > 0 && (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              : "space-y-3"
            }>
              {filteredTables.map((table) => (
                <div
                  key={table.id}
                  className={`group bg-white rounded-xl sm:rounded-2xl shadow-md border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    table.reserved 
                      ? "border-yellow-200 hover:border-yellow-300" 
                      : "border-green-200 hover:border-green-300"
                  }`}
                >
                  {viewMode === "grid" ? (
                    // Grid View - Fully Responsive
                    <div className="p-4 sm:p-5">
                      {/* Header with Actions */}
                      <div className="flex justify-between items-start mb-3">
                        <div className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-xs font-medium ${
                          table.reserved 
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {table.reserved ? "Reserved" : "Available"}
                        </div>
                        <div className="flex gap-0.5 sm:gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingTable(table);
                              setTableName(table.name);
                              setShowTableModal(true);
                            }}
                            className="p-1.5 sm:p-1.5 rounded-lg hover:bg-gray-100 transition"
                            title="Edit Table"
                          >
                            <Pencil size={12} className="sm:w-[14px] sm:h-[14px] text-gray-500" />
                          </button>
                          <button
                            onClick={() => deleteTable(table.id)}
                            className="p-1.5 sm:p-1.5 rounded-lg hover:bg-red-50 transition"
                            title="Delete Table"
                          >
                            <Trash2 size={12} className="sm:w-[14px] sm:h-[14px] text-red-500" />
                          </button>
                        </div>
                      </div>

                      {/* Table Name */}
                      <Link href={`/pos/${table.id}`} className="block">
                        <div className="text-center mb-3 sm:mb-4">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                            <Coffee size={22} className="sm:w-[28px] sm:h-[28px] text-gray-600" />
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate max-w-[150px] sm:max-w-full mx-auto">{table.name}</h3>
                        </div>
                      </Link>

                      {/* Stats */}
                      <div className="flex justify-around pt-3 border-t border-gray-100 mb-3 sm:mb-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Items</p>
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">{table.orders?.length || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Status</p>
                          <p className={`text-xs font-medium ${
                            table.reserved ? "text-yellow-600" : "text-green-600"
                          }`}>
                            {table.reserved ? "Reserved" : "Free"}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons - Stack on mobile */}
                      <div className="flex flex-col xs:flex-row gap-2">
                        <Link 
                          href={`/pos/${table.id}`}
                          className="flex-1 bg-gray-900 text-white text-center py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition"
                        >
                          Take Order
                        </Link>
                        <button
                          onClick={() => toggleReserve(table)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                            table.reserved
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {table.reserved ? "Unreserve" : "Reserve"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // List View - Responsive
                    <div className="block">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition gap-3">
                        <Link href={`/pos/${table.id}`} className="flex-1">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                              table.reserved ? "bg-yellow-500" : "bg-green-500"
                            }`} />
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                                <Coffee size={16} className="sm:w-[20px] sm:h-[20px] text-gray-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{table.name}</h3>
                                <p className="text-xs text-gray-500">
                                  {table.orders?.length || 0} items • 
                                  {table.reserved ? " Reserved" : " Available"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                        <div className="flex gap-1 sm:gap-2 justify-end">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleReserve(table);
                            }}
                            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                              table.reserved
                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {table.reserved ? "Unreserve" : "Reserve"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setEditingTable(table);
                              setTableName(table.name);
                              setShowTableModal(true);
                            }}
                            className="p-1 sm:p-1.5 rounded-lg hover:bg-gray-100 transition"
                          >
                            <Pencil size={14} className="sm:w-[16px] sm:h-[16px] text-gray-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              deleteTable(table.id);
                            }}
                            className="p-1 sm:p-1.5 rounded-lg hover:bg-red-50 transition"
                          >
                            <Trash2 size={14} className="sm:w-[16px] sm:h-[16px] text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Table Modal - Responsive */}
        {showTableModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in">
            <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-[calc(100%-2rem)] sm:max-w-md shadow-2xl transform transition-all animate-slide-up mx-3 sm:mx-0">
              <div className="flex justify-between items-center p-4 sm:p-6 border-b">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {editingTable ? "Edit Table" : "Add New Table"}
                </h2>
                <button 
                  onClick={() => setShowTableModal(false)} 
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <X size={18} className="sm:w-[20px] sm:h-[20px]" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Name
                </label>
                <input
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Enter table name (e.g., Table 1, VIP, Window)"
                  className="w-full border border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-sm sm:text-base"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      editingTable ? updateTable() : createTable();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Choose a unique name for easy identification
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 p-4 sm:p-6 pt-0 sm:pt-0">
                <button
                  onClick={() => setShowTableModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition text-sm sm:text-base order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={editingTable ? updateTable : createTable}
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition text-sm sm:text-base order-1 sm:order-2"
                >
                  {editingTable ? "Update Table" : "Create Table"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        /* Custom breakpoint for extra small screens */
        @media (min-width: 480px) {
          .xs\\:inline {
            display: inline;
          }
          .xs\\:hidden {
            display: none;
          }
          .xs\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .xs\\:flex-row {
            flex-direction: row;
          }
        }
        @media (max-width: 479px) {
          .xs\\:inline {
            display: none;
          }
          .xs\\:hidden {
            display: inline;
          }
          .xs\\:grid-cols-2 {
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }
          .xs\\:flex-row {
            flex-direction: column;
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}