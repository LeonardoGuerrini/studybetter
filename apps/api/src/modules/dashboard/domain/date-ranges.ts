import { APP_TIME_ZONE } from "../../../shared/constants/time";

/**
 * Utilitários de data no fuso do app (`APP_TIME_ZONE`, Brasília). Os limites de
 * dia/semana/mês são devolvidos como o **instante UTC** do início daquele período
 * no fuso de SP — assim as comparações com `endedAt` (armazenado em UTC) recaem
 * na "virada do dia" local, coerente com o streak.
 */

interface WallClock {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Componentes do relógio de parede de um instante, num fuso. */
function zonedParts(date: Date, timeZone: string): WallClock {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/**
 * Converte um relógio de parede (y/m/d h:m:s) de `timeZone` para o instante UTC.
 * Algoritmo de dois passos (chute UTC → mede o offset naquele instante → corrige),
 * robusto a DST. SP não tem DST, então é exato.
 */
function zonedWallClockToUtc(wall: WallClock, timeZone: string): Date {
  const utcGuess = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
    wall.second,
  );
  const shownAtGuess = zonedParts(new Date(utcGuess), timeZone);
  const shownUtc = Date.UTC(
    shownAtGuess.year,
    shownAtGuess.month - 1,
    shownAtGuess.day,
    shownAtGuess.hour,
    shownAtGuess.minute,
    shownAtGuess.second,
  );
  const offset = shownUtc - utcGuess; // ms que o fuso está à frente do UTC
  return new Date(utcGuess - offset);
}

/** Início do dia corrente (00:00 de Brasília), como instante UTC. */
export function startOfDay(date: Date): Date {
  const p = zonedParts(date, APP_TIME_ZONE);
  return zonedWallClockToUtc(
    { year: p.year, month: p.month, day: p.day, hour: 0, minute: 0, second: 0 },
    APP_TIME_ZONE,
  );
}

/** Início da semana corrente (segunda-feira 00:00 de Brasília), como instante UTC. */
export function startOfWeek(date: Date): Date {
  const p = zonedParts(date, APP_TIME_ZONE);
  // Aritmética de calendário ancorada em UTC (só a data importa aqui).
  const cal = new Date(Date.UTC(p.year, p.month - 1, p.day));
  const dow = cal.getUTCDay(); // 0 = domingo
  const diffToMonday = dow === 0 ? 6 : dow - 1;
  cal.setUTCDate(cal.getUTCDate() - diffToMonday);
  return zonedWallClockToUtc(
    {
      year: cal.getUTCFullYear(),
      month: cal.getUTCMonth() + 1,
      day: cal.getUTCDate(),
      hour: 0,
      minute: 0,
      second: 0,
    },
    APP_TIME_ZONE,
  );
}

/** Início do mês corrente (dia 1, 00:00 de Brasília), como instante UTC. */
export function startOfMonth(date: Date): Date {
  const p = zonedParts(date, APP_TIME_ZONE);
  return zonedWallClockToUtc(
    { year: p.year, month: p.month, day: 1, hour: 0, minute: 0, second: 0 },
    APP_TIME_ZONE,
  );
}

/** Chave YYYY-MM-DD do dia no fuso do app (Brasília). */
export function toSaoPauloDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(date);
}

/**
 * Dia anterior a uma chave YYYY-MM-DD. Aritmética de calendário ancorada em UTC —
 * exata para chaves de data (independe de fuso/DST, pois só manipula a data).
 */
export function prevDayKey(key: string): string {
  const anchor = new Date(`${key}T00:00:00Z`);
  anchor.setUTCDate(anchor.getUTCDate() - 1);
  return anchor.toISOString().slice(0, 10);
}
