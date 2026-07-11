"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/adminApi";

const NAV_ITEMS = [
  { href: "/admin/rooms", label: "Danh sách phòng" },
  { href: "/admin/winners", label: "Phát thưởng" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [status, setStatus] = useState<"checking" | "ok" | "unauthorized">("checking");

  useEffect(() => {
    if (isLoginPage) return;
    adminApi
      .me()
      .then(() => setStatus("ok"))
      .catch(() => {
        setStatus("unauthorized");
        router.push("/admin/login");
      });
  }, [isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;

  if (status !== "ok") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#17100e", color: "var(--text-secondary)" }}
      >
        {status === "checking" ? "Đang kiểm tra đăng nhập..." : "Đang chuyển đến trang đăng nhập..."}
      </div>
    );
  }

  const handleLogout = async () => {
    await adminApi.logout();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen" style={{ background: "#17100e", color: "var(--text-primary)" }}>
      <nav
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3"
        style={{ background: "rgba(15,10,8,0.96)", borderBottom: "2px solid #c1121f" }}
      >
        <div className="flex items-center gap-5">
          <span className="font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--gold-400)" }}>
            ⚙ Admin — Cờ Tỷ Phú
          </span>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold"
              style={{ color: pathname?.startsWith(item.href) ? "var(--gold-400)" : "var(--text-secondary)" }}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1.5 rounded-lg"
          style={{ border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-secondary)" }}
        >
          Đăng xuất
        </button>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
