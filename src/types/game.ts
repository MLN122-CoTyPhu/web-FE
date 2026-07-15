// ============================================
// TYPES - Cờ Tỷ Phú Toàn Cầu (frontend mirror)
// ============================================

export type PlayerRole = "developing_country" | "financial_capital" | "vietnam";

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  position: number;       // vị trí trên bàn cờ (0–39)
  money: number;          // tư bản
  autonomy: number;       // tự chủ kinh tế (0–100)
  softPower: number;      // quyền lực mềm (0–100)
  skipTurns: number;      // số lượt bị bỏ (bị chi phối hoàn toàn — ô 30)
  isActive: boolean;
  hasLeft: boolean;       // true = thoát chủ động, không thể reconnect
  socketId: string;
  ownedCells: number[];   // các ô (id) đã thâu tóm được
}

export type CellType =
  | "financial_capital"   // tư bản tài chính (IMF, World Bank...)
  | "conglomerate"        // tập đoàn độc quyền
  | "consortium"          // liên minh tài chính
  | "tnc"                 // công ty xuyên quốc gia
  | "vietnam"             // ô Việt Nam
  | "start"               // ô xuất phát
  | "crisis"              // khủng hoảng tín dụng
  | "free"                // ô trung lập

export interface BoardCell {
  id: number;
  name: string;
  type: CellType;
  description: string;
  effect: CellEffect;

  // ── Cơ chế sở hữu — mua bằng quiz + thu phí thuê (rent) ──────────────────
  ownable?: boolean;
  price?: number;
  rent?: number;
  rentAutonomy?: number;
  quiz?: QuizQuestion;
}

// ============================================
// QUIZ — cơ chế "thâu tóm" độc quyền qua câu hỏi kiến thức
// ============================================
export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

// Phiên bản gửi từ server khi quiz bắt đầu — không có correctIndex
export interface QuizSession {
  cellId: number;
  cellName: string;
  playerId: string;
  question: string;
  options: string[];
  price: number;
  expiresAt: number;  // epoch ms — hết giờ trả lời (30s)
}

export interface QuizResult {
  correct: boolean;
  correctIndex: number;
  cellId: number;
  cellName: string;
  playerId: string;
  purchased: boolean;
}

export interface CellEffect {
  money?: number;          // + thêm hoặc - bớt tiền
  autonomy?: number;       // thay đổi tự chủ
  softPower?: number;      // thay đổi Quyền lực mềm
  drawCard?: boolean;      // rút thẻ
  drawCardType?: CardType; // loại thẻ cụ thể (nếu không có → rút ngẫu nhiên)
  councilVote?: boolean;   // kích hoạt hội đồng tư vấn
  allPlayers?: boolean;    // áp dụng cho tất cả người chơi
  skipTurns?: number;      // số lượt bị bỏ tiếp theo
}

export type CardType = "state_policy" | "financial_capital" | "globalization";

export interface EventCard {
  id: string;
  type: CardType;
  title: string;
  description: string;
  effect: CellEffect;
}

export type GamePhase =
  | "waiting"     // chờ đủ người
  | "playing"     // đang chơi
  | "voting"      // đang vote hội đồng
  | "quiz"        // đang trả lời quiz để mua ô
  | "finished"    // kết thúc

export interface VoteSession {
  question: string;
  cellName: string;
  cellDescription: string;
  options: string[];
  votes: Record<string, number>;    // playerId → index option
  initiatedBy: string;
  // Hiệu ứng của từng lựa chọn — dùng để hiển thị trên UI biểu quyết
  acceptEffect: { money?: number; autonomy?: number; softPower?: number };
  refuseEffect: { money?: number; autonomy?: number; softPower?: number };
}

export interface GameRoom {
  id: string;
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  hostId: string;           // socketId của người tạo phòng
  currentTurnIndex: number;
  turnNumber: number;
  hasRolled: boolean;       // player chỉ được tung 1 lần mỗi lượt
  lastEvent: string | null;
  voteSession: VoteSession | null;
  quizSession: QuizSession | null;
  cellOwners: Record<number, string>;  // cellId → playerId
  log: string[];            // feed sự kiện
}

// Socket events
export interface ServerToClientEvents {
  room_state: (room: GameRoom) => void;
  game_update: (room: GameRoom) => void;
  card_drawn: (card: EventCard, playerId: string) => void;
  vote_started: (vote: VoteSession) => void;
  vote_result: (result: { winner: string; votes: Record<string, number> }) => void;
  quiz_started: (quiz: QuizSession) => void;
  quiz_result: (result: QuizResult) => void;
  rent_paid: (data: { payerId: string; ownerId: string; cellId: number; amount: number }) => void;
  error: (msg: string) => void;
  reconnect_failed: () => void;
  player_joined: (player: Player) => void;
  player_left: (playerId: string) => void;
  dice_rolled: (playerId: string, value: number) => void;
}

export interface ClientToServerEvents {
  join_room: (data: { roomCode: string; playerName: string; role: PlayerRole }) => void;
  create_room: (data: { playerName: string; role: PlayerRole }) => void;
  reconnect_room: (data: { roomCode: string; playerName: string }) => void;
  start_game: () => void;
  roll_dice: () => void;
  cast_vote: (data: { optionIndex: number }) => void;
  answer_quiz: (data: { optionIndex: number }) => void;
  quiz_ready: () => void;
  end_turn: () => void;
  leave_room: () => void;
}
