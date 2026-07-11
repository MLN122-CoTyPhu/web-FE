"use client";

import { Fragment, useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { adminApi, AdminRoomSummary } from "@/lib/adminApi";
import RefreshButton from "@/components/RefreshButton";

const STATUS_LABEL: Record<string, string> = {
  waiting: "⏳ Đang chờ",
  playing: "🎮 Đang chơi",
  finished: "🏁 Đã kết thúc",
};

const ROLE_LABEL: Record<string, string> = {
  developing_country: "🌏 Nước đang phát triển",
  vietnam: "🇻🇳 Việt Nam",
  financial_capital: "💰 Tư bản tài chính",
};

const RANK_OPTIONS = [1, 2, 3, 4, 5, 6];

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<AdminRoomSummary[]>([]);
  const [status, setStatus] = useState("");
  const [rank, setRank] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { rooms } = await adminApi.listRooms({ status: status || undefined, search: search || undefined });
      setRooms(rooms);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách phòng.");
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReward = async (roomCode: string, playerRowId: string) => {
    setBusyKey(playerRowId);
    try {
      await adminApi.markPlayerReward(roomCode, playerRowId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đánh dấu được phát thưởng.");
    } finally {
      setBusyKey(null);
    }
  };

  const rankNum = rank ? Number(rank) : null;

  // Khi lọc theo hạng: chỉ giữ phòng đã kết thúc và có người ở đúng hạng đó,
  // để admin phát thưởng hàng loạt cho 1 hạng (vd hạng 2) mà không cần mở từng phòng.
  const rankRows = useMemo(() => {
    if (rankNum == null) return [];
    return rooms
      .filter(r => r.status === "finished")
      .map(r => ({ room: r, player: (r.players ?? []).find(p => p.final_rank === rankNum) }))
      .filter((r): r is { room: AdminRoomSummary; player: NonNullable<typeof r.player> } => !!r.player);
  }, [rooms, rankNum]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Danh sách phòng
          </h1>
          <RefreshButton onClick={load} loading={loading} />
        </div>
        <div className="flex gap-2">
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ background: "var(--bg-surface-2)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-primary)" }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="waiting">Đang chờ</option>
            <option value="playing">Đang chơi</option>
            <option value="finished">Đã kết thúc</option>
          </select>
          <select
            value={rank}
            onChange={e => setRank(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ background: "var(--bg-surface-2)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-primary)" }}
            title="Lọc theo hạng để phát thưởng hàng loạt"
          >
            <option value="">Tất cả hạng</option>
            {RANK_OPTIONS.map(n => (
              <option key={n} value={n}>
                Hạng {n}
              </option>
            ))}
          </select>
          <input
            placeholder="Tìm mã phòng..."
            value={search}
            onChange={e => setSearch(e.target.value.toUpperCase())}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ background: "var(--bg-surface-2)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-primary)" }}
          />
        </div>
      </div>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Đang tải...</p>
      ) : rankNum != null ? (
        // ── CHẾ ĐỘ LỌC THEO HẠNG — phát thưởng hàng loạt ──────────────────────
        rankRows.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>Không có phòng nào đã kết thúc có người ở hạng {rankNum}.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg-surface-1)", color: "var(--text-secondary)" }}>
                  <th className="text-left px-4 py-2.5">Mã phòng</th>
                  <th className="text-left px-4 py-2.5">Người chơi (Hạng {rankNum})</th>
                  <th className="text-left px-4 py-2.5">Vai trò</th>
                  <th className="text-left px-4 py-2.5">Điểm</th>
                  <th className="text-left px-4 py-2.5">Kết thúc lúc</th>
                  <th className="text-left px-4 py-2.5">Thưởng</th>
                </tr>
              </thead>
              <tbody>
                {rankRows.map(({ room, player }) => (
                  <tr key={room.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/rooms/${room.room_code}`} className="font-mono font-bold" style={{ color: "var(--gold-400)" }}>
                        {room.room_code}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 font-semibold">{player.player_name}</td>
                    <td className="px-4 py-2.5">{ROLE_LABEL[player.role] ?? player.role}</td>
                    <td className="px-4 py-2.5">{player.final_score ?? "—"}</td>
                    <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                      {room.finished_at && new Date(room.finished_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-2.5">
                      {player.reward_given ? (
                        <span style={{ color: "var(--success)" }}>✅ Đã phát</span>
                      ) : (
                        <button
                          onClick={() => handleReward(room.room_code, player.id)}
                          disabled={busyKey === player.id}
                          className="text-xs px-3 py-1.5 rounded-lg btn-gold"
                        >
                          {busyKey === player.id ? "..." : "Đánh dấu đã phát"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : rooms.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>Chưa có phòng nào.</p>
      ) : (
        // ── DANH SÁCH PHÒNG BÌNH THƯỜNG ───────────────────────────────────────
        <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-surface-1)", color: "var(--text-secondary)" }}>
                <th className="text-left px-4 py-2.5">Mã phòng</th>
                <th className="text-left px-4 py-2.5">Trạng thái</th>
                <th className="text-left px-4 py-2.5">Chủ phòng</th>
                <th className="text-left px-4 py-2.5">Số người</th>
                <th className="text-left px-4 py-2.5">Người thắng</th>
                <th className="text-left px-4 py-2.5">Kết thúc lúc</th>
                <th className="text-left px-4 py-2.5">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => {
                const isExpanded = expandedCode === room.room_code;
                return (
                  <Fragment key={room.id}>
                    <tr style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/admin/rooms/${room.room_code}`}
                          className="font-mono font-bold"
                          style={{ color: "var(--gold-400)" }}
                        >
                          {room.room_code}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">{STATUS_LABEL[room.status] ?? room.status}</td>
                      <td className="px-4 py-2.5">{room.host_name}</td>
                      <td className="px-4 py-2.5">{room.player_count}</td>
                      <td className="px-4 py-2.5">{room.winner_name ?? "—"}</td>
                      <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                        {room.finished_at ? new Date(room.finished_at).toLocaleString("vi-VN") : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => setExpandedCode(isExpanded ? null : room.room_code)}
                          className="text-xs px-3 py-1.5 rounded-lg"
                          style={{ border: "1px solid rgba(232,185,35,0.35)", color: "var(--gold-400)" }}
                        >
                          {isExpanded ? "Ẩn ▲" : "Xem ▼"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="px-4 py-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                          {(room.players ?? []).length === 0 ? (
                            <p style={{ color: "var(--text-secondary)" }}>Chưa có người chơi.</p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead>
                                <tr style={{ color: "var(--text-secondary)" }}>
                                  <th className="text-left px-2 py-1.5">Hạng</th>
                                  <th className="text-left px-2 py-1.5">Người chơi</th>
                                  <th className="text-left px-2 py-1.5">Vai trò</th>
                                  <th className="text-left px-2 py-1.5">Điểm</th>
                                  <th className="text-left px-2 py-1.5">Tiền</th>
                                  <th className="text-left px-2 py-1.5">Tự chủ</th>
                                  <th className="text-left px-2 py-1.5">Quyền lực mềm</th>
                                  {room.status === "finished" && <th className="text-left px-2 py-1.5">Thưởng</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {(room.players ?? []).map(p => (
                                  <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                    <td className="px-2 py-1.5">{p.is_winner ? "🥇" : p.final_rank ?? "—"}</td>
                                    <td className="px-2 py-1.5 font-semibold">{p.player_name}</td>
                                    <td className="px-2 py-1.5">{ROLE_LABEL[p.role] ?? p.role}</td>
                                    <td className="px-2 py-1.5">{p.final_score ?? "—"}</td>
                                    <td className="px-2 py-1.5">{p.final_money ?? "—"}</td>
                                    <td className="px-2 py-1.5">{p.final_autonomy ?? "—"}</td>
                                    <td className="px-2 py-1.5">{p.final_soft_power ?? "—"}</td>
                                    {room.status === "finished" && (
                                      <td className="px-2 py-1.5">
                                        {p.final_rank == null ? (
                                          "—"
                                        ) : p.reward_given ? (
                                          <span style={{ color: "var(--success)" }}>✅ Đã phát</span>
                                        ) : (
                                          <button
                                            onClick={() => handleReward(room.room_code, p.id)}
                                            disabled={busyKey === p.id}
                                            className="text-xs px-2 py-1 rounded-lg btn-gold"
                                          >
                                            {busyKey === p.id ? "..." : "Đánh dấu đã phát"}
                                          </button>
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
