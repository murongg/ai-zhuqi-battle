"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SideConfigPanel } from "../components/gomoku/SideConfigPanel";
import { drawBoard, CANVAS_SIZE, type BoardMove } from "../lib/boardCanvas";
import {
  applyMove,
  BLACK,
  boardToCompactText,
  checkWin,
  createBoard,
  generateCandidateMoves,
  isBoardFull,
  isLegalMove,
  opponent,
  playerLabel,
  WHITE,
  type Board,
  type Player,
} from "../lib/game";
import { pickFallbackMove } from "../lib/gomoku/fallback";
import { requestLLMCompletion } from "../lib/gomoku/llm-client";
import { parseMoveFromLLMText } from "../lib/gomoku/move-parser";
import { buildMovePrompt } from "../lib/gomoku/prompt";
import { createInitialConversations, sideFromPlayer } from "../lib/gomoku/conversation";
import {
  type AIConversations,
  type EffectiveConfig,
  type EffectiveSideConfig,
  type LLMProxyPayload,
  type MoveCommitMeta,
  type MoveHistoryItem,
  type SideConfigInput,
} from "../lib/gomoku/types";
import {
  useSharedSideLLMConfig,
} from "../lib/hooks/use-shared-side-llm-config";

const AI_CONFIG_STORAGE_KEYS = {
  black: "gomoku:ai:black",
  white: "gomoku:ai:white",
} as const;

export default function GomokuClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [board, setBoard] = useState<Board>(() => createBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(BLACK);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<Player | 0 | null>(null);
  const [lastMove, setLastMove] = useState<BoardMove | null>(null);
  const [lastReason, setLastReason] = useState<string>("");
  const [thinking, setThinking] = useState<boolean>(false);
  const [started, setStarted] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const {
    blackConfig: blackAI,
    whiteConfig: whiteAI,
    setBlackConfig: setBlackAI,
    setWhiteConfig: setWhiteAI,
  } = useSharedSideLLMConfig({
    blackStorageKey: AI_CONFIG_STORAGE_KEYS.black,
    whiteStorageKey: AI_CONFIG_STORAGE_KEYS.white,
  });

  const [speedMs, setSpeedMs] = useState<number>(250);
  const [stats, setStats] = useState({ black: 0, white: 0, draw: 0 });
  const [moveHistory, setMoveHistory] = useState<MoveHistoryItem[]>([]);
  const [aiConversations, setAiConversations] = useState<AIConversations>(() =>
    createInitialConversations(),
  );

  const effectiveConfig = useMemo<EffectiveConfig>(() => {
    const build = (input: SideConfigInput): EffectiveSideConfig => {
      const apiUrl = input.apiUrl.trim();
      const model = input.model.trim();
      const ready = Boolean(apiUrl && model && input.apiKey.trim());
      return {
        model,
        ready,
      };
    };

    return {
      black: build(blackAI),
      white: build(whiteAI),
    };
  }, [blackAI, whiteAI]);

  const activeModel = currentPlayer === BLACK ? effectiveConfig.black.model : effectiveConfig.white.model;
  const currentSideReady = currentPlayer === BLACK ? effectiveConfig.black.ready : effectiveConfig.white.ready;

  const blackThoughts = useMemo(
    () =>
      moveHistory
        .filter((item) => item.player === BLACK && item.thinking)
        .slice(-12)
        .reverse(),
    [moveHistory],
  );

  const whiteThoughts = useMemo(
    () =>
      moveHistory
        .filter((item) => item.player === WHITE && item.thinking)
        .slice(-12)
        .reverse(),
    [moveHistory],
  );

  const restartGame = useCallback(() => {
    setBoard(createBoard());
    setCurrentPlayer(BLACK);
    setGameOver(false);
    setWinner(null);
    setLastMove(null);
    setLastReason("");
    setThinking(false);
    setStarted(false);
    setError("");
    setMoveHistory([]);
    setAiConversations(createInitialConversations());
  }, []);

  const clearStats = useCallback(() => {
    setStats({ black: 0, white: 0, draw: 0 });
  }, []);

  const commitMove = useCallback(
    (baseBoard: Board, row: number, col: number, player: Player, meta: MoveCommitMeta = {}): boolean => {
      const nextBoard = applyMove(baseBoard, row, col, player);
      if (!nextBoard) {
        return false;
      }

      const moveReason = meta.reason || "";

      setBoard(nextBoard);
      setLastMove({ row, col, player });
      setLastReason(moveReason);

      setMoveHistory((prev) => [
        ...prev,
        {
          turn: prev.length + 1,
          player,
          row,
          col,
          reason: moveReason,
          thinking: meta.thinking || "",
          model: meta.model || "",
        },
      ]);

      if (checkWin(nextBoard, row, col, player)) {
        setGameOver(true);
        setWinner(player);
        setStats((prevStats) => {
          if (player === BLACK) {
            return { ...prevStats, black: prevStats.black + 1 };
          }
          return { ...prevStats, white: prevStats.white + 1 };
        });
        return true;
      }

      if (isBoardFull(nextBoard)) {
        setGameOver(true);
        setWinner(0);
        setStats((prevStats) => ({ ...prevStats, draw: prevStats.draw + 1 }));
        return true;
      }

      setCurrentPlayer(opponent(player));
      return true;
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    drawBoard(context, board, lastMove);
  }, [board, lastMove]);

  useEffect(() => {
    if (gameOver || !started) {
      return;
    }

    if (!currentSideReady) {
      setError(`${playerLabel(currentPlayer)}未配置完整的 API URL / Model / API Key`);
      setThinking(false);
      return;
    }

    const player = currentPlayer;
    const currentBoard = board;
    const currentHistory = moveHistory;
    const sideInput = player === BLACK ? blackAI : whiteAI;
    const side = sideFromPlayer(player);
    const currentConversation = aiConversations[side];
    const controller = new AbortController();

    const timerId = setTimeout(async () => {
      const candidates = generateCandidateMoves(currentBoard, player, 14);
      const fallback = pickFallbackMove(currentBoard, candidates);

      setThinking(true);
      setError("");

      try {
        const prompt = buildMovePrompt({
          board: currentBoard,
          player,
          moveHistory: currentHistory,
          candidateMoves: candidates,
        });
        const turnUserMessage = { role: "user" as const, content: prompt };

        const payload: LLMProxyPayload = {
          llm: {
            baseURL: sideInput.apiUrl.trim(),
            model: sideInput.model.trim(),
            apiKey: sideInput.apiKey.trim(),
            temperature: 0.2,
          },
          messages: [...currentConversation, turnUserMessage],
        };

        const data = await requestLLMCompletion(payload, controller.signal);
        const parsed = parseMoveFromLLMText(data.text);
        const assistantMessage = { role: "assistant" as const, content: data.text };

        setAiConversations((prev) => ({
          ...prev,
          [side]: [...prev[side], turnUserMessage, assistantMessage],
        }));

        let selected = parsed;
        if (!selected || !isLegalMove(currentBoard, selected.row, selected.col)) {
          if (!fallback) {
            throw new Error("没有可用落子点");
          }

          selected = {
            row: fallback.row,
            col: fallback.col,
            reason: "LLM输出无效，使用前端保底候选",
            thinking: parsed?.thinking || "",
          };

          setError("LLM输出非法，已使用前端保底候选点");
        }

        commitMove(currentBoard, selected.row, selected.col, player, {
          reason: selected.reason || "LLM落子",
          thinking: selected.thinking || "",
          model: data.model || sideInput.model,
        });
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        const message = err instanceof Error ? err.message : "未知错误";
        setError(`LLM调用失败：${message}`);
      } finally {
        if (!controller.signal.aborted) {
          setThinking(false);
        }
      }
    }, speedMs);

    return () => {
      clearTimeout(timerId);
      controller.abort();
    };
  }, [
    blackAI,
    aiConversations,
    board,
    commitMove,
    currentPlayer,
    currentSideReady,
    gameOver,
    started,
    moveHistory,
    speedMs,
    whiteAI,
  ]);

  const statusText = useMemo(() => {
    if (gameOver) {
      if (winner === 0) {
        return "平局";
      }
      return `${playerLabel(winner as Player)}获胜`;
    }

    if (!started) {
      if (!effectiveConfig.black.ready || !effectiveConfig.white.ready) {
        return "请先配置黑白双方 API URL / Model / API Key，然后点击开始对战";
      }
      return "已就绪，点击“开始对战”";
    }

    if (thinking) {
      return `${playerLabel(currentPlayer)}（${activeModel}）思考中...`;
    }

    if (!currentSideReady) {
      return `${playerLabel(currentPlayer)}未配置完整参数`;
    }

    return `${playerLabel(currentPlayer)}（${activeModel}）等待落子`;
  }, [activeModel, currentPlayer, currentSideReady, effectiveConfig.black.ready, effectiveConfig.white.ready, gameOver, started, thinking, winner]);

  const boardSummary = useMemo(() => boardToCompactText(board), [board]);

  return (
    <main className="app">
      <SideConfigPanel
        sideName="黑方"
        config={blackAI}
        effective={effectiveConfig.black}
        thoughts={blackThoughts}
        isThinking={started && !gameOver && currentPlayer === BLACK && thinking}
        onChange={(patch) => setBlackAI((prev) => ({ ...prev, ...patch }))}
      />

      <section className="centerPanel">
        <h1>五子棋 · 双 LLM 对战</h1>
        <p className="sub">黑白双方均由 LLM 控制</p>

        <div className="centerControls">
          <label>
            每步间隔（毫秒）
            <input
              type="range"
              min="120"
              max="1500"
              step="20"
              value={speedMs}
              onChange={(event) => setSpeedMs(Number(event.target.value))}
            />
            <span>{speedMs}</span>
          </label>
        </div>

        <div className="actions">
          <button onClick={() => setStarted(true)} disabled={started || gameOver}>
            开始对战
          </button>
          <button onClick={restartGame}>重新开始</button>
          <button className="ghost" onClick={clearStats}>
            清空战绩
          </button>
        </div>

        <p className="status">{statusText}</p>
        {lastReason ? <p className="reason">上一步理由：{lastReason}</p> : null}
        {error ? <p className="error">{error}</p> : null}

        <div className="boardWrap">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="board"
            aria-label="五子棋棋盘"
          />
        </div>

        <div className="stats">
          <div>
            <span>黑胜</span>
            <strong>{stats.black}</strong>
          </div>
          <div>
            <span>白胜</span>
            <strong>{stats.white}</strong>
          </div>
          <div>
            <span>平局</span>
            <strong>{stats.draw}</strong>
          </div>
        </div>

        <details className="summary">
          <summary>当前棋局摘要（发送给 LLM）</summary>
          <p>黑子：{boardSummary.black || "无"}</p>
          <p>白子：{boardSummary.white || "无"}</p>
          <p>总手数：{moveHistory.length}</p>
        </details>
      </section>

      <SideConfigPanel
        sideName="白方"
        config={whiteAI}
        effective={effectiveConfig.white}
        thoughts={whiteThoughts}
        isThinking={started && !gameOver && currentPlayer === WHITE && thinking}
        onChange={(patch) => setWhiteAI((prev) => ({ ...prev, ...patch }))}
      />
    </main>
  );
}
