import { Users, UtensilsCrossed, TrendingUp, Calendar } from 'lucide-react';

export default function StatsCards({ tables, getTableTotal }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center ßshrink-0">
            <Users className="text-gray-900" size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Available</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {tables.filter((t) => t.status === "available").length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
            <UtensilsCrossed className="text-gray-900" size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Occupied</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {tables.filter((t) => t.status === "occupied").length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
            <Calendar className="text-gray-900" size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Reserved</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
              {tables.filter((t) => t.status === "reserved").length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp className="text-gray-900" size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">
            रु{tables.reduce((sum, t) => sum + getTableTotal(t), 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
