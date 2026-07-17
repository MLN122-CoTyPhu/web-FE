import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  GameRoom, EventCard, VoteSession, QuizSession, QuizResult, PlayerRole,
  ServerToClientEvents, ClientToServerEvents,
} from "../types/game";

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseGameSocketReturn {
  socket: GameSocket | null;
  room: GameRoom | null;
  lastCard: EventCard | null;
  voteSession: VoteSession | null;
  quizSession: QuizSession | null;
  lastQuizResult: QuizResult | null;
  diceAnimation: { playerId: string; value: number } | null;
  isRolling: boolean;
  isConnected: boolean;
  createRoom: (playerName: string, role: PlayerRole) => void;
  joinRoom: (roomCode: string, playerName: string, role: PlayerRole) => void;
  startGame: () => void;
  rollDice: () => void;
  castVote: (optionIndex: number) => void;
  answerQuiz: (optionIndex: number) => void;
  quizReady: () => void;
  endTurn: () => void;
  dismissCard: () => void;
  dismissQuizResult: () => void;
  leaveRoom: () => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export function useGameSocket(): UseGameSocketReturn {
  const socketRef = useRef<GameSocket | null>(null);
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [lastCard, setLastCard] = useState<EventCard | null>(null);
  const [voteSession, setVoteSession] = useState<VoteSession | null>(null);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [lastQuizResult, setLastQuizResult] = useState<QuizResult | null>(null);
  const [diceAnimation, setDiceAnimation] = useState<{ playerId: string; value: number } | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket: GameSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;
    queueMicrotask(() => setSocket(socket));

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("✅ Connected to socket server");

      const savedRoom = localStorage.getItem("co_ty_phu_room");
      const savedName = localStorage.getItem("co_ty_phu_name");
      if (savedRoom && savedName) {
        socket.emit("reconnect_room", { roomCode: savedRoom, playerName: savedName });
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
    });

    socket.io.on("reconnect_attempt", (attempt: number) => {
      console.warn(`Socket reconnect attempt ${attempt}`);
    });

    socket.io.on("reconnect", (attempt: number) => {
      console.log(`Socket reconnected after ${attempt} attempts`);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.warn("Socket disconnected:", reason);
    });

    socket.on("room_state", (newRoom) => {
      // Save roomCode so reconnect works after page navigation/refresh
      localStorage.setItem("co_ty_phu_room", newRoom.roomCode);
      setRoom(newRoom);
    });

    socket.on("game_update", (newRoom) => {
      setRoom({ ...newRoom }); // spread để trigger re-render
    });

    socket.on("card_drawn", (card) => {
      setLastCard(card);
      // Auto clear sau 8 giây
      setTimeout(() => setLastCard(null), 8000);
    });

    socket.on("vote_started", (vote) => {
      setVoteSession(vote);
    });

    socket.on("vote_result", () => {
      setVoteSession(null);
    });

    socket.on("quiz_started", (quiz) => {
      setQuizSession(quiz);
      setLastQuizResult(null);
    });

    socket.on("quiz_result", (result) => {
      setQuizSession(null);
      setLastQuizResult(result);
      // Auto clear sau 6 giây
      setTimeout(() => setLastQuizResult(null), 6000);
    });

    socket.on("dice_rolled", (playerId, value) => {
      setIsRolling(false);
      setDiceAnimation({ playerId, value });
      setTimeout(() => setDiceAnimation(null), 2000);
    });

    socket.on("reconnect_failed", () => {
      // Room no longer exists (server restarted or expired) — clear stale data and go home
      localStorage.removeItem("co_ty_phu_room");
      localStorage.removeItem("co_ty_phu_name");
      localStorage.removeItem("co_ty_phu_role");
      window.location.replace("/tro-choi");
    });

    socket.on("error", (msg) => {
      console.error("Socket error:", msg);
      alert(`⚠️ ${msg}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback((playerName: string, role: PlayerRole) => {
    localStorage.setItem("co_ty_phu_name", playerName);
    localStorage.setItem("co_ty_phu_role", role);
    socketRef.current?.emit("create_room", { playerName, role });
  }, []);

  const joinRoom = useCallback((roomCode: string, playerName: string, role: PlayerRole) => {
    localStorage.setItem("co_ty_phu_room", roomCode);
    localStorage.setItem("co_ty_phu_name", playerName);
    localStorage.setItem("co_ty_phu_role", role);
    socketRef.current?.emit("join_room", { roomCode, playerName, role });
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit("start_game");
  }, []);

  const rollDice = useCallback(() => {
    setIsRolling(true);
    socketRef.current?.emit("roll_dice");
  }, []);

  const castVote = useCallback((optionIndex: number) => {
    socketRef.current?.emit("cast_vote", { optionIndex });
  }, []);

  const answerQuiz = useCallback((optionIndex: number) => {
    socketRef.current?.emit("answer_quiz", { optionIndex });
  }, []);

  const quizReady = useCallback(() => {
    socketRef.current?.emit("quiz_ready");
  }, []);

  const dismissQuizResult = useCallback(() => {
    setLastQuizResult(null);
  }, []);

  const endTurn = useCallback(() => {
    socketRef.current?.emit("end_turn");
  }, []);

  const dismissCard = useCallback(() => {
    setLastCard(null);
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit("leave_room");
    localStorage.removeItem("co_ty_phu_room");
    localStorage.removeItem("co_ty_phu_name");
    localStorage.removeItem("co_ty_phu_role");
  }, []);

  return {
    socket,
    room,
    lastCard,
    voteSession,
    quizSession,
    lastQuizResult,
    diceAnimation,
    isRolling,
    isConnected,
    createRoom,
    joinRoom,
    startGame,
    rollDice,
    castVote,
    answerQuiz,
    quizReady,
    endTurn,
    dismissCard,
    dismissQuizResult,
    leaveRoom,
  };
}
