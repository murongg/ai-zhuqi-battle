"use client";

import { useEffect, useState } from "react";
import GomokuClient from "./GomokuClient";
import XiangqiClient from "./XiangqiClient";

type GameMode = "gomoku" | "xiangqi";

const STORAGE_KEY = "llm-battle:game-mode";

export default function GameHubClient() {
  const [mode, setMode] = useState<GameMode>("gomoku");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "gomoku" || stored === "xiangqi") {
        setMode(stored);
      }
    } catch {
      // Ignore browser storage errors.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore browser storage errors.
    }
  }, [hydrated, mode]);

  return (
    <>
      <header className="gameSwitcher">
        <button
          className={mode === "gomoku" ? "active" : ""}
          onClick={() => setMode("gomoku")}
          type="button"
        >
          五子棋
        </button>
        <button
          className={mode === "xiangqi" ? "active" : ""}
          onClick={() => setMode("xiangqi")}
          type="button"
        >
          中国象棋
        </button>
      </header>

      {mode === "gomoku" ? <GomokuClient /> : <XiangqiClient />}
    </>
  );
}
