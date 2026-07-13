import { describe, expect, it } from "vitest";
import { ConflictError } from "../../../shared/errors/AppError";
import {
  elapsedSeconds,
  finishSession,
  pauseSession,
  resetSession,
  resumeSession,
} from "./session-lifecycle";
import type { StudySession } from "./study-session";

function makeSession(overrides: Partial<StudySession> = {}): StudySession {
  const startedAt = new Date("2026-07-04T10:00:00Z");
  return {
    id: "session-1",
    userId: "user-1",
    subjectId: "subject-1",
    cycleId: null,
    status: "RUNNING",
    startedAt,
    endedAt: null,
    durationMinutes: null,
    accumulatedSeconds: 0,
    lastResumedAt: startedAt,
    notes: null,
    studyMethod: null,
    studyPeriod: null,
    studyDate: null,
    questionsCount: null,
    correctCount: null,
    pagesStudied: null,
    createdAt: startedAt,
    updatedAt: startedAt,
    ...overrides,
  };
}

describe("elapsedSeconds", () => {
  it("soma trechos acumulados com o trecho corrente", () => {
    const session = makeSession({
      accumulatedSeconds: 120,
      lastResumedAt: new Date("2026-07-04T10:00:00Z"),
    });
    expect(elapsedSeconds(session, new Date("2026-07-04T10:05:00Z"))).toBe(420);
  });

  it("retorna apenas o acumulado quando pausada", () => {
    const session = makeSession({
      status: "PAUSED",
      accumulatedSeconds: 300,
      lastResumedAt: null,
    });
    expect(elapsedSeconds(session, new Date())).toBe(300);
  });
});

describe("pauseSession", () => {
  it("acumula o tempo do trecho corrente e limpa lastResumedAt", () => {
    const session = makeSession({ accumulatedSeconds: 60 });
    const result = pauseSession(session, new Date("2026-07-04T10:10:00Z"));
    expect(result).toEqual({
      status: "PAUSED",
      accumulatedSeconds: 60 + 600,
      lastResumedAt: null,
    });
  });

  it("rejeita pausar sessão que não está em andamento", () => {
    expect(() =>
      pauseSession(makeSession({ status: "PAUSED" }), new Date()),
    ).toThrow(ConflictError);
    expect(() =>
      pauseSession(makeSession({ status: "FINISHED" }), new Date()),
    ).toThrow(ConflictError);
  });
});

describe("resumeSession", () => {
  it("retoma sessão pausada marcando o novo trecho", () => {
    const now = new Date("2026-07-04T11:00:00Z");
    const session = makeSession({ status: "PAUSED", lastResumedAt: null });
    expect(resumeSession(session, now)).toEqual({
      status: "RUNNING",
      lastResumedAt: now,
    });
  });

  it("rejeita retomar sessão que não está pausada", () => {
    expect(() => resumeSession(makeSession(), new Date())).toThrow(ConflictError);
  });
});

describe("resetSession", () => {
  it("zera o cronômetro e deixa a sessão pausada", () => {
    const session = makeSession({
      accumulatedSeconds: 900,
      lastResumedAt: new Date("2026-07-04T10:00:00Z"),
    });
    expect(resetSession(session, new Date())).toEqual({
      status: "PAUSED",
      accumulatedSeconds: 0,
      lastResumedAt: null,
    });
  });

  it("também reinicia uma sessão já pausada", () => {
    const session = makeSession({
      status: "PAUSED",
      accumulatedSeconds: 1800,
      lastResumedAt: null,
    });
    expect(resetSession(session, new Date()).accumulatedSeconds).toBe(0);
  });

  it("rejeita reiniciar sessão já finalizada", () => {
    expect(() =>
      resetSession(makeSession({ status: "FINISHED" }), new Date()),
    ).toThrow(ConflictError);
  });
});

describe("finishSession", () => {
  it("calcula a duração total em minutos (arredondada)", () => {
    const session = makeSession({
      accumulatedSeconds: 500,
      lastResumedAt: new Date("2026-07-04T10:00:00Z"),
    });
    const now = new Date("2026-07-04T10:20:10Z"); // +1210s no trecho corrente
    const result = finishSession(session, now);
    expect(result.status).toBe("FINISHED");
    expect(result.accumulatedSeconds).toBe(1710);
    expect(result.durationMinutes).toBe(29); // 1710s = 28.5min -> 29 (round)
    expect(result.endedAt).toEqual(now);
    expect(result.lastResumedAt).toBeNull();
  });

  it("finaliza sessão pausada usando apenas o acumulado", () => {
    const session = makeSession({
      status: "PAUSED",
      accumulatedSeconds: 1800,
      lastResumedAt: null,
    });
    expect(finishSession(session, new Date()).durationMinutes).toBe(30);
  });

  it("rejeita finalizar sessão já finalizada", () => {
    expect(() =>
      finishSession(makeSession({ status: "FINISHED" }), new Date()),
    ).toThrow(ConflictError);
  });
});
