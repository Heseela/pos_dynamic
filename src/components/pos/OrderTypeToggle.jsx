import { UtensilsCrossed, ShoppingBag } from 'lucide-react';

export default function OrderTypeToggle({ orderMode, setOrderMode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <button
        onClick={() => setOrderMode("table")}
        className={`flex items-center gap-2.5 px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
          orderMode === "table"
            ? "bg-gray-900 text-white shadow-md"
            : "bg-white text-gray-700 border border-gray-200 hover:border-gray-900"
        }`}
      >
        <UtensilsCrossed size={20} />
        <span>Table Order</span>
      </button>

      <button
        onClick={() => setOrderMode("individual")}
        className={`flex items-center gap-2.5 px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
          orderMode === "individual"
            ? "bg-gray-900 text-white shadow-md"
            : "bg-white text-gray-700 border border-gray-200 hover:border-gray-900"
        }`}
      >
        <ShoppingBag size={20} />
        <span>Individual Order</span>
      </button>
    </div>
  );
}
