"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/adminApi";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminApi.login(password);
      router.push("/admin/rooms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "radial-gradient(ellipse at 50% 40%, #2a1710 0%, #17100e 70%)" }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm game-card p-6 space-y-4"
        style={{ border: "1px solid rgba(232,185,35,0.14)" }}
      >
        <h1
          className="text-xl font-bold text-center"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          🔐 Đăng nhập Admin
        </h1>

        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-ui)" }}
          >
            Mật khẩu
          </label>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: "var(--bg-surface-2)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-ui)",
            }}
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading || !password} className="btn-gold w-full py-3 text-base">
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
