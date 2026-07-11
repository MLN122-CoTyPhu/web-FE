const API_BASE = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export interface AdminRoomSummary {
  id: string;
  room_code: string;
  status: "waiting" | "playing" | "finished";
  host_name: string;
  created_at: string;
  finished_at: string | null;
  winner_name: string | null;
  winner_role: string | null;
  winner_score: number | null;
  reward_given: boolean;
  reward_given_at: string | null;
  reward_note: string | null;
  player_count: number;
  live_phase: string | null;
  // Chỉ có khi lấy từ /admin/rooms (list) — /admin/winners chưa kèm theo.
  players?: AdminRoomPlayer[];
}

export interface AdminRoomPlayer {
  id: string;
  room_id: string;
  player_name: string;
  role: string;
  is_active: boolean;
  has_left: boolean;
  final_money: number | null;
  final_autonomy: number | null;
  final_soft_power: number | null;
  final_score: number | null;
  final_rank: number | null;
  is_winner: boolean;
  reward_given: boolean;
  reward_given_at: string | null;
  reward_note: string | null;
}

export interface AdminRoomDetail {
  room: AdminRoomSummary & { live_log: string[] | null };
  players: AdminRoomPlayer[];
}

class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new AdminApiError(body.error || `Yêu cầu thất bại (${res.status})`, res.status);
  }

  return res.json() as Promise<T>;
}

export const adminApi = {
  login: (password: string) =>
    request<{ ok: true }>("/admin/login", { method: "POST", body: JSON.stringify({ password }) }),

  logout: () => request<{ ok: true }>("/admin/logout", { method: "POST" }),

  me: () => request<{ ok: true }>("/admin/me"),

  listRooms: (params: { status?: string; search?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.search) qs.set("search", params.search);
    const query = qs.toString();
    return request<{ rooms: AdminRoomSummary[] }>(`/admin/rooms${query ? `?${query}` : ""}`);
  },

  getRoom: (roomCode: string) => request<AdminRoomDetail>(`/admin/rooms/${roomCode}`),

  listWinners: (rewardGiven?: boolean) => {
    const qs = rewardGiven === undefined ? "" : `?rewardGiven=${rewardGiven}`;
    return request<{ rooms: AdminRoomSummary[] }>(`/admin/winners${qs}`);
  },

  markReward: (roomCode: string, note?: string) =>
    request<{ room: AdminRoomSummary }>(`/admin/rooms/${roomCode}/reward`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),

  markPlayerReward: (roomCode: string, playerRowId: string, note?: string) =>
    request<{ player: AdminRoomPlayer }>(`/admin/rooms/${roomCode}/players/${playerRowId}/reward`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),
};

export { AdminApiError };
