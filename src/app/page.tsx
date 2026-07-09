"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameSocket } from "@/hooks/useGameSocket";
import type { PlayerRole } from "@/types/game";
import SiteNav from "@/components/SiteNav";

const ROLE_OPTIONS: { value: PlayerRole; label: string; desc: string; icon: string; accent: string; border: string }[] = [
  {
    value: "developing_country",
    label: "Nước Đang Phát Triển",
    desc: "Tự chủ cao, ít vốn ban đầu",
    icon: "🌏",
    accent: "rgba(30,144,255,0.15)",
    border: "#1E90FF",
  },
  {
    value: "vietnam",
    label: "Việt Nam",
    desc: "Điều tiết nhà nước — thẻ ưu tiên",
    icon: "🇻🇳",
    accent: "rgba(0,200,83,0.15)",
    border: "#00C853",
  },
  {
    value: "financial_capital",
    label: "Tư Bản Tài Chính",
    desc: "Nhiều vốn, ít tự chủ ban đầu",
    icon: "💰",
    accent: "rgba(255,140,0,0.15)",
    border: "#FF8C00",
  },
];

// Inline SVG decorations for floating background elements
function FloatingSvgCoin({ className }: { className: string }) {
  return (
    <svg className={className} width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="20" fill="rgba(232,185,35,0.12)" stroke="rgba(232,185,35,0.35)" strokeWidth="2"/>
      <circle cx="22" cy="22" r="14" fill="rgba(232,185,35,0.08)" stroke="rgba(232,185,35,0.2)" strokeWidth="1"/>
      <text x="22" y="27" textAnchor="middle" fill="rgba(232,185,35,0.5)" fontSize="14" fontWeight="bold">$</text>
    </svg>
  );
}

function FloatingSvgDice({ className }: { className: string }) {
  return (
    <svg className={className} width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="2" y="2" width="32" height="32" rx="7" fill="rgba(232,185,35,0.08)" stroke="rgba(232,185,35,0.3)" strokeWidth="1.5"/>
      <circle cx="10" cy="10" r="2.5" fill="rgba(232,185,35,0.4)"/>
      <circle cx="26" cy="26" r="2.5" fill="rgba(232,185,35,0.4)"/>
      <circle cx="18" cy="18" r="2.5" fill="rgba(232,185,35,0.4)"/>
    </svg>
  );
}

function FloatingSvgStar({ className }: { className: string }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M16 2l3.4 7.6 8.1.7-6 5.5 1.8 8-7.3-4.3-7.3 4.3 1.8-8-6-5.5 8.1-.7z"
        fill="rgba(232,185,35,0.15)" stroke="rgba(232,185,35,0.35)" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const { createRoom, joinRoom, isConnected, room } = useGameSocket();

  const [mode, setMode] = useState<"menu" | "create" | "join">("menu");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [role, setRole] = useState<PlayerRole>("developing_country");

  useEffect(() => {
    if (room) {
      router.push(`/room/${room.roomCode}`);
    }
  }, [room, router]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) { alert("Nhập tên người chơi"); return; }
    createRoom(playerName.trim(), role);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomCode.trim()) { alert("Nhập tên và mã phòng"); return; }
    joinRoom(roomCode.toUpperCase(), playerName.trim(), role);
  };

  return (
    <>
      <SiteNav />
      <div
      className="min-h-screen flex items-center justify-center p-4 pt-24 relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 40%, #2a1710 0%, #17100e 70%)" }}
    >
      {/* Floating decoration elements */}
      <FloatingSvgCoin className="absolute top-[12%] left-[8%] animate-float pointer-events-none" />
      <FloatingSvgDice className="absolute top-[20%] right-[10%] animate-float-1 pointer-events-none" />
      <FloatingSvgStar className="absolute bottom-[18%] left-[12%] animate-float-2 pointer-events-none" />
      <FloatingSvgCoin className="absolute bottom-[14%] right-[8%] animate-float-3 pointer-events-none" />
      <FloatingSvgStar className="absolute top-[50%] left-[5%] animate-float-1 pointer-events-none opacity-60" />
      <FloatingSvgDice className="absolute top-[60%] right-[6%] animate-float pointer-events-none opacity-60" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-gold-gradient mb-2 tracking-wide"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 8vw, 52px)" }}
          >
            ♔ Cờ Tỷ Phú
          </h1>
          <p style={{ fontFamily: "var(--font-ui)", color: "var(--text-secondary)" }}
            className="font-semibold text-sm tracking-widest uppercase">
            Toàn Cầu Hóa &amp; Tư Bản Tài Chính
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(139,163,204,0.5)" }}>
            Chương 4 — Mác-Lênin
          </p>

          {/* Connection indicator */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {isConnected ? "Đã kết nối server" : "Đang kết nối..."}
            </span>
          </div>
        </div>

        {/* Main card */}
        <div className="game-card p-6"
          style={{ border: "1px solid rgba(232,185,35,0.14)" }}>

          {/* ── MENU MODE ── */}
          {mode === "menu" && (
            <div className="space-y-3">
              <button
                onClick={() => setMode("create")}
                className="btn-gold w-full py-4 text-lg"
              >
                ✦ Tạo Phòng Mới
              </button>
              <button
                onClick={() => setMode("join")}
                className="w-full py-4 rounded-[14px] font-bold text-base transition-all"
                style={{
                  background: "transparent",
                  border: "1.5px solid rgba(232,185,35,0.35)",
                  color: "var(--gold-400)",
                  fontFamily: "var(--font-display)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,185,35,0.08)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                ◈ Vào Phòng Có Sẵn
              </button>

              {/* Game info */}
              <div className="mt-4 p-4 rounded-xl space-y-1.5 text-sm"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}>
                  📚 Về trò chơi
                </p>
                <p style={{ color: "var(--text-secondary)" }}>• 3 chỉ số: Tiền 💰 · Tự chủ 🏛️ · Quyền lực mềm ⭐</p>
                <p style={{ color: "var(--text-secondary)" }}>• Điểm = Tiền + Tự chủ×10 + Quyền lực mềm×5</p>
                <p style={{ color: "rgba(255,71,87,0.85)" }}>• Mất hết tự chủ = bị chi phối hoàn toàn</p>
              </div>
            </div>
          )}

          {/* ── CREATE / JOIN MODE ── */}
          {(mode === "create" || mode === "join") && (
            <div className="space-y-4">
              <h2 className="font-bold text-xl" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                {mode === "create" ? "✦ Tạo Phòng Mới" : "◈ Vào Phòng"}
              </h2>

              {/* Player name input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--text-secondary)", fontFamily: "var(--font-ui)" }}>
                  Tên người chơi
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên của bạn..."
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (mode === "create" ? handleCreateRoom() : handleJoinRoom())}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "var(--bg-surface-2)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-ui)",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "rgba(232,185,35,0.5)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,185,35,0.12)";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Room code input (join mode) */}
              {mode === "join" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: "var(--text-secondary)", fontFamily: "var(--font-ui)" }}>
                    Mã phòng
                  </label>
                  <input
                    type="text"
                    placeholder="VD: ABC123"
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all uppercase"
                    style={{
                      background: "var(--bg-surface-2)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "var(--gold-400)",
                      fontFamily: "var(--font-code)",
                      letterSpacing: "0.2em",
                      fontWeight: 700,
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = "rgba(232,185,35,0.5)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,185,35,0.12)";
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              )}

              {/* Role selection */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-secondary)", fontFamily: "var(--font-ui)" }}>
                  Chọn vai của bạn
                </p>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map(opt => {
                    const isSelected = role === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setRole(opt.value)}
                        className="w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3"
                        style={{
                          background: isSelected ? opt.accent : "rgba(255,255,255,0.03)",
                          border: `1.5px solid ${isSelected ? opt.border : "rgba(255,255,255,0.08)"}`,
                          transform: isSelected ? "scale(1.01)" : "scale(1)",
                          boxShadow: isSelected ? `0 0 14px ${opt.border}28` : "none",
                        }}
                      >
                        <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-sm" style={{
                            color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                            fontFamily: "var(--font-ui)",
                          }}>
                            {opt.label}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: "rgba(139,163,204,0.7)" }}>
                            {opt.desc}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="ml-auto flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: opt.border }}>
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4l3 3 5-6" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={mode === "create" ? handleCreateRoom : handleJoinRoom}
                disabled={!isConnected}
                className="btn-gold w-full py-4 text-base mt-2"
              >
                {mode === "create" ? "Tạo Phòng" : "Vào Phòng"}
              </button>

              {/* Back button */}
              <button
                onClick={() => setMode("menu")}
                className="w-full py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "var(--text-secondary)",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"}
              >
                ← Quay Lại
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
