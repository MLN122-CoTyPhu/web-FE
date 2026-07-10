"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGameSocket } from "@/hooks/useGameSocket";
import { BOARD_CELLS, CELL_COLORS, CELL_TYPE_LABELS, type BoardCellFull } from "@/data/boardData";
import type { Player, EventCard, VoteSession, QuizSession, QuizResult, PlayerRole } from "@/types/game";

// ─── Score helpers ───────────────────────────────────────────────────────────
// Điểm = Tiền + Giá trị tài sản đã thâu tóm + Tự chủ×10 + Quyền lực mềm×5
function ownedAssetValue(player: Player): number {
  return player.ownedCells.reduce((sum, id) => {
    const cell = BOARD_CELLS.find(c => c.id === id);
    return sum + (cell?.price ?? 0);
  }, 0);
}
function computeScore(player: Player): number {
  return player.money + ownedAssetValue(player) + player.autonomy * 10 + player.softPower * 5;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TOKEN_COLORS = [
  "bg-yellow-400", "bg-pink-500", "bg-cyan-400",
  "bg-lime-400",   "bg-purple-400", "bg-orange-400",
];

// Maps Tailwind bg class → index for CSS glow classes
const TOKEN_COLOR_TO_INDEX: Record<string, number> = {
  "bg-yellow-400": 0,
  "bg-pink-500":   1,
  "bg-cyan-400":   2,
  "bg-lime-400":   3,
  "bg-purple-400": 4,
  "bg-orange-400": 5,
};

const ROLE_LABELS: Record<PlayerRole, string> = {
  vietnam:             "🇻🇳 Việt Nam",
  developing_country:  "🌏 Đang Phát Triển",
  financial_capital:   "💰 Tư Bản Tài Chính",
};

const ROLE_COLORS: Record<string, string> = {
  vietnam:            "#00C853",
  developing_country: "#1E90FF",
  financial_capital:  "#FF8C00",
};

// Monopoly perimeter positions (1-indexed CSS grid)
const CELL_POSITIONS: Array<{ row: number; col: number }> = [
  // Bottom row left→right: cells 0–10
  ...Array.from({ length: 11 }, (_, i) => ({ row: 11, col: i + 1 })),
  // Right col bottom→top: cells 11–19
  ...Array.from({ length: 9 },  (_, i) => ({ row: 10 - i, col: 11 })),
  // Top row right→left: cells 20–30
  ...Array.from({ length: 11 }, (_, i) => ({ row: 1, col: 11 - i })),
  // Left col top→bottom: cells 31–39
  ...Array.from({ length: 9 },  (_, i) => ({ row: 2 + i, col: 1 })),
];

const CORNER_IDS = new Set([0, 10, 20, 30]);

// Property strip colors by cell type
const STRIP_COLORS: Record<string, string> = {
  financial_capital: "#FF3B3B",
  conglomerate:      "#FF8C00",
  consortium:        "#B44FFF",
  tnc:               "#1E90FF",
  vietnam:           "#00C853",
  crisis:            "#FF1744",
  start:             "#e8b923",
  free:              "#00BFA5",
};

// Dice dot patterns: 3×3 grid (row-major), true = show dot
const DICE_DOTS: Record<number, boolean[]> = {
  0: [false,false,false, false,false,false, false,false,false],
  1: [false,false,false, false,true, false, false,false,false],
  2: [false,false,true,  false,false,false, true, false,false],
  3: [false,false,true,  false,true, false, true, false,false],
  4: [true, false,true,  false,false,false, true, false,true ],
  5: [true, false,true,  false,true, false, true, false,true ],
  6: [true, false,true,  true, false,true,  true, false,true ],
};

// ─── Small components ─────────────────────────────────────────────────────────

function DiceFace({ value, rolling }: { value: number; rolling?: boolean }) {
  const clampedVal = Math.min(6, Math.max(0, value));
  const dots = DICE_DOTS[clampedVal] ?? DICE_DOTS[0];
  return (
    <div
      className={`dice-face${rolling ? " rolling" : clampedVal > 0 ? " result" : ""}`}
      style={clampedVal === 0 ? { opacity: 0.3 } : undefined}
    >
      <div className="dice-grid">
        {dots.map((show, i) => (
          <div key={i}>
            {show && <div className="dice-dot" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatBar({ value, color }: { value: number; color: string }) {
  const gradientMap: Record<string, string> = {
    "bg-blue-500":   "linear-gradient(90deg, #1565C0, #42A5F5)",
    "bg-red-500":    "linear-gradient(90deg, #B71C1C, #EF5350)",
    "bg-purple-500": "linear-gradient(90deg, #7B1FA2, #CE93D8)",
  };
  const gradient = gradientMap[color] ?? "linear-gradient(90deg, #555, #888)";
  return (
    <div className="stat-bar-track">
      <div
        className="stat-bar-fill"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: gradient,
        }}
      />
    </div>
  );
}

function PlayerPanel({
  player, isCurrent, isMe,
}: { player: Player; isCurrent: boolean; tokenColor: string; isMe: boolean }) {
  const score = computeScore(player);
  const roleColor = ROLE_COLORS[player.role] ?? "#8BA3CC";

  return (
    <div
      className={`rounded-2xl p-3 transition-all duration-300 ${isCurrent ? "game-card-active" : "game-card"}`}
      style={{
        background: isCurrent
          ? "linear-gradient(135deg, #3a2015 0%, #2c1810 100%)"
          : "var(--bg-surface-1)",
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-2.5">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-lg"
          style={{
            background: `${roleColor}18`,
            border: `2px solid ${roleColor}45`,
            boxShadow: `0 0 10px ${roleColor}28`,
          }}
        >
          {player.role === "vietnam" ? "🇻🇳"
            : player.role === "financial_capital" ? "💰"
            : "🌏"}
        </div>

        {/* Name + role */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-sm font-bold truncate"
              style={{
                color: isCurrent ? "var(--gold-300)" : "var(--text-primary)",
                fontFamily: "var(--font-ui)",
              }}
            >
              {isCurrent && "▶ "}{player.name}
            </span>
            {isMe && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}>
                bạn
              </span>
            )}
            {!player.isActive && (
              <span className="text-[10px] font-bold text-red-400 ml-auto">⚠ mất KN</span>
            )}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: roleColor }}>
            {ROLE_LABELS[player.role] ?? player.role}
          </div>
        </div>

        {/* Score */}
        <div className="text-right flex-shrink-0">
          <div
            className="text-xs font-bold"
            style={{ color: "var(--gold-400)", fontFamily: "var(--font-code)" }}
          >
            {score}pt
          </div>
          <div className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
            Ô {player.position}
          </div>
        </div>
      </div>

      {/* Penalty badge */}
      {player.skipTurns > 0 && (
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg mb-2 text-[11px] font-semibold"
          style={{
            background: "rgba(255,23,68,0.12)",
            border: "1px solid rgba(255,23,68,0.25)",
            color: "#FF6B7A",
          }}
        >
          <span>⛓</span>
          <span>BỊ KIỂM SOÁT — còn {player.skipTurns} lượt</span>
        </div>
      )}

      {/* Money */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>💰 Tiền</span>
        <span
          className="text-sm font-bold"
          style={{ color: "#00E676", fontFamily: "var(--font-code)" }}
        >
          ${player.money.toLocaleString()}
        </span>
      </div>

      {/* Owned cells (thâu tóm) */}
      {player.ownedCells.length > 0 && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>🏭 Đã thâu tóm</span>
          <span className="text-xs font-bold" style={{ color: "var(--gold-400)" }}>
            {player.ownedCells.length} ô &middot; ${ownedAssetValue(player).toLocaleString()}
          </span>
        </div>
      )}

      {/* Autonomy */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>🏛️ Tự chủ</span>
        <span
          className="text-[11px] font-bold"
          style={{
            color: player.autonomy < 30 ? "#FF1744" : "#42A5F5",
            fontFamily: "var(--font-code)",
          }}
        >
          {player.autonomy}/100
        </span>
      </div>
      <StatBar value={player.autonomy} color={player.autonomy < 30 ? "bg-red-500" : "bg-blue-500"} />

      {/* Quyền lực mềm */}
      <div className="flex items-center justify-between mb-1 mt-2">
        <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>⭐ Sức mạnh</span>
        <span
          className="text-[11px] font-bold"
          style={{ color: "#CE93D8", fontFamily: "var(--font-code)" }}
        >
          {player.softPower}/100
        </span>
      </div>
      <StatBar value={player.softPower} color="bg-purple-500" />
    </div>
  );
}

function BoardCell({
  cell, index, players, tokenColors, isMyPosition,
  visualPositions, pendingPlayerId, onTokenClick, cellOwners,
}: {
  cell: typeof BOARD_CELLS[0];
  index: number;
  players: Player[];
  tokenColors: Record<string, string>;
  isMyPosition: boolean;
  visualPositions: Record<string, number>;
  pendingPlayerId: string | null;
  onTokenClick: () => void;
  cellOwners: Record<number, string>;
}) {
  const ownerId = cell.ownable ? cellOwners[cell.id] : undefined;
  const ownerColor = ownerId ? (tokenColors[ownerId] ?? "bg-white") : undefined;
  const pos     = CELL_POSITIONS[index];
  const isLeft  = pos.col === 1  && pos.row !== 1 && pos.row !== 11;
  const isRight = pos.col === 11 && pos.row !== 1 && pos.row !== 11;
  const isCorner = CORNER_IDS.has(index);
  const colors   = CELL_COLORS[cell.type] ?? CELL_COLORS.free;

  const stripColor = STRIP_COLORS[cell.type] ?? "#555";
  const stripDir   = isCorner ? "" : (
    pos.row === 11 ? "prop-strip-bottom" :
    pos.row === 1  ? "prop-strip-top"    :
    pos.col === 1  ? "prop-strip-left"   :
    pos.col === 11 ? "prop-strip-right"  : ""
  );

  const playersHere = players.filter(p => (visualPositions[p.id] ?? p.position) === index);

  const emoji   = [...cell.name].slice(0, 2).join("").trim();
  const rawName = cell.name.replace(/^[\p{Emoji}\s]+/u, "").trim();
  const shortName = rawName.split(" — ")[0];

  const baseClass = `border ${colors} relative flex select-none group
    ${isMyPosition ? "ring-2 ring-white/60 ring-offset-1 ring-offset-[#17100e] z-10" : ""}
    ${isCorner ? "items-center justify-center" : ""}
  `;

  const Tooltip = () => (
    <div className="cell-tooltip">{cell.name}</div>
  );

  const TokenBadges = () => (
    <>
      {playersHere.map(p => {
        const isPending = p.id === pendingPlayerId;
        const colorIdx  = TOKEN_COLOR_TO_INDEX[tokenColors[p.id]] ?? 0;
        const glowClass = isPending
          ? `token-glow-pending-${colorIdx}`
          : `token-glow-${colorIdx}`;
        return (
          <div
            key={p.id}
            onClick={isPending ? onTokenClick : undefined}
            title={isPending ? `${p.name} — Bấm để đi!` : p.name}
            className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center
              text-[7px] font-black text-white flex-shrink-0 transition-all
              ${tokenColors[p.id]}
              ${glowClass}
              ${isPending
                ? "border-white animate-bounce cursor-pointer z-20 scale-110"
                : "border-white/80"}
            `}
          >
            {p.name[0]?.toUpperCase()}
          </div>
        );
      })}
    </>
  );

  const OwnerMark = () => {
    if (!cell.ownable) return null;
    if (ownerId) {
      return (
        <div
          className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full border border-white/70 z-10 ${ownerColor}`}
          title="Đã bị thâu tóm"
        />
      );
    }
    return (
      <div
        className="absolute bottom-0 left-0 right-0 text-center leading-none pb-px"
        style={{ color: "#e8b923", fontSize: "6px", fontWeight: 700 }}
      >
        ${cell.price}
      </div>
    );
  };

  if (isCorner) {
    return (
      <div className={baseClass} style={{ gridRow: pos.row, gridColumn: pos.col }}>
        <Tooltip />
        <OwnerMark />
        <div className="text-center p-1 flex flex-col items-center gap-0.5">
          <div className="text-xl leading-none">{emoji}</div>
          <div className="text-[10px] font-bold leading-tight line-clamp-2">{shortName}</div>
          {playersHere.length > 0 && (
            <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
              <TokenBadges />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLeft || isRight) {
    return (
      <div
        className={`${baseClass} flex-col items-center justify-center`}
        style={{ gridRow: pos.row, gridColumn: pos.col }}
      >
        <Tooltip />
        <OwnerMark />
        {stripDir && (
          <div className={`prop-strip ${stripDir}`} style={{ background: stripColor }} />
        )}
        {playersHere.length > 0 && (
          <div className="absolute top-0.5 right-0.5 flex flex-col gap-0.5 z-10">
            <TokenBadges />
          </div>
        )}
        <div className="text-[11px] leading-none mb-px">{emoji}</div>
        <div className="text-[8px] font-medium text-center leading-tight px-0.5 break-words w-full line-clamp-4 overflow-hidden">
          {shortName}
        </div>
      </div>
    );
  }

  const isBottom = pos.row === 11;
  return (
    <div
      className={`${baseClass} flex-col justify-center items-center`}
      style={{ gridRow: pos.row, gridColumn: pos.col }}
    >
      <Tooltip />
      <OwnerMark />
      {stripDir && (
        <div className={`prop-strip ${stripDir}`} style={{ background: stripColor }} />
      )}
      <div className="text-[12px] leading-none">{emoji}</div>
      <div className="text-[9px] font-medium text-center leading-tight px-0.5 line-clamp-3 w-full">
        {shortName}
      </div>
      {playersHere.length > 0 && (
        <div className={`absolute flex flex-wrap gap-0.5 justify-center
          ${isBottom ? "top-1" : "bottom-1"} left-0 right-0 px-0.5`}>
          <TokenBadges />
        </div>
      )}
    </div>
  );
}

// ─── Cell Landing Modal ───────────────────────────────────────────────────────

function CellLandingModal({ cell, ownerName, isMine, onClose }: {
  cell: BoardCellFull;
  ownerName?: string;
  isMine?: boolean;
  onClose: () => void;
}) {
  const typeLabel = CELL_TYPE_LABELS[cell.type] ?? cell.type;

  const typeGradient: Record<string, string> = {
    financial_capital: "linear-gradient(160deg, #3D0000 0%, #1A0000 100%)",
    conglomerate:      "linear-gradient(160deg, #3D1A00 0%, #1A0C00 100%)",
    consortium:        "linear-gradient(160deg, #1E0038 0%, #0D0020 100%)",
    tnc:               "linear-gradient(160deg, #00204A 0%, #000F28 100%)",
    vietnam:           "linear-gradient(160deg, #002800 0%, #001200 100%)",
    crisis:            "linear-gradient(160deg, #3D0000 0%, #0D0000 100%)",
    start:             "linear-gradient(160deg, #3A2800 0%, #1A1000 100%)",
    free:              "linear-gradient(160deg, #1A2A3A 0%, #0A1220 100%)",
  };

  const typeBorderColor: Record<string, string> = {
    financial_capital: "#FF3B3B",
    conglomerate:      "#FF8C00",
    consortium:        "#B44FFF",
    tnc:               "#1E90FF",
    vietnam:           "#00C853",
    crisis:            "#FF1744",
    start:             "#e8b923",
    free:              "#00BFA5",
  };

  const badgeColor: Record<string, { bg: string; text: string }> = {
    financial_capital: { bg: "rgba(255,59,59,0.25)",   text: "#FF8080" },
    conglomerate:      { bg: "rgba(255,140,0,0.25)",   text: "#FFA040" },
    consortium:        { bg: "rgba(180,79,255,0.25)",  text: "#D090FF" },
    tnc:               { bg: "rgba(30,144,255,0.25)",  text: "#70B8FF" },
    vietnam:           { bg: "rgba(0,200,83,0.25)",    text: "#40E090" },
    crisis:            { bg: "rgba(255,23,68,0.3)",    text: "#FF7090" },
    start:             { bg: "rgba(232,185,35,0.25)",  text: "#f0cf6b" },
    free:              { bg: "rgba(0,191,165,0.25)",   text: "#60E0D0" },
  };

  const bg   = typeGradient[cell.type]   ?? typeGradient.free;
  const bdr  = typeBorderColor[cell.type] ?? "#555";
  const bdg  = badgeColor[cell.type]     ?? badgeColor.free;
  const fx   = cell.effect;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="animate-modal-entrance w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: bg,
          border: `1.5px solid ${bdr}50`,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 24px 70px rgba(0,0,0,0.85), 0 0 60px ${bdr}15`,
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: bdg.bg, color: bdg.text }}
          >
            {typeLabel}
          </span>
          <h3
            className="text-xl font-bold text-white mt-3 leading-snug"
            style={{ fontFamily: "var(--font-display)", textShadow: `0 0 20px ${bdr}40` }}
          >
            {cell.name}
          </h3>
          <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "rgba(200,216,240,0.8)" }}>
            {cell.description}
          </p>
        </div>

        {/* Ownable — quiz để thâu tóm / phí thuê */}
        {cell.ownable && (
          <div
            className="mx-5 mb-3 rounded-xl p-3 space-y-1.5"
            style={{ background: "rgba(0,0,0,0.38)", border: "1px solid rgba(232,185,35,0.2)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: "var(--gold-400)" }}>
              🏭 Tài sản có thể thâu tóm
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "rgba(200,216,240,0.9)" }}>💰 Giá mua</span>
              <span className="text-sm font-bold" style={{ color: "var(--gold-300)", fontFamily: "var(--font-code)" }}>
                ${cell.price}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "rgba(200,216,240,0.9)" }}>💸 Phí thuê</span>
              <span className="text-sm font-bold" style={{ color: "#FF8080", fontFamily: "var(--font-code)" }}>
                ${cell.rent}
              </span>
            </div>
            {ownerName ? (
              <div className="text-xs pt-1.5" style={{ color: isMine ? "#40E090" : "#FF6B7A" }}>
                {isMine ? "✅ Bạn đã thâu tóm ô này" : `🔒 Đã bị thâu tóm bởi ${ownerName}`}
              </div>
            ) : (
              <div className="text-xs pt-1.5" style={{ color: "rgba(139,163,204,0.7)" }}>
                ❓ Chưa có chủ — trả lời đúng câu hỏi để mua
              </div>
            )}
          </div>
        )}

        {/* Effects */}
        {(fx.money || fx.autonomy || fx.softPower || fx.drawCard || fx.councilVote) && (
          <div
            className="mx-5 mb-3 rounded-xl p-3 space-y-2"
            style={{ background: "rgba(0,0,0,0.38)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: "rgba(139,163,204,0.7)" }}>
              Hiệu ứng
            </p>
            {fx.money !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "rgba(200,216,240,0.9)" }}>💰 Tiền</span>
                <span
                  className="text-sm font-bold px-3 py-0.5 rounded-full"
                  style={{
                    background: fx.money >= 0 ? "rgba(0,230,118,0.15)" : "rgba(255,23,68,0.15)",
                    color:      fx.money >= 0 ? "#00E676"               : "#FF4466",
                    fontFamily: "var(--font-code)",
                  }}
                >
                  {fx.money >= 0 ? "+" : ""}{fx.money}$
                </span>
              </div>
            )}
            {fx.autonomy !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "rgba(200,216,240,0.9)" }}>🏛️ Tự chủ</span>
                <span
                  className="text-sm font-bold px-3 py-0.5 rounded-full"
                  style={{
                    background: fx.autonomy >= 0 ? "rgba(30,144,255,0.15)" : "rgba(255,100,0,0.15)",
                    color:      fx.autonomy >= 0 ? "#40C4FF"               : "#FFAB40",
                    fontFamily: "var(--font-code)",
                  }}
                >
                  {fx.autonomy >= 0 ? "+" : ""}{fx.autonomy}
                </span>
              </div>
            )}
            {fx.softPower !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "rgba(200,216,240,0.9)" }}>⭐ Sức mạnh mềm</span>
                <span
                  className="text-sm font-bold px-3 py-0.5 rounded-full"
                  style={{
                    background: fx.softPower >= 0 ? "rgba(180,79,255,0.15)" : "rgba(255,23,68,0.15)",
                    color:      fx.softPower >= 0 ? "#CE93D8"               : "#FF6B8A",
                    fontFamily: "var(--font-code)",
                  }}
                >
                  {fx.softPower >= 0 ? "+" : ""}{fx.softPower}
                </span>
              </div>
            )}
            {fx.drawCard && (
              <div className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: "var(--gold-300)" }}>
                <span>🃏</span><span>Rút thẻ vận mệnh</span>
              </div>
            )}
            {fx.councilVote && (
              <div className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: "#CE93D8" }}>
                <span>🗳️</span><span>Triệu tập hội đồng tư vấn</span>
              </div>
            )}
            {fx.allPlayers && (
              <div
                className="text-xs pt-2 border-t flex items-center gap-1.5"
                style={{ borderColor: "rgba(255,255,255,0.08)", color: "#FF6B7A" }}
              >
                <span>⚠️</span><span>Áp dụng cho tất cả người chơi</span>
              </div>
            )}
          </div>
        )}

        {/* Knowledge */}
        <div
          className="mx-5 mb-4 rounded-xl p-3.5"
          style={{
            background: "rgba(0,0,0,0.22)",
            borderLeft: "3px solid rgba(232,185,35,0.5)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
            style={{ color: "var(--gold-400)" }}>
            📚 Kiến thức Chương 4
          </p>
          <p className="text-sm font-bold text-white mb-1.5"
            style={{ fontFamily: "var(--font-ui)" }}>
            {cell.knowledge.concept}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(139,163,204,0.85)" }}>
            {cell.knowledge.explanation}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 font-bold text-sm transition-all"
          style={{
            background: "rgba(255,255,255,0.07)",
            color: "rgba(240,244,255,0.9)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.13)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"}
        >
          Đã hiểu ✓
        </button>
      </div>
    </div>
  );
}

// ─── Card Modal ───────────────────────────────────────────────────────────────

function CardModal({ card, onClose }: { card: EventCard; onClose: () => void }) {
  const styles: Record<string, { bg: string; border: string; badge: { bg: string; text: string }; label: string }> = {
    state_policy: {
      bg:     "linear-gradient(160deg, #00280A 0%, #001205 100%)",
      border: "#00C853",
      badge:  { bg: "rgba(0,200,83,0.22)", text: "#40E090" },
      label:  "🏛️ Chính sách Nhà nước",
    },
    financial_capital: {
      bg:     "linear-gradient(160deg, #3D0000 0%, #1A0000 100%)",
      border: "#FF3B3B",
      badge:  { bg: "rgba(255,59,59,0.22)", text: "#FF8080" },
      label:  "💰 Tư bản Tài chính",
    },
    globalization: {
      bg:     "linear-gradient(160deg, #00204A 0%, #000F28 100%)",
      border: "#1E90FF",
      badge:  { bg: "rgba(30,144,255,0.22)", text: "#70B8FF" },
      label:  "🌐 Toàn cầu hóa",
    },
  };

  const s = styles[card.type] ?? styles.globalization;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="animate-card-flip-in w-full max-w-xs rounded-2xl overflow-hidden"
        style={{
          background: s.bg,
          border: `1.5px solid ${s.border}45`,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 24px 70px rgba(0,0,0,0.85), 0 0 50px ${s.border}15`,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: s.badge.bg, color: s.badge.text }}
          >
            {s.label}
          </span>
          <h3
            className="text-xl font-bold text-white mt-3"
            style={{ fontFamily: "var(--font-display)", textShadow: `0 0 16px ${s.border}40` }}
          >
            {card.title}
          </h3>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: "rgba(200,216,240,0.85)" }}>
            {card.description}
          </p>
        </div>

        {/* Effects */}
        <div
          className="mx-5 mb-4 rounded-xl p-3 space-y-2"
          style={{ background: "rgba(0,0,0,0.32)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {card.effect.money !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "rgba(200,216,240,0.9)" }}>💰 Tiền</span>
              <span
                className="text-sm font-bold px-3 py-0.5 rounded-full"
                style={{
                  background: card.effect.money >= 0 ? "rgba(0,230,118,0.15)" : "rgba(255,23,68,0.15)",
                  color:      card.effect.money >= 0 ? "#00E676"               : "#FF4466",
                  fontFamily: "var(--font-code)",
                }}
              >
                {card.effect.money >= 0 ? "+" : ""}{card.effect.money}$
              </span>
            </div>
          )}
          {card.effect.autonomy !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "rgba(200,216,240,0.9)" }}>🏛️ Tự chủ</span>
              <span
                className="text-sm font-bold px-3 py-0.5 rounded-full"
                style={{
                  background: card.effect.autonomy >= 0 ? "rgba(30,144,255,0.15)" : "rgba(255,100,0,0.15)",
                  color:      card.effect.autonomy >= 0 ? "#40C4FF"               : "#FFAB40",
                  fontFamily: "var(--font-code)",
                }}
              >
                {card.effect.autonomy >= 0 ? "+" : ""}{card.effect.autonomy}
              </span>
            </div>
          )}
          {card.effect.softPower !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "rgba(200,216,240,0.9)" }}>⭐ Quyền Lực Mềm</span>
              <span
                className="text-sm font-bold px-3 py-0.5 rounded-full"
                style={{
                  background: card.effect.softPower >= 0 ? "rgba(180,79,255,0.15)" : "rgba(255,23,68,0.15)",
                  color:      card.effect.softPower >= 0 ? "#CE93D8"               : "#FF6B8A",
                  fontFamily: "var(--font-code)",
                }}
              >
                {card.effect.softPower >= 0 ? "+" : ""}{card.effect.softPower}
              </span>
            </div>
          )}
          {card.effect.allPlayers && (
            <div
              className="text-xs pt-2 border-t flex items-center gap-1.5"
              style={{ borderColor: "rgba(255,255,255,0.08)", color: "#FFAB40" }}
            >
              <span>⚠️</span><span>Áp dụng cho tất cả người chơi</span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 font-bold text-sm transition-all"
          style={{
            background: "rgba(255,255,255,0.07)",
            color: "rgba(240,244,255,0.9)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.13)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"}
        >
          Đã hiểu ✓
        </button>
      </div>
    </div>
  );
}

function EffectBadges({ effect }: { effect: { money?: number; autonomy?: number; softPower?: number } }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {effect.money !== undefined && (
        <span
          className="text-[11px] px-2 py-0.5 rounded-full font-bold"
          style={{
            background: effect.money >= 0 ? "rgba(0,230,118,0.15)" : "rgba(255,23,68,0.15)",
            color:      effect.money >= 0 ? "#00E676"               : "#FF4466",
            fontFamily: "var(--font-code)",
          }}
        >
          {effect.money >= 0 ? "+" : ""}{effect.money}$
        </span>
      )}
      {effect.autonomy !== undefined && (
        <span
          className="text-[11px] px-2 py-0.5 rounded-full font-bold"
          style={{
            background: effect.autonomy >= 0 ? "rgba(30,144,255,0.15)" : "rgba(255,100,0,0.15)",
            color:      effect.autonomy >= 0 ? "#40C4FF"               : "#FFAB40",
            fontFamily: "var(--font-code)",
          }}
        >
          {effect.autonomy >= 0 ? "+" : ""}{effect.autonomy} Tự chủ
        </span>
      )}
      {effect.softPower !== undefined && (
        <span
          className="text-[11px] px-2 py-0.5 rounded-full font-bold"
          style={{
            background: effect.softPower >= 0 ? "rgba(180,79,255,0.15)" : "rgba(255,23,68,0.15)",
            color:      effect.softPower >= 0 ? "#CE93D8"               : "#FF6B8A",
            fontFamily: "var(--font-code)",
          }}
        >
          {effect.softPower >= 0 ? "+" : ""}{effect.softPower} Sức mạnh
        </span>
      )}
    </div>
  );
}

function VoteModal({ vote, onVote, totalPlayers }: {
  vote: VoteSession;
  onVote: (i: number) => void;
  totalPlayers: number;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const totalVoted = Object.keys(vote.votes).length;
  const effects = [vote.acceptEffect, vote.refuseEffect];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="animate-modal-entrance w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #180028 0%, #0D0020 100%)",
          border: "1.5px solid rgba(180,79,255,0.4)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 70px rgba(0,0,0,0.85), 0 0 60px rgba(180,79,255,0.12)",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🗳️</span>
            <span
              className="font-bold text-sm uppercase tracking-widest"
              style={{ color: "#CE93D8" }}
            >
              Hội đồng Tư vấn
            </span>
          </div>
          <div
            className="rounded-xl px-4 py-3 mb-3"
            style={{
              background: "rgba(180,79,255,0.1)",
              border: "1px solid rgba(180,79,255,0.2)",
            }}
          >
            <p className="font-bold text-sm mb-1" style={{ color: "#D090FF" }}>
              📍 {vote.cellName}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(200,216,240,0.75)" }}>
              {vote.cellDescription}
            </p>
          </div>
          <p className="font-semibold text-base leading-snug" style={{ color: "var(--text-primary)" }}>
            {vote.question}
          </p>
        </div>

        {/* Options */}
        <div className="px-6 pb-4 space-y-2.5">
          {vote.options.map((opt, i) => {
            const isAccept    = i === 0;
            const colorActive = isAccept ? "#00C853" : "#FF3B3B";
            const isChosen    = selected === i;
            const isDisabled  = selected !== null && !isChosen;
            return (
              <button
                key={i}
                onClick={() => { setSelected(i); onVote(i); }}
                disabled={selected !== null}
                className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                style={{
                  background: isChosen
                    ? `${colorActive}18`
                    : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${isChosen ? colorActive : "rgba(255,255,255,0.1)"}`,
                  color: isDisabled ? "rgba(139,163,204,0.4)" : "var(--text-primary)",
                  cursor: selected !== null ? "not-allowed" : "pointer",
                  opacity: isDisabled ? 0.5 : 1,
                }}
                onMouseEnter={e => {
                  if (selected === null)
                    (e.currentTarget as HTMLButtonElement).style.borderColor = colorActive + "60";
                }}
                onMouseLeave={e => {
                  if (!isChosen)
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                <span className="font-semibold">{opt}</span>
                {effects[i] && <EffectBadges effect={effects[i]} />}
              </button>
            );
          })}
        </div>

        {/* Progress */}
        <div className="px-6 pb-5">
          <div className="flex items-center justify-between text-xs mb-2"
            style={{ color: "var(--text-secondary)" }}>
            <span>{totalVoted}/{totalPlayers} phiếu đã bỏ</span>
            <span style={{ color: selected !== null ? "#00E676" : "var(--text-secondary)" }}>
              {selected !== null ? "✅ Đã biểu quyết" : "Chờ tất cả biểu quyết..."}
            </span>
          </div>
          <div className="stat-bar-track">
            <div
              className="stat-bar-fill"
              style={{
                width: `${(totalVoted / Math.max(1, totalPlayers)) * 100}%`,
                background: "linear-gradient(90deg, #7B1FA2, #CE93D8)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quiz Modal (thâu tóm bằng câu hỏi) ──────────────────────────────────────

function QuizModal({ quiz, myPlayerId, playerName, onAnswer, onReady }: {
  quiz: QuizSession;
  myPlayerId: string | undefined;
  playerName: string;
  onAnswer: (i: number) => void;
  onReady: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((quiz.expiresAt - Date.now()) / 1000)));
  const isMe = quiz.playerId === myPlayerId;
  const letters = ["A", "B", "C", "D"];
  const timeUp = remaining <= 0;
  const urgent = remaining <= 5;

  // Modal chỉ mount đúng lúc câu hỏi thật sự hiển thị cho người chơi (sau khi đã
  // đóng modal thông tin ô) — báo cho server bắt đầu đếm 15s từ đây, không tính
  // thời gian đọc phần giải thích trước đó.
  useEffect(() => {
    if (isMe) onReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.ceil((quiz.expiresAt - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 250);
    return () => clearInterval(iv);
  }, [quiz.expiresAt]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="animate-modal-entrance w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #241800 0%, #140D00 100%)",
          border: "1.5px solid rgba(232,185,35,0.45)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 70px rgba(0,0,0,0.85), 0 0 60px rgba(232,185,35,0.12)",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">❓</span>
            <span className="font-bold text-sm uppercase tracking-widest" style={{ color: "var(--gold-400)" }}>
              Câu Hỏi Thâu Tóm
            </span>
            <span
              className="ml-auto flex-shrink-0 flex items-center justify-center rounded-full font-bold"
              style={{
                width: "34px",
                height: "34px",
                fontSize: "13px",
                fontFamily: "var(--font-code)",
                color: urgent ? "#FF6B7A" : "var(--gold-300)",
                border: `2px solid ${urgent ? "#FF3B3B" : "var(--gold-400)"}`,
                background: urgent ? "rgba(255,23,68,0.12)" : "rgba(232,185,35,0.1)",
                transition: "color 0.2s, border-color 0.2s, background 0.2s",
              }}
            >
              {remaining}
            </span>
          </div>
          <div
            className="rounded-xl px-4 py-3 mb-3"
            style={{ background: "rgba(232,185,35,0.08)", border: "1px solid rgba(232,185,35,0.2)" }}
          >
            <p className="font-bold text-sm mb-1" style={{ color: "var(--gold-300)" }}>
              📍 {quiz.cellName}
            </p>
            <p className="text-xs" style={{ color: "rgba(200,216,240,0.75)" }}>
              Giá mua nếu trả lời đúng: <span style={{ color: "var(--gold-400)", fontWeight: 700 }}>${quiz.price}</span>
            </p>
          </div>
          <p className="font-semibold text-base leading-snug" style={{ color: "var(--text-primary)" }}>
            {quiz.question}
          </p>
        </div>

        {/* Options / waiting */}
        {isMe ? (
          <div className="px-6 pb-4 space-y-2.5">
            {quiz.options.map((opt, i) => {
              const isChosen = selected === i;
              const isDisabled = (selected !== null && !isChosen) || timeUp;
              return (
                <button
                  key={i}
                  onClick={() => { setSelected(i); onAnswer(i); }}
                  disabled={selected !== null || timeUp}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex gap-2"
                  style={{
                    background: isChosen ? "rgba(232,185,35,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${isChosen ? "var(--gold-400)" : "rgba(255,255,255,0.1)"}`,
                    color: isDisabled ? "rgba(139,163,204,0.4)" : "var(--text-primary)",
                    cursor: selected !== null || timeUp ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                >
                  <span className="font-bold flex-shrink-0" style={{ color: "var(--gold-400)" }}>{letters[i]}.</span>
                  <span>{opt}</span>
                </button>
              );
            })}
            {timeUp && selected === null && (
              <p className="text-center text-xs" style={{ color: "#FF6B7A" }}>
                ⏰ Hết giờ trả lời — đang xử lý kết quả...
              </p>
            )}
          </div>
        ) : (
          <div className="px-6 pb-5">
            <p className="text-center text-sm py-3 animate-pulse" style={{ color: "var(--text-secondary)" }}>
              ⏳ Đang chờ <strong className="text-white">{playerName}</strong> trả lời... ({remaining}s)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function QuizResultModal({ result, onClose }: { result: QuizResult; onClose: () => void }) {
  const good = result.correct;
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="animate-card-flip-in w-full max-w-xs rounded-2xl overflow-hidden"
        style={{
          background: good
            ? "linear-gradient(160deg, #00280A 0%, #001205 100%)"
            : "linear-gradient(160deg, #3D0000 0%, #1A0000 100%)",
          border: `1.5px solid ${good ? "#00C853" : "#FF3B3B"}50`,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 70px rgba(0,0,0,0.85)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 text-center">
          <div className="text-3xl mb-2">{good ? (result.purchased ? "🏭" : "✅") : "❌"}</div>
          <h3 className="text-lg font-bold text-white mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
            {good
              ? (result.purchased ? "Thâu tóm thành công!" : "Trả lời đúng!")
              : "Trả lời sai!"}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(200,216,240,0.85)" }}>
            {good
              ? (result.purchased
                  ? `Đã mua thành công [${result.cellName}]. Từ giờ người khác dẫm vào sẽ phải trả phí thuê cho bạn.`
                  : `Bạn hiểu đúng kiến thức nhưng chưa đủ vốn để mua [${result.cellName}] (+5 Tự chủ).`)
              : `Đáp án đúng là phương án ${["A","B","C","D"][result.correctIndex]}. Mất $30 chi phí cơ hội và -10 Tự chủ.`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 font-bold text-sm transition-all"
          style={{
            background: "rgba(255,255,255,0.07)",
            color: "rgba(240,244,255,0.9)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          Đã hiểu ✓
        </button>
      </div>
    </div>
  );
}

// ─── Rules Modal ─────────────────────────────────────────────────────────────

function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60] p-4"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="animate-modal-entrance w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #241a14 0%, #17100e 100%)",
          border: "1.5px solid rgba(232,185,35,0.3)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 28px 80px rgba(0,0,0,0.9)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(232,185,35,0.15)" }}>
          <div>
            <h2 className="text-gold-static font-bold text-xl" style={{ fontFamily: "var(--font-display)" }}>
              📖 Luật Chơi
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Cờ Tỷ Phú Toàn Cầu — Chương 4 Mác-Lênin
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all text-sm"
            style={{ background: "rgba(255,255,255,0.07)", color: "var(--text-secondary)" }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5 text-sm" style={{ color: "var(--text-secondary)" }}>

          {/* Điểm số */}
          <section>
            <h3 className="font-bold mb-2 text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              🏆 Điểm Số
            </h3>
            <div className="rounded-xl px-4 py-3" style={{ background: "rgba(232,185,35,0.07)", border: "1px solid rgba(232,185,35,0.2)" }}>
              <p className="font-bold text-center text-base" style={{ color: "var(--gold-400)", fontFamily: "var(--font-code)" }}>
                Điểm = Tiền + Giá trị tài sản đã thâu tóm + Tự chủ×10 + Quyền lực mềm×5
              </p>
              <p className="text-center text-xs mt-1.5" style={{ color: "rgba(232,185,35,0.6)" }}>
                Tự chủ = 0 → thua ngay lập tức, dù nhiều tiền/tài sản nhất
              </p>
            </div>
          </section>

          {/* 3 Vai */}
          <section>
            <h3 className="font-bold mb-2 text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              👥 3 Vai Chơi
            </h3>
            <div className="space-y-2">
              {[
                { icon: "💰", name: "Tư bản tài chính", money: "$2.500", auto: "45", sp: "60",
                  note: "Trả phí thuê chỉ 50% khi dẫm ô người khác (có kênh vốn thay thế). Chịu khủng hoảng 30%." },
                { icon: "🇻🇳", name: "Việt Nam", money: "$1.500", auto: "80", sp: "65",
                  note: "Trả phí thuê 60% (nhà nước điều tiết). Rút thẻ Chính sách (toàn tốt) tại ô Việt Nam." },
                { icon: "🌏", name: "Nước đang phát triển", money: "$1.200", auto: "85", sp: "45",
                  note: "Tự chủ cao nhất nhưng trả phí thuê 100% (đầy đủ) và 120% khi khủng hoảng." },
              ].map(r => (
                <div key={r.name} className="rounded-xl px-3 py-2.5 flex gap-3 items-start"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{r.icon}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{r.name}</div>
                    <div className="text-xs mt-0.5 flex gap-3">
                      <span style={{ color: "#00E676" }}>💵 {r.money}</span>
                      <span style={{ color: "#42A5F5" }}>🏛️ {r.auto}</span>
                      <span style={{ color: "#CE93D8" }}>⭐ {r.sp}</span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: "rgba(139,163,204,0.75)" }}>{r.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quy trình lượt */}
          <section>
            <h3 className="font-bold mb-2 text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              🎲 Quy Trình Một Lượt
            </h3>
            <div className="space-y-1.5">
              {[
                ["1",  "Tung xúc xắc",        'Nhấn nút "Tung Xúc Xắc". Nếu đang bị chi phối: bấm bỏ lượt.'],
                ["2",  "Di chuyển",            "Bấm vào biểu tượng đang nhảy để quân cờ đi từng bước đến ô đích."],
                ["3",  "Xử lý ô đến",          "Ô sở hữu được: quiz để mua (chưa chủ) hoặc trả phí thuê (có chủ). Ô khác: hiệu ứng/thẻ/vote như thường."],
                ["4a", "Đọc thông tin ô",      'Modal thông tin ô hiện ra, bấm "Đã hiểu ✓" để tiếp tục.'],
                ["4b", "Trả lời quiz / đọc thẻ", '(Tuỳ ô) Trả lời câu hỏi thâu tóm, hoặc đọc thẻ sự kiện, bấm "Đã hiểu ✓".'],
                ["5",  "Kết thúc lượt",        'Bấm "Kết Thúc Lượt" để chuyển sang người tiếp theo.'],
              ].map(([step, title, desc]) => (
                <div key={step} className="flex gap-3 items-start px-3 py-2 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.03)" }}>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                    style={{ background: "rgba(232,185,35,0.15)", color: "var(--gold-400)" }}>
                    {step}
                  </span>
                  <div>
                    <div className="font-semibold text-xs" style={{ color: "var(--text-primary)" }}>{title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(139,163,204,0.7)" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Loại ô */}
          <section>
            <h3 className="font-bold mb-2 text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              🗺️ Các Loại Ô
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ["#FF3B3B", "🔴 Tư bản tài chính (×9, sở hữu được)", "Chưa chủ: quiz để mua. Có chủ: trả phí thuê."],
                ["#FF8C00", "🟠 Tập đoàn (×4, sở hữu được)", "Chưa chủ: quiz để mua. Có chủ: trả phí thuê."],
                ["#B44FFF", "🟣 Consortium (×5)", "Vote tập thể. Tư bản TC nhận cổ tức."],
                ["#1E90FF", "🔵 TNC — Công ty xuyên QG (×8, sở hữu được)", "Chưa chủ: quiz để mua. Có chủ: trả phí thuê."],
                ["#00C853", "🟢 Việt Nam (×8)", "Việt Nam rút thẻ tốt. Khác: hiệu ứng thường."],
                ["#FF1744", "⚫ Khủng hoảng (×3)", "Tất cả mất tiền. Nước ĐPT mất 120%."],
                ["#e8b923", "⭐ Xuất phát (ô 0)", "Đi qua → nhận +$200."],
                ["#00BFA5", "⬜ Tự do (ô 10) / Cơ hội (ô 39)", "Tự do: không có gì. Cơ hội: rút thẻ ngẫu nhiên."],
              ].map(([color, label, desc]) => (
                <div key={label} className="rounded-lg px-2.5 py-2"
                  style={{ background: "rgba(255,255,255,0.03)", borderLeft: `3px solid ${color}` }}>
                  <div className="font-semibold text-xs" style={{ color: "var(--text-primary)" }}>{label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(139,163,204,0.65)" }}>{desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Thâu tóm & Phí thuê */}
          <section>
            <h3 className="font-bold mb-2 text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              🏭 Thâu Tóm &amp; Phí Thuê (Ô Đỏ/Cam/Xanh Dương)
            </h3>
            <div className="rounded-xl px-3 py-2.5 text-xs space-y-1.5"
              style={{ background: "rgba(232,185,35,0.06)", border: "1px solid rgba(232,185,35,0.2)" }}>
              <p style={{ color: "var(--text-primary)" }}>21 ô (Tư bản tài chính / Tập đoàn / TNC) có thể mua được:</p>
              <p>• <strong style={{ color: "var(--gold-300)" }}>Chưa có chủ</strong> → hiện câu hỏi kiến thức Chương 4. Trả lời đúng + đủ tiền → <strong style={{ color: "#40E090" }}>thâu tóm</strong> ô đó (trở thành chủ).</p>
              <p>• Trả lời <strong style={{ color: "#FF6B7A" }}>sai</strong> → mất $30 chi phí cơ hội và −10 Tự chủ.</p>
              <p>• <strong style={{ color: "#FF6B7A" }}>Đã có chủ</strong> (người khác) → tự động trả <strong>phí thuê</strong> cho chủ sở hữu — mô phỏng việc chiếm đoạt giá trị thặng dư.</p>
              <p>• Phí thuê thực trả tuỳ vai: <strong style={{ color: "#70B8FF" }}>Tư bản TC 50%</strong> · <strong style={{ color: "#40E090" }}>Việt Nam 60%</strong> · <strong style={{ color: "#FFAB40" }}>Nước ĐPT 100%</strong>.</p>
              <p>• Dẫm vào ô của chính mình → miễn phí.</p>
              <p>• Giá trị các ô đã thâu tóm được cộng vào điểm cuối game.</p>
            </div>
          </section>

          {/* Ô 30 + Kết thúc */}
          <section>
            <h3 className="font-bold mb-2 text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              ⚠️ Ô Nguy Hiểm &amp; Kết Thúc Game
            </h3>
            <div className="space-y-2">
              <div className="rounded-xl px-3 py-2.5"
                style={{ background: "rgba(255,23,68,0.08)", border: "1px solid rgba(255,23,68,0.25)" }}>
                <div className="font-bold text-xs" style={{ color: "#FF6B7A" }}>🚨 Ô 30 — Bị Chi Phối Hoàn Toàn</div>
                <div className="text-xs mt-1" style={{ color: "rgba(255,107,122,0.8)" }}>
                  −40 Tự chủ &nbsp;·&nbsp; −20 Quyền lực mềm &nbsp;·&nbsp; Bỏ 2 lượt tiếp theo
                </div>
              </div>
              <div className="rounded-xl px-3 py-2.5"
                style={{ background: "rgba(255,23,68,0.06)", border: "1px solid rgba(255,23,68,0.2)" }}>
                <div className="font-bold text-xs" style={{ color: "#FF6B7A" }}>💀 Kết thúc game</div>
                <div className="text-xs mt-1" style={{ color: "rgba(139,163,204,0.75)" }}>
                  Khi Tự chủ của bất kỳ ai về 0, game kết thúc ngay.
                  Popup xếp hạng tự động hiện — người điểm cao nhất thắng.
                </div>
              </div>
            </div>
          </section>

          {/* Biểu quyết */}
          <section>
            <h3 className="font-bold mb-2 text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              🗳️ Hội Đồng Biểu Quyết (Ô Tím)
            </h3>
            <div className="rounded-xl px-3 py-2.5 text-xs space-y-1"
              style={{ background: "rgba(180,79,255,0.07)", border: "1px solid rgba(180,79,255,0.2)" }}>
              <p style={{ color: "var(--text-primary)" }}>Khi người không phải Tư bản TC đến ô Consortium:</p>
              <p>• Tất cả người chơi cùng vote <strong style={{ color: "#00E676" }}>Chấp nhận</strong> hoặc <strong style={{ color: "#FF6B7A" }}>Từ chối</strong></p>
              <p>• Đa số quyết định → hiệu ứng áp lên người đến ô đó</p>
              <p>• Tư bản TC không vote — nhận cổ tức +$80, +10 Quyền lực mềm</p>
              <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(180,79,255,0.2)" }}>
                <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>5 ô Consortium:</p>
                {[
                  ["5 — Oil Consortium", "Chấp nhận: +$150, −25 TC / Từ chối: +20 TC, +15 SP"],
                  ["13 — Tech Alliance", "Chấp nhận: +$80, −20 TC, −10 SP / Từ chối: +25 TC, +10 SP"],
                  ["17 — Banking Syndicate", "Chấp nhận: +$200, −35 TC / Từ chối: +30 TC, +10 SP"],
                  ["20 — Hội đồng Tư vấn", "Chấp nhận: +$100, −30 TC, −15 SP / Từ chối: +25 TC, +20 SP"],
                  ["26 — WTO", "Chấp nhận: +$150, −20 TC, +10 SP / Từ chối: +20 TC, −5 SP"],
                ].map(([o, e]) => (
                  <div key={o} className="flex gap-2 py-0.5">
                    <span className="flex-shrink-0 font-semibold" style={{ color: "#B44FFF", minWidth: 140 }}>{o}</span>
                    <span style={{ color: "rgba(139,163,204,0.7)" }}>{e}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-3 flex justify-end"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={onClose} className="btn-gold px-6 py-2 text-sm">
            Đã hiểu ✓
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Game Over Modal ─────────────────────────────────────────────────────────

function GameOverModal({
  players,
  tokenColors,
  onClose,
}: {
  players: Player[];
  tokenColors: Record<string, string>;
  onClose: () => void;
}) {
  const sorted = [...players]
    .map(p => ({ ...p, score: computeScore(p) }))
    .sort((a, b) => b.score - a.score);

  // Players eliminated by autonomy reaching 0
  const eliminated = players.filter(p => !p.isActive || p.autonomy <= 0);

  const medalColors = ["#e8b923", "#C0C0C0", "#CD7F32"];
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[70] p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="animate-modal-entrance w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #241a14 0%, #17100e 100%)",
          border: "1.5px solid rgba(232,185,35,0.35)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.04), " +
            "0 28px 80px rgba(0,0,0,0.9), " +
            "0 0 80px rgba(232,185,35,0.08)",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="text-4xl mb-2">🏁</div>
          <h2
            className="text-gold-gradient text-3xl mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Trò Chơi Kết Thúc!
          </h2>

          {/* Reason: autonomy eliminated */}
          {eliminated.length > 0 && (
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mt-1"
              style={{
                background: "rgba(255,23,68,0.15)",
                border: "1px solid rgba(255,23,68,0.3)",
                color: "#FF6B7A",
              }}
            >
              <span>⚠️</span>
              <span>
                {eliminated.map(p => p.name).join(", ")} mất hoàn toàn tự chủ kinh tế
              </span>
            </div>
          )}
        </div>

        {/* Rankings */}
        <div className="px-6 pb-2 space-y-2">
          {sorted.map((p, i) => {
            const isElim = !p.isActive || p.autonomy <= 0;
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: i === 0
                    ? "rgba(232,185,35,0.08)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${
                    i === 0 ? "rgba(232,185,35,0.25)"
                    : "rgba(255,255,255,0.06)"
                  }`,
                  borderLeft: `3px solid ${medalColors[i] ?? "rgba(255,255,255,0.1)"}`,
                }}
              >
                {/* Medal / rank */}
                <span className="text-xl flex-shrink-0 w-7 text-center">
                  {medals[i] ?? `${i + 1}`}
                </span>

                {/* Token dot */}
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${tokenColors[p.id] ?? "bg-white"}`} />

                {/* Name + role */}
                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold text-sm truncate"
                    style={{
                      color: i === 0 ? "var(--gold-300)" : "var(--text-primary)",
                      fontFamily: "var(--font-ui)",
                    }}
                  >
                    {p.name}
                    {isElim && (
                      <span
                        className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(255,23,68,0.2)", color: "#FF6B7A" }}
                      >
                        mất tự chủ
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    💰 ${p.money.toLocaleString()} &nbsp;·&nbsp;
                    🏛️ {p.autonomy} &nbsp;·&nbsp;
                    ⭐ {p.softPower}
                  </div>
                </div>

                {/* Score */}
                <div
                  className="font-bold text-base flex-shrink-0"
                  style={{
                    color: i === 0 ? "var(--gold-400)" : "var(--text-secondary)",
                    fontFamily: "var(--font-code)",
                  }}
                >
                  {p.score}pt
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div
          className="mx-6 mb-4 mt-2 px-4 py-3 rounded-xl text-xs italic"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "rgba(139,163,204,0.6)",
          }}
        >
          &ldquo;Không chỉ tích lũy tư bản — phải giữ chủ quyền kinh tế!&rdquo; — Lênin (1916)
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 font-bold text-base transition-all"
          style={{
            background: "rgba(232,185,35,0.08)",
            borderTop: "1px solid rgba(232,185,35,0.2)",
            color: "var(--gold-300)",
            fontFamily: "var(--font-display)",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,185,35,0.15)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,185,35,0.08)"}
        >
          Xem Bảng Chi Tiết ↓
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RoomPage() {
  const params   = useParams();
  const router   = useRouter();
  const roomCode = (params.id as string)?.toUpperCase();
  const {
    socket, room, lastCard, voteSession, quizSession, lastQuizResult, diceAnimation, isRolling,
    startGame, rollDice, castVote, answerQuiz, quizReady, endTurn, dismissCard, dismissQuizResult, leaveRoom, isConnected,
  } = useGameSocket();
  const logRef = useRef<HTMLDivElement>(null);
  const preRollPlayersRef = useRef<Player[]>([]);

  const [landingCell, setLandingCell]         = useState<BoardCellFull | null>(null);
  const visualPosRef                           = useRef<Record<string, number>>({});
  const [visualPositions, setVisualPositions] = useState<Record<string, number>>({});
  const [pendingMove, setPendingMove]         = useState<{ pid: string; to: number; isMe: boolean } | null>(null);
  const walkIntervalRef                        = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevHasRolled                          = useRef(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showRules, setShowRules]               = useState(false);
  const [rollingFace, setRollingFace]         = useState(1);
  const [showGameOver, setShowGameOver]       = useState(false);
  // Guards card modal from flashing before token animation starts.
  // true only after pendingMove has been set+cleared (full animation cycle done).
  const [turnHasAnimated, setTurnHasAnimated] = useState(false);
  const hadPendingMoveRef                      = useRef(false);
  // Local capture of the drawn card — independent of useGameSocket's 8s auto-clear.
  // Stays until the player explicitly dismisses, regardless of how long movement takes.
  const [capturedCard, setCapturedCard]       = useState<EventCard | null>(null);

  useEffect(() => {
    if (!isRolling) return;
    const iv = setInterval(() => setRollingFace(f => (f % 6) + 1), 80);
    return () => clearInterval(iv);
  }, [isRolling]);

  // Show game-over modal when phase transitions to "finished"
  useEffect(() => {
    if (room?.phase === "finished") {
      // Small delay so the last action visually settles first
      const t = setTimeout(() => setShowGameOver(true), 800);
      return () => clearTimeout(t);
    }
  }, [room?.phase]);

  // Track animation cycle so CardModal only shows AFTER token has moved.
  // Prevents card from flashing before player clicks their token.
  useEffect(() => {
    if (pendingMove) {
      hadPendingMoveRef.current = true;
    } else if (hadPendingMoveRef.current) {
      setTurnHasAnimated(true);
    }
  }, [pendingMove]);

  useEffect(() => {
    if (!room?.hasRolled) {
      setTurnHasAnimated(false);
      hadPendingMoveRef.current = false;
      setCapturedCard(null);
    }
  }, [room?.hasRolled]);

  // Capture the drawn card into local state so it survives useGameSocket's 8s auto-clear.
  // The player may spend several seconds on token animation + CellLandingModal before
  // CardModal is allowed to show, easily exceeding 8 seconds total.
  useEffect(() => {
    if (lastCard) {
      setCapturedCard(lastCard);
    }
  }, [lastCard]);

  useEffect(() => {
    if (!roomCode) return;
    const savedRoom = localStorage.getItem("co_ty_phu_room");
    const savedName = localStorage.getItem("co_ty_phu_name");
    if (!savedRoom || !savedName) { router.replace("/"); }
  }, [roomCode, router]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [room?.log]);

  useEffect(() => {
    if (!room) return;
    let changed = false;
    const next = { ...visualPosRef.current };
    room.players.forEach(p => {
      if (next[p.id] === undefined) { next[p.id] = p.position; changed = true; }
    });
    if (changed) {
      visualPosRef.current = next;
      setVisualPositions({ ...next });
      preRollPlayersRef.current = [...room.players];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.players.length]);

  useEffect(() => {
    if (!room) return;
    const justRolled = !prevHasRolled.current && room.hasRolled;
    prevHasRolled.current = room.hasRolled;

    if (!room.hasRolled) {
      const synced: Record<string, number> = {};
      room.players.forEach(p => { synced[p.id] = p.position; });
      visualPosRef.current = synced;
      setVisualPositions({ ...synced });
      setPendingMove(null);
      preRollPlayersRef.current = [...room.players];
      if (walkIntervalRef.current) { clearInterval(walkIntervalRef.current); walkIntervalRef.current = null; }
      return;
    }

    if (!justRolled) return;

    const cp = room.players[room.currentTurnIndex];
    if (!cp) return;

    const from = visualPosRef.current[cp.id] ?? cp.position;
    const to   = cp.position;
    const isMe = cp.socketId === socket?.id;

    visualPosRef.current = { ...visualPosRef.current, [cp.id]: from };
    setVisualPositions({ ...visualPosRef.current });
    setPendingMove({ pid: cp.id, to, isMe });

    if (!isMe) {
      const pid = cp.id;
      let pos = from;
      setTimeout(() => {
        if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
        const iv = setInterval(() => {
          pos = (pos + 1) % 40;
          visualPosRef.current = { ...visualPosRef.current, [pid]: pos };
          setVisualPositions({ ...visualPosRef.current });
          if (pos === to) {
            clearInterval(iv);
            walkIntervalRef.current = null;
            setTimeout(() => setPendingMove(null), 800);
          }
        }, 400);
        walkIntervalRef.current = iv;
      }, 600);
    }
  }, [room?.hasRolled, room?.currentTurnIndex, socket?.id]);

  const walkToken = useCallback(() => {
    if (!pendingMove?.isMe || walkIntervalRef.current) return;
    const { pid, to } = pendingMove;
    let pos = visualPosRef.current[pid] ?? 0;
    const iv = setInterval(() => {
      pos = (pos + 1) % 40;
      visualPosRef.current = { ...visualPosRef.current, [pid]: pos };
      setVisualPositions({ ...visualPosRef.current });
      if (pos === to) {
        clearInterval(iv);
        walkIntervalRef.current = null;
        setTimeout(() => {
          setPendingMove(null);
          setLandingCell(BOARD_CELLS[to] ?? null);
        }, 800);
      }
    }, 400);
    walkIntervalRef.current = iv;
  }, [pendingMove]);

  // Dismiss the card: clears both the local capture and the hook's state.
  const handleDismissCard = useCallback(() => {
    setCapturedCard(null);
    dismissCard();
  }, [dismissCard]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!room) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-void)" }}
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <DiceFace value={0} rolling />
          </div>
          <p
            className="text-white text-xl font-bold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Đang vào phòng {roomCode}...
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {isConnected ? "Đã kết nối, đang tải phòng..." : "Đang kết nối server..."}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const displayPlayers = (pendingMove && preRollPlayersRef.current.length > 0)
    ? preRollPlayersRef.current
    : room.players;

  const tokenColors: Record<string, string> = {};
  room.players.forEach((p, i) => { tokenColors[p.id] = TOKEN_COLORS[i % TOKEN_COLORS.length]; });

  const currentPlayer = room.players[room.currentTurnIndex];
  const isMyTurn      = currentPlayer?.socketId === socket?.id;
  const myPlayer      = room.players.find(p => p.socketId === socket?.id);
  const myVisualPos   = myPlayer ? (visualPositions[myPlayer.id] ?? myPlayer.position) : -1;

  const sortedScores = [...room.players]
    .map(p => ({ ...p, score: computeScore(p) }))
    .sort((a, b) => b.score - a.score);

  const quizOwnerName = quizSession
    ? room.players.find(p => p.id === quizSession.playerId)?.name ?? "?"
    : "";

  const handleLeave = () => { leaveRoom(); router.replace("/"); };

  return (
    <div className="h-screen flex flex-col text-white overflow-hidden" style={{ background: "var(--bg-void)" }}>
      {/* ── Modal sequence ── */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {showGameOver && (
        <GameOverModal
          players={room.players}
          tokenColors={tokenColors}
          onClose={() => setShowGameOver(false)}
        />
      )}
      {!showGameOver && landingCell && (
        <CellLandingModal
          cell={landingCell}
          ownerName={room.cellOwners[landingCell.id] ? room.players.find(p => p.id === room.cellOwners[landingCell.id])?.name : undefined}
          isMine={!!myPlayer && room.cellOwners[landingCell.id] === myPlayer.id}
          onClose={() => setLandingCell(null)}
        />
      )}
      {!showGameOver && !landingCell && !pendingMove && turnHasAnimated && capturedCard && (
        <CardModal card={capturedCard} onClose={handleDismissCard} />
      )}
      {!showGameOver && !landingCell && !pendingMove && turnHasAnimated && !capturedCard && quizSession && (
        <QuizModal quiz={quizSession} myPlayerId={myPlayer?.id} playerName={quizOwnerName} onAnswer={answerQuiz} onReady={quizReady} />
      )}
      {!showGameOver && !landingCell && !pendingMove && !quizSession && lastQuizResult && (
        <QuizResultModal result={lastQuizResult} onClose={dismissQuizResult} />
      )}
      {!showGameOver && !landingCell && !lastCard && !pendingMove && voteSession && (
        <VoteModal vote={voteSession} onVote={castVote}
          totalPlayers={room.players.filter(p => !p.hasLeft).length} />
      )}

      {/* ── Leave confirm ── */}
      {showLeaveConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[60] p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="animate-modal-entrance rounded-2xl p-6 max-w-sm w-full"
            style={{
              background: "var(--bg-surface-1)",
              border: "1.5px solid rgba(255,23,68,0.35)",
              boxShadow: "0 24px 70px rgba(0,0,0,0.85)",
            }}
          >
            <h3 className="text-white font-bold text-lg mb-2"
              style={{ fontFamily: "var(--font-display)" }}>
              🚪 Thoát khỏi phòng?
            </h3>
            <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
              Bạn sẽ <strong className="text-red-400">không thể vào lại</strong> phòng này nữa.
            </p>
            {room.phase === "playing" && (
              <p className="text-xs mb-4" style={{ color: "rgba(139,163,204,0.6)" }}>
                Những người chơi còn lại vẫn tiếp tục trò chơi mà không có bạn.
              </p>
            )}
            {room.phase === "waiting" && (
              <p className="text-xs mb-4" style={{ color: "rgba(139,163,204,0.6)" }}>
                Trò chơi chưa bắt đầu — bạn có thể rời và tạo/vào phòng khác.
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--text-secondary)",
                }}
              >
                Ở lại
              </button>
              <button
                onClick={handleLeave}
                className="btn-red flex-1 py-2.5 text-sm"
              >
                Thoát
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top bar ── */}
      <div
        className="flex-shrink-0 px-5 py-3 flex items-center justify-between"
        style={{
          background: "rgba(23,16,14,0.95)",
          borderBottom: "1px solid var(--border-subtle)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-4">
          <span
            className="text-gold-static font-bold text-lg"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ♔ Cờ Tỷ Phú Toàn Cầu
          </span>
          <span className="text-xs hidden sm:inline" style={{ color: "var(--text-secondary)" }}>
            Chương 4 — Tư Bản Tài Chính &amp; Quyền Lực Mềm
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {/* Player name chip */}
          {myPlayer && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: "rgba(232,185,35,0.08)", border: "1px solid rgba(232,185,35,0.2)" }}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tokenColors[myPlayer.id] ?? "bg-yellow-400"}`} />
              <span className="text-xs font-semibold" style={{ color: "var(--gold-400)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {myPlayer.name}
              </span>
            </div>
          )}

          {/* Rules button */}
          <button
            onClick={() => setShowRules(true)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all hidden sm:block"
            style={{
              border: "1px solid rgba(232,185,35,0.3)",
              color: "var(--gold-400)",
              background: "transparent",
              cursor: "pointer",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,185,35,0.1)"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
          >
            📖 Luật chơi
          </button>

          <span style={{ color: "var(--text-secondary)" }}>
            Phòng:{" "}
            <span
              className="font-bold tracking-widest"
              style={{ color: "var(--gold-400)", fontFamily: "var(--font-code)" }}
            >
              {room.roomCode}
            </span>
          </span>
          <span className="hidden sm:inline" style={{ color: "var(--text-secondary)" }}>
            Lượt: <span className="text-white">{room.turnNumber}</span>
          </span>
          <div className={`flex items-center gap-1.5 ${isConnected ? "text-green-400" : "text-red-400"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            <span className="text-xs hidden sm:inline">{isConnected ? "Online" : "Offline"}</span>
          </div>
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
            style={{
              border: "1px solid rgba(255,23,68,0.35)",
              color: "#FF6B7A",
              background: "transparent",
              cursor: "pointer",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,23,68,0.1)"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
          >
            🚪 Thoát
          </button>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex-1 overflow-y-auto xl:overflow-hidden">
      <div className="flex flex-col xl:flex-row gap-3 p-3 max-w-[1400px] mx-auto xl:h-full">

        {/* ── Left sidebar ── */}
        <div className="xl:w-52 flex-shrink-0 space-y-2 xl:h-full xl:overflow-y-auto">
          {/* Player list */}
          <div
            className="rounded-2xl p-3"
            style={{
              background: "var(--bg-surface-1)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <h3
              className="text-[10px] font-bold uppercase tracking-widest mb-2.5"
              style={{ color: "var(--text-secondary)" }}
            >
              👥 Người Chơi ({room.players.length})
            </h3>
            <div className="space-y-2">
              {displayPlayers.map((player, idx) => (
                <PlayerPanel
                  key={player.id}
                  player={player}
                  isCurrent={idx === room.currentTurnIndex}
                  tokenColor={tokenColors[player.id] ?? "bg-white"}
                  isMe={player.socketId === socket?.id}
                />
              ))}
            </div>
          </div>

          {/* Scoring formula */}
          <div
            className="rounded-2xl p-3 text-xs"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <p className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>📊 Công thức điểm</p>
            <p style={{ color: "var(--text-secondary)", fontFamily: "var(--font-code)", fontSize: "11px" }}>
              Tiền + Tài sản thâu tóm + Tự chủ×10 + Sức mạnh×5
            </p>
            <p className="mt-1" style={{ color: "#FF6B7A" }}>⚠️ Tự chủ = 0 → Thua</p>
          </div>

          {/* Waiting phase */}
          {room.phase === "waiting" && (
            <div
              className="rounded-2xl p-4 text-center space-y-3"
              style={{
                background: "var(--bg-surface-1)",
                border: "1px solid rgba(232,185,35,0.2)",
              }}
            >
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-1"
                  style={{ color: "var(--text-secondary)" }}>Mã phòng</p>
                <p
                  className="text-3xl font-black tracking-widest"
                  style={{ color: "var(--gold-400)", fontFamily: "var(--font-code)" }}
                >
                  {room.roomCode}
                </p>
              </div>
              <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: room.players.length >= 3 ? "#00E676" : "#FFAB00", fontWeight: 700 }}>
                  {room.players.length}/6 người
                </span>
                {" "}— cần tối thiểu 3 người
              </div>
              {myPlayer?.id === room.hostId ? (
                <button
                  onClick={startGame}
                  disabled={room.players.length < 3}
                  className="btn-green w-full py-3 text-base"
                >
                  {room.players.length < 3
                    ? `⏳ Chờ thêm ${3 - room.players.length} người...`
                    : "🚀 Bắt đầu trò chơi!"}
                </button>
              ) : (
                <p className="text-xs" style={{ color: "rgba(139,163,204,0.5)" }}>
                  Chờ chủ phòng bắt đầu game...
                </p>
              )}
            </div>
          )}

          {/* Game over */}
          {room.phase === "finished" && (
            <div className="space-y-3">
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(232,185,35,0.06)",
                  border: "1px solid rgba(232,185,35,0.25)",
                }}
              >
                <h3 className="font-bold mb-2 text-sm" style={{ color: "var(--gold-300)", fontFamily: "var(--font-display)" }}>
                  🏁 Kết Quả
                </h3>
                {sortedScores.map((p, i) => (
                  <div key={p.id} className="flex justify-between py-1.5 text-sm"
                    style={{ borderBottom: i < sortedScores.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                    <span>
                      {["🥇","🥈","🥉"][i] ?? ""}
                      {" "}
                      <span className="text-white">{p.name}</span>
                    </span>
                    <span className="font-bold" style={{ color: "var(--gold-400)", fontFamily: "var(--font-code)" }}>
                      {p.score}pt
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="rounded-2xl p-4 space-y-2"
                style={{
                  background: "var(--bg-surface-1)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <p className="font-bold text-xs uppercase tracking-widest" style={{ color: "var(--gold-400)" }}>
                  📚 Thảo Luận Sau Game
                </p>
                <p className="text-white text-xs font-semibold leading-relaxed">
                  Theo lý luận Lênin về tư bản tài chính:
                </p>
                <ul className="space-y-2 text-xs leading-relaxed" style={{ color: "rgba(139,163,204,0.9)" }}>
                  <li>• Tại sao <span style={{ color: "var(--gold-300)", fontWeight: 600 }}>Tư bản tài chính</span> lại có lợi thế trên hầu hết ô bàn cờ?</li>
                  <li>• <span style={{ color: "#40E090", fontWeight: 600 }}>Việt Nam</span> dùng công cụ gì để giảm thiểu tác động?</li>
                  <li>• <span style={{ color: "#70B8FF", fontWeight: 600 }}>Nước đang phát triển</span> có nên từ chối tất cả dòng vốn nước ngoài không?</li>
                  <li>• Trong biểu quyết Hội đồng Tư vấn, lựa chọn nào phản ánh lợi ích quốc gia dài hạn?</li>
                </ul>
                <p
                  className="text-xs mt-2 pt-2 italic"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "rgba(139,163,204,0.5)" }}
                >
                  &ldquo;Không chỉ tích lũy tư bản — phải giữ chủ quyền kinh tế!&rdquo; — Lênin (1916)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Center — board ── */}
        <div className="flex-1 flex flex-col items-center gap-3 min-w-0 xl:h-full xl:overflow-hidden">

          {/* Turn status banner */}
          <div
            className="w-full flex-shrink-0 rounded-2xl px-4 py-2.5 flex items-center justify-between"
            style={{
              background: room.phase === "playing" && isMyTurn
                ? "rgba(0,200,83,0.1)"
                : room.phase === "voting"
                ? "rgba(180,79,255,0.1)"
                : room.phase === "quiz"
                ? "rgba(232,185,35,0.1)"
                : "rgba(255,255,255,0.03)",
              border: `1px solid ${
                room.phase === "playing" && isMyTurn ? "rgba(0,200,83,0.3)"
                : room.phase === "voting" ? "rgba(180,79,255,0.3)"
                : room.phase === "quiz" ? "rgba(232,185,35,0.3)"
                : "rgba(255,255,255,0.06)"
              }`,
            }}
          >
            <div className="flex items-center gap-2">
              {room.phase === "waiting" && (
                <><span>⏳</span><span style={{ color: "var(--text-secondary)" }}>Chờ người chơi vào phòng...</span></>
              )}
              {room.phase === "playing" && isMyTurn && (
                <><span>🎮</span><span className="font-bold" style={{ color: "#40E090" }}>Lượt của bạn!</span></>
              )}
              {room.phase === "playing" && !isMyTurn && (
                <><span>👤</span><span style={{ color: "var(--text-secondary)" }}>Lượt của <strong className="text-white">{currentPlayer?.name}</strong></span></>
              )}
              {room.phase === "voting" && (
                <><span>🗳️</span><span className="font-bold" style={{ color: "#CE93D8" }}>Hội đồng đang biểu quyết...</span></>
              )}
              {room.phase === "quiz" && (
                <><span>❓</span><span className="font-bold" style={{ color: "var(--gold-400)" }}>Đang trả lời câu hỏi thâu tóm...</span></>
              )}
              {room.phase === "finished" && (
                <><span>🏁</span><span className="font-bold" style={{ color: "var(--gold-300)" }}>Trò chơi kết thúc!</span></>
              )}
            </div>
            {myPlayer && (
              <div className="flex items-center gap-3 text-sm">
                <span className="font-bold" style={{ color: "#00E676", fontFamily: "var(--font-code)" }}>
                  ${myPlayer.money.toLocaleString()}
                </span>
                <span style={{ color: "#42A5F5" }}>🏛️{myPlayer.autonomy}</span>
                <span style={{ color: "#CE93D8" }}>⭐{myPlayer.softPower}</span>
              </div>
            )}
          </div>

          {/* Board */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center">
            <div
              className="relative rounded-[10px]"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(11, 1fr)",
                gridTemplateRows: "repeat(11, 1fr)",
                aspectRatio: "1 / 1",
                height: "min(calc(100vh - 130px), 800px)",
                maxHeight: "800px",
                maxWidth: "800px",
                width: "auto",
                border: "3px solid #b98d16",
                boxShadow:
                  "inset 0 0 0 1px #96700f40, " +
                  "0 20px 80px rgba(0,0,0,0.85), " +
                  "0 0 60px rgba(232,185,35,0.06)",
                background: "var(--bg-board)",
              }}
            >
              {BOARD_CELLS.map((cell, i) => (
                <BoardCell
                  key={i}
                  cell={cell}
                  index={i}
                  players={room.players}
                  tokenColors={tokenColors}
                  isMyPosition={myVisualPos === i}
                  visualPositions={visualPositions}
                  pendingPlayerId={pendingMove?.pid ?? null}
                  onTokenClick={walkToken}
                  cellOwners={room.cellOwners}
                />
              ))}

              {/* Center area */}
              <div
                className="flex flex-col items-center justify-center"
                style={{
                  gridRow: "2 / 11",
                  gridColumn: "2 / 11",
                  background: "linear-gradient(160deg, #241a14 0%, #17100e 100%)",
                }}
              >
                {/* Title */}
                <div className="text-center mb-2 px-2">
                  <div
                    className="text-gold-gradient font-bold text-sm sm:text-base"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    ♔ CỜ TỶ PHÚ
                  </div>
                  <div className="text-[9px] sm:text-[10px] mt-0.5"
                    style={{ color: "rgba(139,163,204,0.5)" }}>
                    Tư Bản Tài Chính &amp; Quyền Lực Mềm
                  </div>
                </div>

                {/* Dice display */}
                <div className="mb-2">
                  {isRolling ? (
                    <DiceFace value={rollingFace} rolling />
                  ) : diceAnimation ? (
                    <div className="flex flex-col items-center gap-1">
                      <DiceFace value={diceAnimation.value} />
                      <span
                        className="font-bold text-lg"
                        style={{ color: "var(--gold-400)", fontFamily: "var(--font-display)" }}
                      >
                        {diceAnimation.value}
                      </span>
                    </div>
                  ) : (
                    <DiceFace value={0} />
                  )}
                </div>

                {/* Controls */}
                {room.phase !== "waiting" && room.phase !== "finished" && isMyTurn && (
                  <div className="space-y-1.5 w-full px-3 sm:px-6">
                    {!room.hasRolled ? (
                      myPlayer && myPlayer.skipTurns > 0 ? (
                        <>
                          <button
                            onClick={rollDice}
                            className="btn-red w-full py-2 sm:py-2.5 text-sm"
                          >
                            ⛓️ Bị Chi Phối — Bỏ Lượt
                          </button>
                          <p className="text-center text-[10px]" style={{ color: "#FF6B7A" }}>
                            Đang bị chi phối — còn {myPlayer.skipTurns} lượt bị phạt
                          </p>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={rollDice}
                            className="btn-gold w-full py-2 sm:py-2.5 text-sm sm:text-base"
                          >
                            🎲 Tung Xúc Xắc
                          </button>
                          <p className="text-center text-[10px]" style={{ color: "rgba(139,163,204,0.5)" }}>
                            Tung xúc xắc để di chuyển
                          </p>
                        </>
                      )
                    ) : pendingMove ? (
                      <p className="text-center text-sm animate-pulse py-1.5"
                        style={{ color: "var(--gold-400)" }}>
                        👆 Bấm vào biểu tượng để di chuyển!
                      </p>
                    ) : landingCell || lastCard || quizSession || lastQuizResult ? (
                      <p className="text-center text-sm py-1.5" style={{ color: "var(--text-secondary)" }}>
                        📖 Đọc thông tin ô / trả lời quiz rồi bấm &quot;Đã hiểu&quot;...
                      </p>
                    ) : (
                      <>
                        <button
                          onClick={endTurn}
                          disabled={room.phase === "voting" || room.phase === "quiz"}
                          className="btn-green w-full py-2 sm:py-2.5 text-sm"
                        >
                          {room.phase === "voting" ? "⏳ Chờ kết quả biểu quyết..."
                            : room.phase === "quiz" ? "⏳ Chờ trả lời quiz..."
                            : "✓ Kết Thúc Lượt"}
                        </button>
                        <p className="text-center text-[10px]" style={{ color: "rgba(139,163,204,0.5)" }}>
                          Đã đến ô — nhấn kết thúc để chuyển lượt
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Current position */}
                {myPlayer && myVisualPos >= 0 && (
                  <div className="mt-2 px-3 text-center max-w-full">
                    <div className="text-[9px]" style={{ color: "rgba(139,163,204,0.5)" }}>Vị trí của bạn</div>
                    <div className="text-[10px] font-bold truncate" style={{ color: "var(--text-secondary)" }}>
                      {BOARD_CELLS[myVisualPos]?.name}
                    </div>
                  </div>
                )}

                {/* Color legend */}
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 px-3">
                  {[
                    { color: "#FF3B3B", label: "Tư Bản Tài Chính" },
                    { color: "#FF8C00", label: "Tập Đoàn Đa Ngành" },
                    { color: "#B44FFF", label: "Liên Minh Độc Quyền" },
                    { color: "#1E90FF", label: "Công Ty Xuyên QG" },
                    { color: "#00C853", label: "Chính Sách Việt Nam" },
                    { color: "#FF1744", label: "Khủng Hoảng Kinh Tế" },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
                      <span className="text-[10px] whitespace-nowrap" style={{ color: "rgba(139,163,204,0.5)" }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="xl:w-52 flex-shrink-0 space-y-2 xl:h-full xl:overflow-y-auto">
          {/* Mobile controls */}
          {room.phase !== "waiting" && room.phase !== "finished" && isMyTurn && (
            <div
              className="xl:hidden rounded-2xl p-3 space-y-2"
              style={{
                background: "rgba(0,200,83,0.08)",
                border: "1px solid rgba(0,200,83,0.25)",
              }}
            >
              {!room.hasRolled ? (
                myPlayer && myPlayer.skipTurns > 0 ? (
                  <>
                    <button onClick={rollDice} className="btn-red w-full py-3">
                      ⛓️ Bị Chi Phối — Bỏ Lượt
                    </button>
                    <p className="text-center text-xs" style={{ color: "#FF6B7A" }}>
                      Còn {myPlayer.skipTurns} lượt bị phạt
                    </p>
                  </>
                ) : (
                  <button onClick={rollDice} className="btn-gold w-full py-3 text-base">
                    🎲 Tung Xúc Xắc
                  </button>
                )
              ) : pendingMove ? (
                <p className="text-center text-sm animate-pulse py-1" style={{ color: "var(--gold-400)" }}>
                  👆 Bấm vào biểu tượng để di chuyển!
                </p>
              ) : landingCell || lastCard || quizSession || lastQuizResult ? (
                <p className="text-center text-sm py-1" style={{ color: "var(--text-secondary)" }}>
                  📖 Đọc thông tin ô / trả lời quiz...
                </p>
              ) : (
                <button onClick={endTurn} disabled={room.phase === "voting" || room.phase === "quiz"}
                  className="btn-green w-full py-3">
                  {room.phase === "voting" ? "⏳ Chờ biểu quyết..."
                    : room.phase === "quiz" ? "⏳ Chờ quiz..."
                    : "✓ Kết Thúc Lượt"}
                </button>
              )}
            </div>
          )}

          {/* Current position panel */}
          {myPlayer && myVisualPos >= 0 && (() => {
            const curCell = BOARD_CELLS[myVisualPos];
            const stripClr = curCell ? (STRIP_COLORS[curCell.type] ?? "#555") : "#555";
            return (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "var(--bg-surface-1)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="h-1" style={{ background: stripClr }} />
                <div className="p-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: "var(--text-secondary)" }}>
                    📍 Vị trí của bạn
                  </h3>
                  <div className="text-sm font-bold text-white">{curCell?.name}</div>
                  <div className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {curCell?.description}
                  </div>
                  {curCell?.ownable && (() => {
                    const curOwnerId = room.cellOwners[curCell.id];
                    const curOwnerName = curOwnerId ? room.players.find(p => p.id === curOwnerId)?.name : undefined;
                    return (
                      <div className="mt-2 space-y-1">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: "rgba(232,185,35,0.12)", color: "var(--gold-300)", fontFamily: "var(--font-code)" }}>
                            💰 Giá ${curCell.price}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: "rgba(255,59,59,0.12)", color: "#FF8080", fontFamily: "var(--font-code)" }}>
                            💸 Thuê ${curCell.rent}
                          </span>
                        </div>
                        {curOwnerName ? (
                          <div className="text-[10px]" style={{ color: curOwnerId === myPlayer?.id ? "#40E090" : "#FF6B7A" }}>
                            {curOwnerId === myPlayer?.id ? "✅ Của bạn" : `🔒 Chủ: ${curOwnerName}`}
                          </div>
                        ) : (
                          <div className="text-[10px]" style={{ color: "rgba(139,163,204,0.6)" }}>❓ Chưa có chủ</div>
                        )}
                      </div>
                    );
                  })()}
                  {curCell && !curCell.ownable && (() => {
                    const fx = curCell.effect;
                    return (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {fx.money      && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{
                              background: fx.money > 0 ? "rgba(0,230,118,0.12)" : "rgba(255,23,68,0.12)",
                              color: fx.money > 0 ? "#00E676" : "#FF4466",
                              fontFamily: "var(--font-code)",
                            }}>
                            {fx.money > 0 ? "+" : ""}{fx.money}$
                          </span>
                        )}
                        {fx.autonomy   && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{
                              background: fx.autonomy > 0 ? "rgba(30,144,255,0.12)" : "rgba(255,100,0,0.12)",
                              color: fx.autonomy > 0 ? "#40C4FF" : "#FFAB40",
                              fontFamily: "var(--font-code)",
                            }}>
                            {fx.autonomy > 0 ? "+" : ""}{fx.autonomy} Tự chủ
                          </span>
                        )}
                        {fx.softPower  && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{
                              background: fx.softPower > 0 ? "rgba(180,79,255,0.12)" : "rgba(255,23,68,0.12)",
                              color: fx.softPower > 0 ? "#CE93D8" : "#FF6B8A",
                              fontFamily: "var(--font-code)",
                            }}>
                            {fx.softPower > 0 ? "+" : ""}{fx.softPower} Sức mạnh
                          </span>
                        )}
                        {fx.drawCard    && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: "rgba(232,185,35,0.12)", color: "var(--gold-300)" }}>🃏 Rút thẻ</span>}
                        {fx.councilVote && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: "rgba(180,79,255,0.12)", color: "#CE93D8" }}>🗳️ Biểu quyết</span>}
                        {fx.allPlayers  && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: "rgba(255,23,68,0.12)", color: "#FF6B7A" }}>⚠️ Tất cả</span>}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()}

          {/* Activity log */}
          <div
            className="rounded-2xl flex flex-col overflow-hidden"
            style={{
              background: "var(--bg-surface-1)",
              border: "1px solid var(--border-subtle)",
              minHeight: "200px",
              maxHeight: "360px",
            }}
          >
            <div
              className="px-3 py-2 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <h3 className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--text-secondary)" }}>
                📜 Nhật Ký
              </h3>
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
              {room.log.length === 0 ? (
                <p className="italic" style={{ color: "rgba(139,163,204,0.35)" }}>
                  Chưa có sự kiện...
                </p>
              ) : (
                room.log.map((entry, i) => (
                  <p
                    key={i}
                    className="leading-snug"
                    style={{
                      color: i === room.log.length - 1 ? "var(--text-primary)" : "rgba(139,163,204,0.65)",
                    }}
                  >
                    {entry}
                  </p>
                ))
              )}
            </div>
          </div>

          {/* Scoreboard */}
          <div
            className="rounded-2xl p-3"
            style={{
              background: "var(--bg-surface-1)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-2.5"
              style={{ color: "var(--text-secondary)" }}>
              🏆 Bảng Điểm
            </h3>
            <div className="space-y-1.5">
              {sortedScores.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg"
                  style={{
                    background: i === 0 ? "rgba(232,185,35,0.06)" : "transparent",
                    borderLeft: i === 0 ? "2px solid rgba(232,185,35,0.4)" : "2px solid transparent",
                  }}
                >
                  <span style={{ color: i === 0 ? "var(--gold-300)" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "var(--text-secondary)" }}>
                    {["🥇","🥈","🥉"][i] ?? `${i+1}.`}
                  </span>
                  <div
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${tokenColors[p.id]}`}
                  />
                  <span className="truncate flex-1" style={{ color: "rgba(240,244,255,0.9)" }}>
                    {p.name}
                  </span>
                  <span
                    className="font-bold flex-shrink-0"
                    style={{
                      color: i === 0 ? "var(--gold-400)" : "var(--text-secondary)",
                      fontFamily: "var(--font-code)",
                    }}
                  >
                    {p.score}pt
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
