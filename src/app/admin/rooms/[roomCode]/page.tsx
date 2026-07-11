"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminApi, AdminRoomDetail } from "@/lib/adminApi";
import RefreshButton from "@/components/RefreshButton";

const ROLE_LABEL: Record<string, string> = {
  developing_country: "🌏 Nước đang phát triển",
  vietnam: "Việt Nam",
  financial_capital: "💰 Tư bản tài chính",
};

export default function AdminRoomDetailPage() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;

  const [detail, setDetail] = useState<AdminRoomDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyPlayerId, setBusyPlayerId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getRoom(roomCode);
      setDetail(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được phòng.");
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReward = async (playerRowId: string) => {
    setBusyPlayerId(playerRowId);
    try {
      await adminApi.markPlayerReward(roomCode, playerRowId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đánh dấu được phát thưởng.");
    } finally {
      setBusyPlayerId(null);
    }
  };

  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;
  if (!detail) return <p style={{ color: "var(--text-secondary)" }}>Đang tải...</p>;

  const { room, players } = detail;
  const isFinished = room.status === "finished";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/rooms" className="text-sm" style={{ color: "var(--text-secondary)" }}>
          ← Danh sách phòng
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <h1 className="text-2xl font-bold font-mono" style={{ color: "var(--gold-400)" }}>
            {room.room_code}
          </h1>
          <RefreshButton onClick={load} loading={loading} />
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Chủ phòng: {room.host_name} · Trạng thái: {room.live_phase ?? room.status} · Tạo lúc{" "}
          {new Date(room.created_at).toLocaleString("vi-VN")}
          {room.finished_at && ` · Kết thúc lúc ${new Date(room.finished_at).toLocaleString("vi-VN")}`}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--bg-surface-1)", color: "var(--text-secondary)" }}>
              <th className="text-left px-4 py-2.5">Hạng</th>
              <th className="text-left px-4 py-2.5">Người chơi</th>
              <th className="text-left px-4 py-2.5">Vai trò</th>
              <th className="text-left px-4 py-2.5">Tiền</th>
              <th className="text-left px-4 py-2.5">Tự chủ</th>
              <th className="text-left px-4 py-2.5">Quyền lực mềm</th>
              <th className="text-left px-4 py-2.5">Điểm</th>
              <th className="text-left px-4 py-2.5">Trạng thái</th>
              {isFinished && <th className="text-left px-4 py-2.5">Thưởng</th>}
            </tr>
          </thead>
          <tbody>
            {players.map(p => (
              <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <td className="px-4 py-2.5">{p.is_winner ? "🥇" : p.final_rank ?? "—"}</td>
                <td className="px-4 py-2.5 font-semibold">{p.player_name}</td>
                <td className="px-4 py-2.5">{ROLE_LABEL[p.role] ?? p.role}</td>
                <td className="px-4 py-2.5">{p.final_money ?? "—"}</td>
                <td className="px-4 py-2.5">{p.final_autonomy ?? "—"}</td>
                <td className="px-4 py-2.5">{p.final_soft_power ?? "—"}</td>
                <td className="px-4 py-2.5">{p.final_score ?? "—"}</td>
                <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>
                  {p.has_left ? "Đã rời phòng" : p.is_active ? "Đang hoạt động" : "Mất kết nối"}
                </td>
                {isFinished && (
                  <td className="px-4 py-2.5">
                    {p.final_rank == null ? (
                      "—"
                    ) : p.reward_given ? (
                      <span style={{ color: "var(--success)" }} title={p.reward_given_at ? new Date(p.reward_given_at).toLocaleString("vi-VN") : undefined}>
                        ✅ Đã phát
                      </span>
                    ) : (
                      <button
                        onClick={() => handleReward(p.id)}
                        disabled={busyPlayerId === p.id}
                        className="text-xs px-3 py-1.5 rounded-lg btn-gold"
                      >
                        {busyPlayerId === p.id ? "..." : "Đánh dấu đã phát"}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
