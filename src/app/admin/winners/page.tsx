"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminApi, AdminRoomSummary } from "@/lib/adminApi";
import RefreshButton from "@/components/RefreshButton";

const ROLE_LABEL: Record<string, string> = {
  developing_country: "🌏 Nước đang phát triển",
  vietnam: "Việt Nam",
  financial_capital: "💰 Tư bản tài chính",
};

export default function AdminWinnersPage() {
  const [onlyPending, setOnlyPending] = useState(true);
  const [rooms, setRooms] = useState<AdminRoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyRoom, setBusyRoom] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { rooms } = await adminApi.listWinners(onlyPending ? false : undefined);
      setRooms(rooms);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách.");
    } finally {
      setLoading(false);
    }
  }, [onlyPending]);

  useEffect(() => {
    load();
  }, [load]);

  const handleQuickReward = async (roomCode: string) => {
    setBusyRoom(roomCode);
    try {
      await adminApi.markReward(roomCode);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đánh dấu được phát thưởng.");
    } finally {
      setBusyRoom(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Phát thưởng
          </h1>
          <RefreshButton onClick={load} loading={loading} />
        </div>
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <input type="checkbox" checked={onlyPending} onChange={e => setOnlyPending(e.target.checked)} />
          Chỉ hiện ván chưa phát thưởng
        </label>
      </div>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Đang tải...</p>
      ) : rooms.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>
          {onlyPending ? "Không có ván nào đang chờ phát thưởng." : "Chưa có ván nào kết thúc."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-surface-1)", color: "var(--text-secondary)" }}>
                <th className="text-left px-4 py-2.5">Mã phòng</th>
                <th className="text-left px-4 py-2.5">Người thắng</th>
                <th className="text-left px-4 py-2.5">Vai trò</th>
                <th className="text-left px-4 py-2.5">Điểm</th>
                <th className="text-left px-4 py-2.5">Kết thúc lúc</th>
                <th className="text-left px-4 py-2.5">Thưởng</th>
                <th className="text-left px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/rooms/${room.room_code}`} className="font-mono font-bold" style={{ color: "var(--gold-400)" }}>
                      {room.room_code}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 font-semibold">{room.winner_name}</td>
                  <td className="px-4 py-2.5">{ROLE_LABEL[room.winner_role ?? ""] ?? room.winner_role}</td>
                  <td className="px-4 py-2.5">{room.winner_score}</td>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                    {room.finished_at && new Date(room.finished_at).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-2.5">{room.reward_given ? "✅ Đã phát" : "⚠️ Chưa phát"}</td>
                  <td className="px-4 py-2.5">
                    {!room.reward_given && (
                      <button
                        onClick={() => handleQuickReward(room.room_code)}
                        disabled={busyRoom === room.room_code}
                        className="text-xs px-3 py-1.5 rounded-lg btn-gold"
                      >
                        {busyRoom === room.room_code ? "..." : "Đánh dấu đã phát"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
