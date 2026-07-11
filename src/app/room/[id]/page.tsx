"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGameSocket } from "@/hooks/useGameSocket";
import { BOARD_CELLS, CELL_COLORS, CELL_TYPE_LABELS, type BoardCellFull } from "@/data/boardData";
import type { Player, EventCard, VoteSession, QuizSession, QuizResult, PlayerRole } from "@/types/game";
import { RulesModal } from "@/components/GameRulesModal";

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
// Luật đã công bố: "Tự chủ = 0 → thua ngay lập tức, dù nhiều tiền/tài sản nhất" —
// người mất hoàn toàn tự chủ luôn rớt xuống cuối bảng xếp hạng, bất kể điểm số.
function compareByRank<T extends { autonomy: number; score: number }>(a: T, b: T): number {
  const aLost = a.autonomy <= 0;
  const bLost = b.autonomy <= 0;
  if (aLost !== bLost) return aLost ? 1 : -1;
  return b.score - a.score;
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

// Thanh 4px ở mép trên mỗi ô — dấu hiệu loại ô, dùng cùng mã hex "border"
// trong CELL_COLORS (boardData.ts) để đồng bộ tông màu.
const STRIP_COLORS: Record<string, string> = {
  financial_capital: "#a02820",
  conglomerate:      "#b0621a",
  consortium:        "#7a3d94",
  tnc:               "#2f5f95",
  vietnam:           "#1f7a45",
  crisis:            "#8a1a12",
  start:             "#d4af1f",
  free:              "#5a6474",
};

// Nhãn hiệu ứng ngắn gọn hiện dưới tên ô (vd "+$200", "−$60", "🃏") — giúp
// người chơi ước lượng nhanh hậu quả khi dừng chân mà không cần bấm vào ô.
function cellEffectLabel(cell: typeof BOARD_CELLS[0]): string | null {
  if (cell.ownable) return `−$${cell.rent}`;
  const fx = cell.effect;
  if (fx.money)      return `${fx.money > 0 ? "+" : "−"}$${Math.abs(fx.money)}`;
  if (cell.type === "crisis") return "−10%";
  if (fx.autonomy)    return `${fx.autonomy > 0 ? "+" : "−"}${Math.abs(fx.autonomy)} 🏛`;
  if (fx.softPower)   return `${fx.softPower > 0 ? "+" : "−"}${Math.abs(fx.softPower)} ⭐`;
  if (fx.skipTurns)   return "🚧";
  if (fx.drawCard)    return "🃏";
  if (fx.councilVote) return "🗳️";
  return null;
}


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

// Unified line-icon set for the 3 core stats (Tiền / Tự chủ / Sức mạnh).
// Different platforms render emoji with wildly inconsistent style/weight/color
// (💰⭐ come out flat and colorful, 🏛️ renders monochrome on many systems) —
// using matching stroke-based SVGs that inherit currentColor keeps all three
// looking like one coherent icon set everywhere they're shown together.
function MoneyIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "-1.5px", flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.6v6.8M9.9 6.2c0-.85-.85-1.5-1.9-1.5s-1.9.58-1.9 1.4c0 .78.68 1.05 1.9 1.35c1.22.3 1.9.62 1.9 1.4c0 .85-.85 1.4-1.9 1.4s-1.9-.55-1.9-1.45"
        stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function AutonomyIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "-1.5px", flexShrink: 0 }}>
      <path d="M8 1.4l5.3 1.9v3.7c0 3.5-2.2 6.1-5.3 7c-3.1-.9-5.3-3.5-5.3-7V3.3z"
        stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}
function PowerIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={{ display: "inline-block", verticalAlign: "-1.5px", flexShrink: 0 }}>
      <path d="M8 1.1l1.98 4.26 4.6.54-3.44 3.18.92 4.56L8 11.5l-4.06 2.14.92-4.56-3.44-3.18 4.6-.54z" />
    </svg>
  );
}

// Windows renders the 🇻🇳 flag emoji as raw "VN" letters (no flag glyph in the
// default font), while 💰/🌏 render fine everywhere. Draw the flag as inline
// SVG instead so the "Việt Nam" role always shows an actual flag icon.
function VietnamFlagIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * (2 / 3)}
      viewBox="0 0 30 20"
      style={{ display: "block", borderRadius: 2, boxShadow: "0 0 0 1px rgba(0,0,0,0.25)" }}
    >
      <rect width="30" height="20" fill="#DA251D" />
      <polygon
        points="15,3 16.65,7.74 21.66,7.84 17.66,10.87 19.11,15.66 15,12.8 10.89,15.66 8.34,10.87 8.34,7.84 13.35,7.74"
        fill="#FFCD00"
      />
    </svg>
  );
}

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
          {player.role === "vietnam" ? <VietnamFlagIcon size={17} />
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
          <span>🚧</span>
          <span>ĐÌNH TRỆ SẢN XUẤT — còn {player.skipTurns} lượt</span>
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

// Compact leaderboard row — merges the old separate "player list" + "scoreboard"
// panels into one, matching the reference layout (avatar · name+stats · score).
function ScoreRow({
  rank, player, score, isCurrent, isMe, tokenColor,
}: {
  rank: number; player: Player; score: number; isCurrent: boolean; isMe: boolean; tokenColor: string;
}) {
  const roleColor = ROLE_COLORS[player.role] ?? "#8BA3CC";
  const medals = ["🥇", "🥈", "🥉"];
  const isElim = player.autonomy <= 0;
  return (
    <div
      className="flex items-center gap-2 px-2 py-2 rounded-xl transition-all"
      style={{
        background: isCurrent ? "rgba(232,185,35,0.08)" : "transparent",
        border: `1px solid ${isCurrent ? "rgba(232,185,35,0.3)" : "transparent"}`,
      }}
    >
      <span
        className="text-xs w-5 text-center flex-shrink-0 font-bold"
        style={{ color: rank > 3 ? "var(--text-secondary)" : undefined }}
      >
        {medals[rank - 1] ?? rank}
      </span>
      <div
        className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] ${tokenColor}`}
        style={{ boxShadow: `0 0 0 1.5px ${roleColor}70` }}
      >
        {player.role === "vietnam" ? <VietnamFlagIcon size={14} /> : player.role === "financial_capital" ? "💰" : "🌏"}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="flex items-center gap-1 text-xs font-bold truncate"
          style={{ color: isCurrent ? "var(--gold-300)" : "var(--text-primary)", fontFamily: "var(--font-ui)" }}
        >
          <span className="truncate">{player.name}</span>
          {isMe && <span className="text-[9px] font-normal flex-shrink-0" style={{ color: "var(--text-secondary)" }}>(bạn)</span>}
          {isElim && <span className="text-[9px] flex-shrink-0" style={{ color: "#FF6B7A" }}>⚠</span>}
        </div>
        {/* Không dùng "truncate" (từng âm thầm cắt mất chỉ số Sức mạnh) lẫn
            "flex-wrap" (xuống dòng nhìn lệch) — ép 1 hàng ngang cố định,
            thu gọn khoảng cách + icon nhỏ hơn 1 chút để chắc chắn vừa trong
            bề rộng sidebar. */}
        <div className="text-[10px] flex items-center whitespace-nowrap gap-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-code)" }}>
          <span className="inline-flex items-center gap-0.5"><MoneyIcon size={8} />${player.money.toLocaleString()}</span>
          <span className="inline-flex items-center gap-0.5"><AutonomyIcon size={8} />{player.autonomy}</span>
          <span className="inline-flex items-center gap-0.5"><PowerIcon size={8} />{player.softPower}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div
          className="text-xs font-bold"
          style={{ color: rank === 1 ? "var(--gold-400)" : "var(--text-secondary)", fontFamily: "var(--font-code)" }}
        >
          {score.toLocaleString()}
        </div>
        <div className="text-[9px]" style={{ color: "var(--text-secondary)" }}>điểm</div>
      </div>
    </div>
  );
}

// Một kiểu ô duy nhất dùng chung cho cả 40 ô (kể cả 4 ô góc) — chỉ khác vị
// trí lưới (grid-row/grid-column) theo CELL_POSITIONS. Theo đúng spec: bo góc
// nhẹ, thanh màu 4px ở mép trên, nền trầm + viền cùng tông, tên viết tắt cỡ
// chữ rất nhỏ, nhãn hiệu ứng ngắn gọn bên dưới tên, quân cờ xếp ở đáy ô.
function BoardCell({
  cell, index, players, tokenColors, isMyPosition,
  visualPositions, pendingPlayerId, onTokenClick, cellOwners, onCellInfo,
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
  // Lets players click any cell — even ones they haven't landed on — to read
  // its "Kiến thức Chương 4" explanation on demand, independent of the real
  // game-flow landing modal / quiz (which still only fires on an actual roll).
  onCellInfo: (cell: typeof BOARD_CELLS[0]) => void;
}) {
  const ownerId = cell.ownable ? cellOwners[cell.id] : undefined;
  const ownerColor = ownerId ? (tokenColors[ownerId] ?? "bg-white") : undefined;
  const pos       = CELL_POSITIONS[index];
  const isCorner  = CORNER_IDS.has(index);
  const colors    = CELL_COLORS[cell.type] ?? CELL_COLORS.free;
  const stripColor = STRIP_COLORS[cell.type] ?? "#555";
  const effectLabel = cellEffectLabel(cell);

  const playersHere = players.filter(p => (visualPositions[p.id] ?? p.position) === index);

  const rawName = cell.name.replace(/^[\p{Emoji}\s]+/u, "").trim();
  const shortName = rawName.split(" — ")[0];

  const handleCellClick = () => onCellInfo(cell);

  // Hàng trên cùng (row 1) nằm sát mép bàn cờ — tooltip bật lên phía trên như
  // mặc định sẽ bị thanh tiêu đề phía trên board che mất. Lật xuống dưới ô
  // riêng cho hàng này.
  const Tooltip = () => (
    <div className={`cell-tooltip ${pos.row === 1 ? "cell-tooltip-below" : ""}`}>{cell.name}</div>
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
            onClick={isPending ? (e) => { e.stopPropagation(); onTokenClick(); } : undefined}
            title={isPending ? `${p.name} — Bấm để đi!` : p.name}
            className={`
              w-4 h-4 rounded-full border flex items-center justify-center
              text-[8px] font-black text-white flex-shrink-0 transition-all
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

  return (
    <div
      className={`border rounded-[5px] ${colors} relative select-none group cursor-pointer overflow-visible
        ${isMyPosition ? "ring-2 ring-white/70 ring-offset-1 ring-offset-[#17100e] z-10 shadow-[0_0_14px_rgba(255,255,255,0.4)]" : ""}
      `}
      style={{ gridRow: pos.row, gridColumn: pos.col }}
      onClick={handleCellClick}
    >
      <Tooltip />

      {/* Thanh 4px mép trên — dấu hiệu loại ô */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-[4px]"
        style={{ background: stripColor }}
      />

      {/* Chấm nhỏ đánh dấu chủ sở hữu (góc trên-trái) khi ô đã bị thâu tóm */}
      {cell.ownable && ownerId && (
        <div
          className={`absolute top-1.5 left-1 w-1.5 h-1.5 rounded-full border border-white/70 z-10 ${ownerColor}`}
          title="Đã bị thâu tóm"
        />
      )}

      {/* absolute inset-0 + overflow-hidden clips long names to a fixed box
          instead of pushing this grid cell taller than its neighbors —
          Tooltip stays outside (sibling above) so its hover popup still
          escapes the cell. */}
      <div className="absolute inset-0 overflow-hidden flex flex-col items-center pt-2 pb-0.5 px-1">
        <div className={`flex-1 min-h-0 flex flex-col items-center justify-center gap-0.5 w-full text-center ${isCorner ? "text-[11px] font-bold" : "text-[10px] font-semibold"}`}>
          <div className="leading-tight line-clamp-2">{shortName}</div>
          {effectLabel && (
                  <div className="leading-none" style={{ fontSize: "7px", fontWeight: 800, opacity: 0.85 }}>

              {effectLabel}
            </div>
          )}
        </div>

        {playersHere.length > 0 && (
          <div className="flex flex-wrap gap-0.5 justify-center flex-shrink-0 mt-0.5">
            <TokenBadges />
          </div>
        )}
      </div>
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

  // Bộ màu trầm, tông đỏ cờ + vàng học thuật — đồng bộ với CELL_COLORS
  // (boardData.ts), thay cho các màu neon cũ.
  const typeGradient: Record<string, string> = {
    financial_capital: "linear-gradient(160deg, #5c1512 0%, #1a0605 100%)",
    conglomerate:      "linear-gradient(160deg, #5c3410 0%, #1a0e04 100%)",
    consortium:        "linear-gradient(160deg, #3d1f4d 0%, #140a19 100%)",
    tnc:               "linear-gradient(160deg, #152b45 0%, #060d17 100%)",
    vietnam:           "linear-gradient(160deg, #123821 0%, #06130b 100%)",
    crisis:            "linear-gradient(160deg, #1a1310 0%, #0a0705 100%)",
    start:             "linear-gradient(160deg, #5c4a10 0%, #1c1704 100%)",
    free:              "linear-gradient(160deg, #2a2f38 0%, #0e1013 100%)",
  };

  const typeBorderColor: Record<string, string> = {
    financial_capital: "#a02820",
    conglomerate:      "#b0621a",
    consortium:        "#7a3d94",
    tnc:               "#2f5f95",
    vietnam:           "#1f7a45",
    crisis:            "#8a1a12",
    start:             "#d4af1f",
    free:              "#5a6474",
  };

  const badgeColor: Record<string, { bg: string; text: string }> = {
    financial_capital: { bg: "rgba(160,40,32,0.28)",  text: "#ffd9d4" },
    conglomerate:      { bg: "rgba(176,98,26,0.28)",  text: "#ffe3c2" },
    consortium:        { bg: "rgba(122,61,148,0.28)", text: "#ecd2f7" },
    tnc:               { bg: "rgba(47,95,149,0.28)",  text: "#cfe1f7" },
    vietnam:           { bg: "rgba(31,122,69,0.28)",  text: "#c7f0d5" },
    crisis:            { bg: "rgba(138,26,18,0.3)",   text: "#f0c6c0" },
    start:             { bg: "rgba(212,175,31,0.28)", text: "#fff3c4" },
    free:              { bg: "rgba(90,100,116,0.28)", text: "#dbe2ec" },
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
                <span className="text-sm flex items-center gap-1.5" style={{ color: "rgba(200,216,240,0.9)" }}><MoneyIcon size={13} /> Tiền</span>
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
                <span className="text-sm flex items-center gap-1.5" style={{ color: "rgba(200,216,240,0.9)" }}><AutonomyIcon size={13} /> Tự chủ</span>
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
                <span className="text-sm flex items-center gap-1.5" style={{ color: "rgba(200,216,240,0.9)" }}><PowerIcon size={13} /> Sức mạnh mềm</span>
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
              <span className="text-sm flex items-center gap-1.5" style={{ color: "rgba(200,216,240,0.9)" }}><MoneyIcon size={13} /> Tiền</span>
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
              <span className="text-sm flex items-center gap-1.5" style={{ color: "rgba(200,216,240,0.9)" }}><AutonomyIcon size={13} /> Tự chủ</span>
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
              <span className="text-sm flex items-center gap-1.5" style={{ color: "rgba(200,216,240,0.9)" }}><PowerIcon size={13} /> Quyền Lực Mềm</span>
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

// RulesModal is now shared with the home page (players can read the rules
// before creating/joining a room, not just once already inside a match) —
// see src/components/GameRulesModal.tsx.

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
    .sort(compareByRank);

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
  // Purely informational — opened by clicking ANY cell on the board (see
  // BoardCell's onCellInfo) so players can read the "Kiến thức Chương 4" of
  // every cell whenever they like. Fully separate from `landingCell`, which
  // only fires from the real dice-roll/landing flow and can trigger a quiz.
  const [viewCell, setViewCell]               = useState<BoardCellFull | null>(null);
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
  const tokenColors: Record<string, string> = {};
  room.players.forEach((p, i) => { tokenColors[p.id] = TOKEN_COLORS[i % TOKEN_COLORS.length]; });

  const currentPlayer = room.players[room.currentTurnIndex];
  const isMyTurn      = currentPlayer?.socketId === socket?.id;
  const myPlayer      = room.players.find(p => p.socketId === socket?.id);
  const myVisualPos   = myPlayer ? (visualPositions[myPlayer.id] ?? myPlayer.position) : -1;

  const sortedScores = [...room.players]
    .map(p => ({ ...p, score: computeScore(p) }))
    .sort(compareByRank);

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

      {/* ── Xem kiến thức của bất kỳ ô nào (bấm vào ô trên bàn cờ) — thuần
          tham khảo, không đụng tới quiz/landing thật, nên chỉ ẩn khi đang có
          modal gameplay khác che màn hình để tránh chồng lấn. */}
      {!showGameOver && !landingCell && !pendingMove && !quizSession && !voteSession && !capturedCard && !showLeaveConfirm && viewCell && (
        <CellLandingModal
          cell={viewCell}
          ownerName={room.cellOwners[viewCell.id] ? room.players.find(p => p.id === room.cellOwners[viewCell.id])?.name : undefined}
          isMine={!!myPlayer && room.cellOwners[viewCell.id] === myPlayer.id}
          onClose={() => setViewCell(null)}
        />
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

          {/* Start-game button — visible up top for the host while in the waiting room */}
          {room.phase === "waiting" && myPlayer?.id === room.hostId && (
            <button
              onClick={startGame}
              disabled={room.players.length < 3}
              className="px-3 py-1 rounded-lg text-xs font-bold transition-all hidden sm:block"
              style={{
                border: "1px solid rgba(0,200,83,0.4)",
                color: room.players.length < 3 ? "rgba(0,200,83,0.5)" : "#40E090",
                background: "rgba(0,200,83,0.08)",
                cursor: room.players.length < 3 ? "not-allowed" : "pointer",
              }}
            >
              {room.players.length < 3 ? `⏳ Cần thêm ${3 - room.players.length}` : "🚀 Bắt đầu"}
            </button>
          )}

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
      <div className="flex flex-col xl:flex-row gap-3 p-3 max-w-[1800px] mx-auto xl:h-full">

        {/* ── Center — board ── */}
        <div className="flex-1 flex flex-col items-center gap-3 min-w-0 xl:h-full xl:overflow-hidden">

          {/* Board */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center">
            <div
              className="relative rounded-[10px]"
              style={{
                display: "grid",
                // minmax(0, 1fr) — plain 1fr resolves to minmax(auto, 1fr), so any
                // cell whose text needs several wrapped lines was forcing its whole
                // row/column taller than the rest. Capping the min at 0 forces every
                // track to the same size; overflow-hidden + line-clamp handles overflow.
                gridTemplateColumns: "repeat(11, minmax(0, 1fr))",
                gridTemplateColumns: "repeat(11, minmax(0, 1fr))",
gridTemplateRows: "repeat(11, minmax(0, 1fr))",
aspectRatio: "1.08 / 1",
width: "min(100%, calc(100vh - 40px), 1900px)",
height: "auto",
maxWidth: "1900px",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow:
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
                  onCellInfo={setViewCell}
                />
              ))}

              {/* Center area */}
              <div
                className="flex flex-col items-center justify-center"
                style={{
                  gridRow: "2 / 11",
                  gridColumn: "2 / 11",
                  background: `
                    radial-gradient(circle at 50% 40%, rgba(232,185,35,0.06), transparent 60%),
                    linear-gradient(160deg, #241a14 0%, #17100e 100%)
                  `,
                }}
              >
                {/* Title */}
                <div className="text-center mb-4 px-2">
                  <div
                    className="text-gold-gradient font-bold text-2xl sm:text-3xl"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    ♔ CỜ TỶ PHÚ TOÀN CẦU
                  </div>
                  <div className="text-xs sm:text-sm mt-1"
                    style={{ color: "rgba(139,163,204,0.6)" }}>
                    Tư Bản Tài Chính &amp; Quyền Lực Mềm
                  </div>
                  <div
                    className="mx-auto mt-2"
                    style={{ width: 48, height: 2, background: "rgba(232,185,35,0.4)", borderRadius: 2 }}
                  />
                </div>

                {/* Dice display */}
                <div className="mb-4" style={{ transform: "scale(1.6)" }}>
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

                {/* Status line — full controls now live in the right sidebar TurnCard */}
                {room.phase === "playing" && currentPlayer && (
                  <p className="text-center text-sm mt-2 px-3" style={{ color: "var(--text-secondary)" }}>
                    Lượt của <strong style={{ color: isMyTurn ? "#40E090" : "var(--text-primary)" }}>{isMyTurn ? "bạn" : currentPlayer.name}</strong>
                    {" — "}{room.hasRolled ? "đã tung xúc xắc" : "chưa tung xúc xắc"}.
                  </p>
                )}

                {/* Color legend */}
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 px-3">
                  {[
                    { color: "#a02820", label: "Tư Bản Tài Chính" },
                    { color: "#b0621a", label: "Tập Đoàn Đa Ngành" },
                    { color: "#7a3d94", label: "Liên Minh Độc Quyền" },
                    { color: "#2f5f95", label: "Công Ty Xuyên QG" },
                    { color: "#1f7a45", label: "Chính Sách Việt Nam" },
                    { color: "#8a1a12", label: "Khủng Hoảng Kinh Tế" },
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
        <div className="xl:w-80 flex-shrink-0 space-y-3 xl:h-full xl:overflow-y-auto">

          {/* Waiting-room card — room code + start button (host) */}
          {room.phase === "waiting" && (
            <div
              className="rounded-2xl p-4 text-center space-y-3"
              style={{ background: "var(--bg-surface-1)", border: "1px solid rgba(232,185,35,0.2)" }}
            >
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--text-secondary)" }}>Mã phòng</p>
                <p className="text-3xl font-black tracking-widest" style={{ color: "var(--gold-400)", fontFamily: "var(--font-code)" }}>
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
                <button onClick={startGame} disabled={room.players.length < 3} className="btn-green w-full py-3 text-base">
                  {room.players.length < 3
                    ? `⏳ Chờ thêm ${3 - room.players.length} người...`
                    : "🚀 Bắt đầu trò chơi!"}
                </button>
              ) : (
                <p className="text-xs" style={{ color: "rgba(139,163,204,0.5)" }}>Chờ chủ phòng bắt đầu game...</p>
              )}
            </div>
          )}

          {/* Turn card — current player's stats + roll/end-turn controls */}
          {room.phase !== "waiting" && (
            <div
              className="rounded-2xl p-3.5"
              style={{
                background: "var(--bg-surface-1)",
                border: `1.5px solid ${isMyTurn && room.phase === "playing" ? "rgba(0,200,83,0.35)" : "var(--border-subtle)"}`,
              }}
            >
              {room.phase === "finished" ? (
                <div className="text-center py-1">
                  <div className="text-2xl mb-1">🏁</div>
                  <p className="font-bold text-sm" style={{ color: "var(--gold-300)", fontFamily: "var(--font-display)" }}>
                    Trò chơi kết thúc!
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>Xem bảng điểm bên dưới</p>
                </div>
              ) : room.phase === "voting" ? (
                <div className="text-center py-1">
                  <div className="text-xl mb-1">🗳️</div>
                  <p className="font-bold text-sm" style={{ color: "#CE93D8" }}>Hội đồng đang biểu quyết...</p>
                </div>
              ) : room.phase === "quiz" ? (
                <div className="text-center py-1">
                  <div className="text-xl mb-1">❓</div>
                  <p className="font-bold text-sm" style={{ color: "var(--gold-400)" }}>
                    {quizOwnerName} đang trả lời câu hỏi thâu tóm...
                  </p>
                </div>
              ) : currentPlayer ? (
                <>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-base ${tokenColors[currentPlayer.id] ?? "bg-white"}`}
                      style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.15)" }}
                    >
                      {currentPlayer.role === "vietnam" ? <VietnamFlagIcon size={18} /> : currentPlayer.role === "financial_capital" ? "💰" : "🌏"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: isMyTurn ? "#40E090" : "var(--text-secondary)" }}>
                        {isMyTurn ? "🎮 Đang tới lượt bạn" : "Đang tới lượt"}
                      </p>
                      <p className="text-sm font-bold truncate text-white">{currentPlayer.name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mb-3 text-center">
                    <div className="rounded-lg py-1.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div className="text-[9px] flex items-center justify-center gap-1" style={{ color: "var(--text-secondary)" }}>
                        <MoneyIcon /> Tiền
                      </div>
                      <div className="text-xs font-bold" style={{ color: "#00E676", fontFamily: "var(--font-code)" }}>
                        ${currentPlayer.money.toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-lg py-1.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div className="text-[9px] flex items-center justify-center gap-1" style={{ color: "var(--text-secondary)" }}>
                        <AutonomyIcon /> Tự chủ
                      </div>
                      <div className="text-xs font-bold" style={{ color: "#42A5F5", fontFamily: "var(--font-code)" }}>
                        {currentPlayer.autonomy}
                      </div>
                    </div>
                    <div className="rounded-lg py-1.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div className="text-[9px] flex items-center justify-center gap-1" style={{ color: "var(--text-secondary)" }}>
                        <PowerIcon /> Q.lực
                      </div>
                      <div className="text-xs font-bold" style={{ color: "#CE93D8", fontFamily: "var(--font-code)" }}>
                        {currentPlayer.softPower}
                      </div>
                    </div>
                  </div>

                  {isMyTurn ? (
                    !room.hasRolled ? (
                      <>
                        <button onClick={rollDice} className="btn-gold w-full py-2.5 text-sm">🎲 Tung Xúc Xắc</button>
                        {myPlayer && myPlayer.skipTurns > 0 ? (
                          <p className="text-center text-[10px] mt-1.5" style={{ color: "#FF6B7A" }}>
                            🚧 Đang đình trệ — còn {myPlayer.skipTurns} lượt
                          </p>
                        ) : (
                          <p className="text-center text-[10px] mt-1.5" style={{ color: "rgba(139,163,204,0.5)" }}>
                            Tung xúc xắc để di chuyển
                          </p>
                        )}
                      </>
                    ) : pendingMove ? (
                      <p className="text-center text-xs animate-pulse py-1.5" style={{ color: "var(--gold-400)" }}>
                        👆 Bấm vào biểu tượng để di chuyển!
                      </p>
                    ) : landingCell || lastCard || quizSession || lastQuizResult ? (
                      <p className="text-center text-xs py-1.5" style={{ color: "var(--text-secondary)" }}>
                        📖 Đọc thông tin rồi bấm &quot;Đã hiểu&quot;...
                      </p>
                    ) : (
                      <>
                        <button
                          onClick={endTurn}
                          disabled={room.phase === "voting" || room.phase === "quiz"}
                          className="btn-green w-full py-2.5 text-sm"
                        >
                          {room.phase === "voting" ? "⏳ Chờ kết quả biểu quyết..."
                            : room.phase === "quiz" ? "⏳ Chờ trả lời quiz..."
                            : "✓ Kết Thúc Lượt"}
                        </button>
                        <p className="text-center text-[10px] mt-1.5" style={{ color: "rgba(139,163,204,0.5)" }}>
                          Đã đến ô — nhấn kết thúc để chuyển lượt
                        </p>
                      </>
                    )
                  ) : (
                    <p className="text-center text-xs py-1.5" style={{ color: "var(--text-secondary)" }}>
                      Đang chờ {currentPlayer.name} tung xúc xắc...
                    </p>
                  )}
                </>
              ) : null}
            </div>
          )}

          {/* Activity log — kept small and right under the turn card (instead of
              at the bottom) so it's visible without scrolling the sidebar. */}
          <div
            className="rounded-2xl flex flex-col overflow-hidden"
            style={{
              background: "var(--bg-surface-1)",
              border: "1px solid var(--border-subtle)",
              height: "110px",
            }}
          >
            <div
              className="px-3 py-1.5 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <h3 className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--text-secondary)" }}>
                📜 Diễn Biến
              </h3>
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto px-3 py-1.5 space-y-1 text-[11px]">
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

          {/* Leaderboard — merges old player-list + scoreboard panels */}
          <div className="rounded-2xl p-3" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                🏆 Bảng Điểm
              </h3>
              <span className="text-[9px]" style={{ color: "rgba(139,163,204,0.5)" }}>{room.players.length} người</span>
            </div>
            <div className="space-y-1">
              {sortedScores.map((p, i) => (
                <ScoreRow
                  key={p.id}
                  rank={i + 1}
                  player={p}
                  score={p.score}
                  isCurrent={room.phase !== "waiting" && currentPlayer?.id === p.id}
                  isMe={p.socketId === socket?.id}
                  tokenColor={tokenColors[p.id] ?? "bg-white"}
                />
              ))}
            </div>
            <p className="mt-2 pt-2 text-[10px]" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", color: "rgba(139,163,204,0.5)" }}>
              Điểm = Tiền + Tài sản + Tự chủ×10 + Sức mạnh×5 &nbsp;·&nbsp;{" "}
              <span style={{ color: "#FF6B7A" }}>Tự chủ = 0 → thua</span>
            </p>
          </div>

          {/* Post-game discussion — the full ranking already lives in the
              leaderboard above and in GameOverModal, so this panel only adds
              the reflection questions instead of repeating scores. */}
          {room.phase === "finished" && (
            <div
              className="rounded-2xl p-4 space-y-2"
              style={{ background: "var(--bg-surface-1)", border: "1px solid var(--border-subtle)" }}
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
          )}

          {/* Bottom action */}
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="w-full py-2.5 rounded-xl text-xs font-medium transition-all"
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              color: "var(--text-secondary)",
              background: "rgba(255,255,255,0.02)",
              cursor: "pointer",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.02)"}
          >
            ↺ Ván Mới / Thoát
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
