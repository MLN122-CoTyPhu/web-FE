"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 1.5l2.35 5.1 5.55.55-4.15 3.75 1.25 5.4L10 13.4l-4.99 2.9 1.25-5.4-4.15-3.75 5.55-.55L10 1.5z"
        fill="#17100e"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="4.6" r="2.6" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path
        d="M3.5 1.5h6l3 3v10a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M9.5 1.5v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5 8.2h6M5 10.4h6M5 12.6h3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export default function SiteNav() {
  const pathname = usePathname();
  const isContent = pathname === "/";

  // Thanh nav "fixed" đè lên chữ khi cuộn trang dài (Nội Dung) — tự ẩn khi
  // cuộn xuống, hiện lại ngay khi cuộn lên hoặc gần đầu trang, để nhường chỗ
  // đọc nội dung thay vì che mất dòng đầu mỗi đoạn.
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const diff = y - lastY.current;
      if (y < 80) {
        setHidden(false);
      } else if (diff > 4) {
        setHidden(true);
      } else if (diff < -4) {
        setHidden(false);
      }
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pillStyle = (active: boolean) => ({
    fontFamily: "var(--font-content-sans, 'Inter', sans-serif)",
    fontSize: "13px",
    fontWeight: 700,
    padding: "9px 18px",
    borderRadius: "999px",
    border: `1.5px solid ${active ? "#c1121f" : "rgba(232,185,35,0.3)"}`,
    background: active ? "#c1121f" : "transparent",
    color: active ? "#fff" : "#e8b923",
  });

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[200] transition-transform duration-300 ease-out"
      style={{
        background: "rgba(15,10,8,0.96)",
        borderBottom: "2px solid #c1121f",
        backdropFilter: "blur(10px)",
        transform: hidden ? "translateY(-100%)" : "translateY(0)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <span
            className="flex-shrink-0 rounded-full flex items-center justify-center"
            style={{ width: "42px", height: "42px", background: "#e8b923" }}
          >
            <StarIcon />
          </span>
          <span className="min-w-0">
            <span
              className="block truncate"
              style={{
                fontFamily: "var(--font-content-serif, 'Inter', sans-serif)",
                fontSize: "17px",
                fontWeight: 700,
                color: "#ece2d4",
                lineHeight: 1.2,
              }}
            >
              Tư Bản Tài Chính &amp; Quyền Lực Mềm
            </span>
            <span
              className="hidden sm:block"
              style={{
                fontFamily: "var(--font-content-sans, 'Inter', sans-serif)",
                fontSize: "10.5px",
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "#e8b923",
                marginTop: "1px",
              }}
            >
              ĐỘC QUYỀN · BÀI HỌC CHO VIỆT NAM
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/" className="flex items-center gap-1.5" style={pillStyle(!!isContent)}>
            <DocIcon /> Nội Dung
          </Link>
          <Link href="/tro-choi" className="flex items-center gap-1.5" style={pillStyle(!isContent)}>
            <PersonIcon /> Trò Chơi
          </Link>
        </div>
      </div>
    </nav>
  );
}
