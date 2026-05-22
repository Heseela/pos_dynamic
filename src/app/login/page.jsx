"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();


  // useEffect(() => {
  //   const getCookie = (name) => {
  //     const value = `; ${document.cookie}`;
  //     const parts = value.split(`; ${name}=`);
  //     if (parts.length === 2) return parts.pop().split(';').shift();
  //   };
    
  //   const authToken = getCookie('authToken');
  //   console.log('Auth token from cookie:', authToken);
    
    
  //   if (authToken) {
  //     router.push('/');
  //   }
  // }, [loading, router]);

  const { checkAuth } = useAuth();
  const LOGIN_API_URL = process.env.BACKEND_API_URL
    ? process.env.BACKEND_API_URL + "/auth/login"
    : "/api/auth/login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const result = await res.json();
    setLoading(false);
      if (result.success) {
        console.log("here")
         await checkAuth(); 
        router.replace("/");
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // const demoAccounts = [
  //   {
  //     email: "admin@gmail.com",
  //     password: "Admin@321",
  //     role: "Admin",
  //     branch: "ATS",
  //   },
  //   {
  //     email: "head@pos.com",
  //     password: "head123",
  //     role: "Branch Head",
  //     branch: "Butwal",
  //   },
  //   {
  //     email: "head2@pos.com",
  //     password: "head123",
  //     role: "Branch Head",
  //     branch: "Bhairahawa",
  //   },
  //   {
  //     email: "cashier@pos.com",
  //     password: "cashier123",
  //     role: "Cashier",
  //     branch: "ATS",
  //   },
  //   {
  //     email: "cashier1@pos.com",
  //     password: "cashier123",
  //     role: "Cashier",
  //     branch: "Butwal",
  //   },
  //   {
  //     email: "cashier2@pos.com",
  //     password: "cashier123",
  //     role: "Cashier",
  //     branch: "Bhairahawa",
  //   },
  // ];

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Savory</h1>
                <p className="text-xs text-gray-500">Point of Sale</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign in
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* <div className="hidden lg:flex w-120 bg-gray-50 border-l border-gray-200 p-8 flex-col">
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Quick Access
            </h3>
            <p className="text-sm text-gray-600">
              Click any account to auto-fill credentials
            </p>
          </div>

          <div className="space-y-3">
            {demoAccounts.map((account, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                }}
                className="w-full p-4 text-left bg-white hover:bg-gray-100 rounded-lg transition-all border border-gray-200 hover:border-gray-900 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm mb-1">
                      {account.role}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {account.branch} Branch
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all"
                  />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              These are demo accounts for testing. Each has different access
              levels and permissions.
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-8">
          © 2025 Savory POS. All rights reserved.
        </p>
      </div> */}

      {/* <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <details className="group">
          <summary className="text-sm font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
            <span>Quick Access ({demoAccounts.length} accounts)</span>
            <ArrowRight
              size={16}
              className="rotate-90 group-open:-rotate-90 transition-transform"
            />
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {demoAccounts.map((account, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                }}
                className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-all border border-gray-200"
              >
                <div className="font-medium text-gray-900 text-xs">
                  {account.role}
                </div>
                <div className="text-gray-500 text-[11px] mt-1">
                  {account.branch}
                </div>
              </button>
            ))}
          </div>
        </details>
      </div> */}
    </div>
  );
}
