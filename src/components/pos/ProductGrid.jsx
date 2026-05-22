'use client'

import { Package, Search, Grid3x3, List } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Pagination from '@/components/Global/pagination';

export default function ProductGrid({ onAddProduct, initialViewMode = "table" }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/product');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(product => product.category?.name).filter(cat => cat))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products by search and category
  const filteredProducts = products.filter((product) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = search === "" || (
      product.name?.toLowerCase().includes(searchLower) ||
      product.category?.name?.toLowerCase().includes(searchLower)
    );
    
    const matchesCategory = selectedCategory === "all" || product.category?.name === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  // Check if product is available
  const isProductAvailable = (product) => {
    if (typeof product.avilable === 'boolean') {
      return product.avilable === true;
    }
    if (typeof product.avilable === 'string') {
      return product.avilable === "true";
    }
    return true; // Default to available if no availability info
  };

  const handleAddToOrder = (product) => {
    if (!isProductAvailable(product)) {
      toast.error(`${product.name} is not available`);
      return;
    }
    
    if (onAddProduct) {
      // Transform product to match CartWithBilling expected format
      const cartItem = {
        id: product.id,
        name: product.name,
        sellingPrice: product.sellingPrice || 0,
        price: product.sellingPrice || 0,
        quantity: 1,
        description: product.description,
        category: product.category?.name,
        avilable: product.avilable
      };
      onAddProduct(cartItem);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  // Grid View
  if (viewMode === "grid") {
    return (
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="search"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-gray-900 transition-all shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  viewMode === "grid"
                    ? "bg-gray-900 text-white border-gray-900 shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-900"
                }`}
              >
                <Grid3x3 size={20} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  viewMode === "table"
                    ? "bg-gray-900 text-white border-gray-900 shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-900"
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleCategoryChange("all")}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                selectedCategory === "all"
                  ? "bg-gray-900 text-white border-gray-900 shadow-md"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-900"
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                  selectedCategory === category
                    ? "bg-gray-900 text-white border-gray-900 shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-900"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedProducts.map((product) => {
            const isAvailable = isProductAvailable(product);
            
            return (
              <div
                key={product.id}
                className={`bg-white rounded-lg border-2 p-4 transition-all ${
                  isAvailable
                    ? "border-gray-200 hover:border-gray-900 hover:shadow-md cursor-pointer"
                    : "border-gray-200 opacity-60 cursor-not-allowed"
                }`}
                onClick={() => handleAddToOrder(product)}
              >
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                  <Package className="text-gray-400" size={48} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500">{product.category?.name || 'Uncategorized'}</p>
                  
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-base font-bold text-gray-900">
                      रु{product.sellingPrice?.toLocaleString() || 0}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      isAvailable
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {paginatedProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          showItemsPerPage={true}
        />
      </div>
    );
  }

  // Table View
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-gray-900 transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 rounded-lg border-2 transition-all ${
                viewMode === "grid"
                  ? "bg-gray-900 text-white border-gray-900 shadow-md"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-900"
              }`}
            >
              <Grid3x3 size={20} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-3 rounded-lg border-2 transition-all ${
                viewMode === "table"
                  ? "bg-gray-900 text-white border-gray-900 shadow-md"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-900"
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleCategoryChange("all")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
              selectedCategory === "all"
                ? "bg-gray-900 text-white border-gray-900 shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-900"
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                selectedCategory === category
                  ? "bg-gray-900 text-white border-gray-900 shadow-md"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-900"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedProducts.map((product) => {
                const isAvailable = isProductAvailable(product);
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {product.description}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {product.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 text-sm">
                      रु{product.sellingPrice?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        isAvailable
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleAddToOrder(product)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isAvailable
                              ? "bg-gray-900 text-white hover:bg-gray-800"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                          disabled={!isAvailable}
                          title={isAvailable ? "Add to Order" : "Product Unavailable"}
                        >
                          <Package size={16} />
                          Add to Order
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paginatedProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          showItemsPerPage={true}
        />
      </div>
    </div>
  );
}