import { Package, Edit, Trash2 } from 'lucide-react';

export default function ProductTable({ products, onAddProduct, onEditProduct, onDeleteProduct, getStockStatus }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Product
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Category
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Price
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Stock
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((product) => {
            const stockStatus = getStockStatus(product.stock);
            return (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                      <Package className="text-gray-400" size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                      {/* {product.sku && <div className="text-xs text-gray-500">{product.sku}</div>} */}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{product.category}</td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900 text-sm">
                रु{product.price.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                    {stockStatus.label}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => onAddProduct(product)}
                      disabled={product.stock === 0}
                      className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Add to Order
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProduct(product.id);
                      }}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit product"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProduct(product.id);
                      }}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Delete product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
