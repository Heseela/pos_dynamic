"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  User,
  Package,
  Hash,
  Image as ImageIcon,
  Truck,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function ViewPurchasePage() {
  const router = useRouter();
  const params = useParams();
  const purchaseId = params.id;

  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const response = await fetch(`/api/purchase/${purchaseId}`, {
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed");

        const data = await response.json();

        // API returns array → take first item
        setPurchase(Array.isArray(data) ? data[0] : data);
      } catch (err) {
        toast.error("Failed to load purchase");
        router.push("/purchase");
      } finally {
        setLoading(false);
      }
    };

    if (purchaseId) fetchPurchase();
  }, [purchaseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!purchase) return null;

  const supplier = purchase.supplier;
  const items = purchase.items || [];
  const images = purchase.image || [];

  return (
    <ProtectedRoute allowedRoles={["admin", "branch_head"]}>
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/purchase")}>
            <ArrowLeft />
          </button>
          <div>
            <h1 className="text-xl font-semibold">
              Purchase Details
            </h1>
            <p className="text-sm text-gray-500">
              ID: {purchase.id}
            </p>
          </div>
        </div>

        {/* SUMMARY CARD */}
        <div className="bg-white border rounded-xl p-6 space-y-3">
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Amount</p>
            <h2 className="text-4xl font-bold">
              रु{Number(purchase.totalAmount).toLocaleString()}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Calendar size={16} className="inline mr-1" />
              {purchase.purchaseDate}
            </div>

            <div>
              <Hash size={16} className="inline mr-1" />
              Items: {purchase.totalItems}
            </div>

            <div className="col-span-2">
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                {purchase.status}
              </span>
            </div>
          </div>
        </div>

        {/* SUPPLIER INFO */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Truck size={18} /> Supplier Information
          </h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <p><b>Name:</b> {supplier?.name}</p>
            <p><b>Contact:</b> {supplier?.contact}</p>
            <p><b>Location:</b> {supplier?.location}</p>
            <p><b>PAN/VAT:</b> {supplier?.panvat}</p>
            <p><b>Bank:</b> {supplier?.bankname}</p>
            <p><b>Account:</b> {supplier?.accountNo}</p>
          </div>
        </div>

        {/* ITEMS */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Package size={18} /> Items
          </h2>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 flex justify-between"
              >
                <div>
                  <p className="font-medium">
                    {item.inventory?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Unit: {item.inventory?.unit}
                  </p>
                </div>

                <div className="text-right">
                  <p>Qty: {item.quantity}</p>
                  <p className="text-sm text-gray-500">
                    Price: ₹{item.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* IMAGES */}
        {images.length > 0 && (
          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <ImageIcon size={18} /> Attachments
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map((img) => (
                <img
                  key={img.id}
                  src={img.imageUrl}
                  className="w-full h-32 object-cover rounded-lg border"
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}