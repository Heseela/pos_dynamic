"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Users, Plus, X } from "lucide-react";
import toast from "react-hot-toast";

export default function AddBranchPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    location: "",
    type: "Sub Branch",
    manager: "",
    employees: 0,
  });

  const [poles, setPoles] = useState([
    { name: "Branch Head", head: "", count: 1, role: "branch_head" },
    { name: "Cashier", head: "", count: 0, role: "cashier" },
    { name: "Worker", head: "", count: 0, role: "worker" },
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const branches = JSON.parse(localStorage.getItem("branches") || "[]");

    const newId =
      branches.length > 0 ? Math.max(...branches.map((b) => b.id)) + 1 : 1;

    const newBranch = {
      id: newId,
      ...formData,
      employees: parseInt(formData.employees),
      status: "Active",
      poles: poles.filter((pole) => pole.count > 0),
    };

    const updatedBranches = [...branches, newBranch];

    localStorage.setItem("branches", JSON.stringify(updatedBranches));

    toast.success("Branch created successfully!");
    router.push("/branches");
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePoleChange = (index, field, value) => {
    const updatedPoles = [...poles];
    updatedPoles[index][field] =
      field === "count" ? parseInt(value) || 0 : value;
    setPoles(updatedPoles);
  };

  const addPole = () => {
    setPoles([...poles, { name: "", head: "", count: 0, role: "worker" }]);
  };

  const removePole = (index) => {
    setPoles(poles.filter((_, i) => i !== index));
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Add New Branch
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create a new branch location
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Building2 size={16} />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g., BTL"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Butwal Branch"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Butwal, Nepal"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="Headquarters">Headquarters</option>
                    <option value="Sub Branch">Sub Branch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manager Name
                  </label>
                  <input
                    type="text"
                    name="manager"
                    value={formData.manager}
                    onChange={handleChange}
                    placeholder="e.g., John Doe"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Employees
                  </label>
                  <input
                    type="number"
                    name="employees"
                    value={formData.employees}
                    onChange={handleChange}
                    placeholder="0"
                    required
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <Users size={16} />
                  Organization Structure
                </h3>
                <button
                  type="button"
                  onClick={addPole}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add Role
                </button>
              </div>

              <div className="space-y-3">
                {poles.map((pole, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Role Name
                      </label>
                      <input
                        type="text"
                        value={pole.name}
                        onChange={(e) =>
                          handlePoleChange(index, "name", e.target.value)
                        }
                        placeholder="e.g., Cashier"
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Head/Manager
                      </label>
                      <input
                        type="text"
                        value={pole.head}
                        onChange={(e) =>
                          handlePoleChange(index, "head", e.target.value)
                        }
                        placeholder="Name"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Count
                      </label>
                      <input
                        type="number"
                        value={pole.count}
                        onChange={(e) =>
                          handlePoleChange(index, "count", e.target.value)
                        }
                        placeholder="0"
                        min="0"
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removePole(index)}
                        className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <X size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Create Branch
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
