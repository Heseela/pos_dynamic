import { Edit, Trash2, Plus } from "lucide-react";

export default function TableGrid({
  tables,
  onSelectTable,
  onEditTable,
  onDeleteTable,
  onToggleReserve,
  onAddTable,
  getTableTotal,
  getTableItemCount,
  getTableStatusColor,
  getTableStatusBadge,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Select a Table</h2>
        <button
          onClick={onAddTable}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all"
        >
          <Plus size={18} />
          Add Table
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className="relative bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-gray-900 transition-all min-h-[30vh]"
          >
            <div
              onClick={() => onSelectTable(table)}
              className="cursor-pointer h-full flex flex-col items-center justify-center"
            >
              <div className="text-3xl font-bold text-gray-900 mb-3">
                {table.number} 
              </div>
              <span
                className={`inline-flex px-3 py-1 rounded-md text-xs font-semibold ${getTableStatusBadge(
                  table.status
                )}`}
              >
                {table.status}
              </span>

              {table.status === "reserved" && table.reservedFor && (
                <div className="mt-3 text-sm text-gray-600">
                  {table.reservedFor}
                </div>
              )}

              {table.orders.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 w-full text-center">
                  <p className="text-xs text-gray-500">
                    {getTableItemCount(table)} items
                  </p>
                  <p className="text-base font-bold text-gray-900 mt-1">
                    रु {getTableTotal(table).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="absolute top-2 left-2 flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTable(table);
                }}
                className="p-1.5 bg-gray-100 rounded-md text-gray-600 hover:bg-gray-900 hover:text-white transition-all"
                title="Edit table"
              >
                <Edit size={14} />
              </button>
              {table.status === "available" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTable(table.id);
                  }}
                  className="p-1.5 bg-gray-100 rounded-md text-gray-600 hover:bg-red-600 hover:text-white transition-all"
                  title="Delete table"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {table.status !== "occupied" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleReserve(table.id);
                }}
                className={`absolute bottom-2 right-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  table.status === "reserved"
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-900 hover:text-white"
                }`}
                title={
                  table.status === "reserved"
                    ? "Unreserve table"
                    : "Reserve table"
                }
              >
                {table.status === "reserved" ? "Unreserve" : "Reserve"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
