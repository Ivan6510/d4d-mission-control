"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const ok = await login(name, code);
      if (ok) {
        router.push("/dashboard");
      } else {
        setError("Invalid name or code");
      }
    } catch {
      setError("Login failed — please try again");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-500">D4D</h1>
          <p className="text-dark-400 mt-2">Mission Control</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-900 rounded-xl p-6 border border-dark-700 space-y-4">
          <div>
            <label className="block text-sm text-dark-400 mb-1.5">Name</label>
            <select
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2.5 text-dark-200 focus:outline-none focus:border-brand-500"
              required
            >
              <option value="">Select your name</option>
              <option value="Ivan">Ivan</option>
              <option value="Bryce">Bryce</option>
              <option value="Jack">Jack</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-dark-400 mb-1.5">Access Code</label>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your code"
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2.5 text-dark-200 placeholder-dark-500 focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Enter Mission Control
          </button>
        </form>
      </div>
    </div>
  );
}
