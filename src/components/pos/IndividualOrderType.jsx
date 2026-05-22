import { Package, Bike, Users } from 'lucide-react';

export default function IndividualOrderType({ onSelectType }) {
  const orderTypes = [
    {
      id: "Takeaway",
      title: "Takeaway",
      description: "Pack and collect",
      icon: Package,
    },
    {
      id: "Delivery",
      title: "Delivery",
      description: "Send to address",
      icon: Bike,
    },
  
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {orderTypes.map((type) => {
        const Icon = type.icon;
        return (
          <button
            key={type.id}
            onClick={() => onSelectType(type.id)}
            className="group relative bg-white border-2 border-gray-200 rounded-lg p-6 text-left transition-all duration-200 hover:border-gray-900 hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center transition-colors duration-200 group-hover:bg-gray-900">
                <Icon className="text-gray-600 transition-colors duration-200 group-hover:text-white" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                  {type.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {type.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
