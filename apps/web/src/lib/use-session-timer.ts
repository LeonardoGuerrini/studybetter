"use client";

import { useEffect, useState } from "react";
import type { StudySession } from "./types";

/**
 * Deriva o tempo decorrido do estado salvo no servidor (elapsedSeconds no
 * momento do fetch) + delta local — assim o timer sobrevive a reloads.
 */
export function useSessionTimer(session: StudySession | null): number {
  const [elapsed, setElapsed] = useState(session?.elapsedSeconds ?? 0);

  useEffect(() => {
    if (!session) {
      setElapsed(0);
      return;
    }

    const fetchedAt = Date.now();
    const compute = () => {
      const localDelta =
        session.status === "RUNNING"
          ? Math.floor((Date.now() - fetchedAt) / 1000)
          : 0;
      setElapsed(session.elapsedSeconds + localDelta);
    };

    compute();
    if (session.status !== "RUNNING") {
      return;
    }
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [session]);

  return elapsed;
}
