"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HTTP_BACKEND, WS_BACKEND } from "../config";

export function AuthPage({ isSignin }: { isSignin: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isSignin ? "/signin" : "/signup";
    const body = isSignin
      ? { username: email, password }
      : { username: email, password, name };

    console.log(`Sending request to ${HTTP_BACKEND}${endpoint}:`, body);

    try {
      const response = await fetch(`${HTTP_BACKEND}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers.get("Access-Control-Allow-Origin"));
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data || `Failed to ${isSignin ? "sign in" : "sign up"}`);
      }

      if (isSignin) {
        localStorage.setItem("token", data.token);
        router.push("/lobby");
      } else {
        router.push("/signin");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-gray-900">
      <div className="bg-gray-800 p-6 text-white rounded-3xl shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isSignin ? "Sign In" : "Sign Up"}
        </h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {!isSignin && (
          <div className="p-4">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full outline-none bg-gray-700 text-white placeholder:text-gray-400 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}
        <div className="p-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full outline-none bg-gray-700 text-white placeholder:text-gray-400 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="p-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full outline-none bg-gray-700 text-white placeholder:text-gray-400 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-8 bg-blue-500 text-white py-3 rounded-3xl hover:bg-blue-600 transition disabled:opacity-50"
        >
          {loading ? "Loading..." : isSignin ? "Sign In" : "Sign Up"}
        </button>
        <p className="text-center mt-4 text-gray-400">
          {isSignin ? "New user?" : "Already have an account?"}{" "}
          <Link
            href={isSignin ? "/signup" : "/signin"}
            className="text-blue-500 hover:underline"
          >
            {isSignin ? "Sign up" : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}